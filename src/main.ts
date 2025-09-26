import {
  Blockfrost,
  CML as C,
  toHex,
  fromHex,
  Constr,
  Data,
  Lucid,
  LucidEvolution,
  credentialToRewardAddress,
  TxBuilder,
} from "@lucid-evolution/lucid";
import { apiResponse } from "./apiResponse.js";
import type { Assets, UTxO, OutRef, Script } from "@lucid-evolution/lucid";
import type {
  ApiUtxo,
  ApiMultiAsset,
  ApiData,
  ApiReferenceInput,
  FloatPoolDatum,
  LoanDatum,
  PoolDatum,
} from "./apiResponse.js";
import { encodeData } from "./schema.js";
import {UTxOTarget, OracleUtxoType, UtxoType} from './enum.js'

apiResponse.data.referenceInputs = apiResponse.data.referenceInputs.filter(
  (ref) => ref.type != "DANOGO_STAKING_SCRIPT"
);

// --- Type definitions for better code clarity and safety ---
const now = parseInt((apiResponse.data.outputs.floatPoolOutUtxo!.datum! as FloatPoolDatum).interestTime, 10);

const oracleOutputByOutRef = new Map<string, number>();

// IMPORTANT: Replace this with your actual 24-word seed phrase.
// It's recommended to load this from a secure environment variable.
const seedPhrase =
  "fork target sense patient museum unusual rough hair brief misery main duty below garbage pizza oval truth invite vessel father flame repair ketchup field";

// --- Helper functions to parse your API response ---

/** Converts the API's multi-asset format to Lucid's Assets format. */
const apiToAssets = (
  multiAssets: ApiMultiAsset[] | undefined,
  coin: string
): Assets => {
  const assets: Assets = { lovelace: BigInt(coin) };
  if (!multiAssets) return assets;

  for (const ma of multiAssets) {
    for (const asset of ma.assets) {
      const unit = ma.policyId + (asset.name || "");
      assets[unit] = BigInt(asset.value);
    }
  }
  return assets;
};

/** Converts the API's UTxO format to Lucid's UTxO format. */
const apiToUtxo = (apiUtxo: ApiUtxo | null): UTxO => {
  if (apiUtxo == null || apiUtxo == undefined || !apiUtxo?.outRef) {
    throw new Error("apiToUtxo: outRef is missing");
  }

  const [txHash, outputIndex] = apiUtxo.outRef.split("#"); // txHash and outputIndex are strings
  if (txHash === undefined || outputIndex === undefined) {
    throw new Error("apiToUtxo: Invalid outRef format");
  }

  return {
    txHash,
    outputIndex: parseInt(outputIndex),
    address: apiUtxo.address,
    assets: apiToAssets(apiUtxo.multiAssets, apiUtxo.coin),
  };
};
/** Converts the API's reference input format to Lucid's OutRef format. */
const apiToRefUtxo = (apiRef: ApiReferenceInput | undefined): OutRef | null => {
  if (!apiRef) return null;
  const [txHash, outputIndex] = apiRef.outRef.split("#");
  if (txHash === undefined || outputIndex === undefined) {
    throw new Error("apiToUtxo: Invalid outRef format");
  }
  return { txHash, outputIndex: parseInt(outputIndex) };
};

// Helper to split a token ID string "policy.assetName" into a tuple [policy, assetName]
const tokenIdToTuple = (tokenId: string): [string, Uint8Array] => {
  const emptyBytes = new Uint8Array(0);

  if (!tokenId) return ["", emptyBytes];

  const parts = tokenId.split(".");
  if (parts.length === 2) {
    const policy = parts[0] ?? "";
    const assetName = parts[1] ?? "";
    // only call fromHex when assetName is non-empty
    return [policy, assetName.length > 0 ? fromHex(assetName) : emptyBytes];
  }

  // No asset part -> return tokenId as policy and an empty asset bytearray
  return [tokenId, emptyBytes];
};

/**
 * Creates the redeemer for the 'CreateLoan' action based on the transaction body.
 * This function replicates the logic from your Kotlin snippet.
 * @param {Lucid} lucid - The Lucid instance.
 * @param {Tx} tx - The Lucid transaction object (partially built).
 * @param {ApiData} apiData - The 'data' part of your API response.
 * @returns {Promise<PlutusData>} The serialized PlutusData for the redeemer.
 */
const createLoanRedeemer = async (
  lucid: LucidEvolution, // Keep for utility functions if needed
  collateralUtxo: UTxO,
  apiData: ApiData
): Promise<string> => {
  // Returns CBOR string
  // We can determine indices without building a temporary transaction.
  // By constructing lists of inputs/outputs/refs from the API data and sorting
  // them canonically, we can find the correct index that the validator will see.

  // --- Get sorted input indices ---
  // The on-chain list of inputs includes ALL inputs, so we must add the user's
  // collateral UTXO to the list of script inputs before sorting.
  const allInputs = [
    apiToUtxo(apiData.inputs.poolInUtxo),
    apiToUtxo(apiData.inputs.floatPoolInUtxo),
    collateralUtxo, // Add the user's collateral UTXO
  ].sort(
    (a, b) => a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
  );

  const poolInUtxo = apiToUtxo(apiData.inputs.poolInUtxo);
  const poolInIndex = allInputs.findIndex(
    (inp) =>
      inp.txHash === poolInUtxo.txHash &&
      inp.outputIndex === poolInUtxo.outputIndex
  );
  if (poolInIndex === -1)
    throw new Error("Could not find poolInUtxo in transaction script inputs.");

  // --- Get sorted reference input indices ---
  const refInputs = apiData.referenceInputs
    .filter((r) => r.type !== "DANOGO_FLOAT_POOL")
    .map(apiToRefUtxo)
    .filter((r): r is OutRef => r !== null)
    .sort(
      (a, b) =>
        a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
    );

  const fixedProtocolScriptRef = apiToRefUtxo(
    apiData.referenceInputs.find((r) => r.type === "FIXED_PROTOCOL_SCRIPT")
  );
  const fixedProtocolConfigRef = apiToRefUtxo(
    apiData.referenceInputs.find((r) => r.type === "FIXED_PROTOCOL_CONFIG")
  );

  const protocolScriptRefIndex = refInputs.findIndex(
    (ref) =>
      ref.txHash === fixedProtocolScriptRef!.txHash &&
      ref.outputIndex === fixedProtocolScriptRef!.outputIndex
  );
  const protocolConfigRefIndex = refInputs.findIndex(
    (ref) =>
      ref.txHash === fixedProtocolConfigRef!.txHash &&
      ref.outputIndex === fixedProtocolConfigRef!.outputIndex
  );

  if (protocolScriptRefIndex === -1)
    throw new Error("Could not find fixed loan script reference input.");
  if (protocolConfigRefIndex === -1)
    throw new Error("Could not find fixed protocol config reference input.");

  // --- Get sorted output indices ---
  // The order of outputs is determined by the order they are added in the main function.
  // We replicate that order here to get the correct indices.
  const outputs = [
    apiData.outputs.floatPoolOutUtxo,
    apiData.outputs.poolOutUtxo,
    apiData.outputs.feeOutUtxo,
    apiData.outputs.loanOutUtxo,
  ].filter((o): o is ApiUtxo => o !== null);

  const poolOutIndex = outputs.findIndex(
    (out) => out.address === apiData.outputs.poolOutUtxo?.address
  );
  const loanOutIndex = outputs.findIndex(
    (out) => out.address === apiData.outputs.loanOutUtxo?.address
  );
  const feeOutIndex = outputs.findIndex(
    (out) => out.address === apiData.outputs.feeOutUtxo?.address
  );

  if (poolOutIndex === -1)
    throw new Error("Could not find poolOutUtxo in transaction outputs.");
  if (loanOutIndex === -1)
    throw new Error("Could not find loanOutUtxo in transaction outputs.");
  if (feeOutIndex === -1)
    throw new Error("Could not find feeOutUtxo in transaction outputs.");
  // build redeemer (same shape you had)
  // const redeemerData = [
  //   new Constr(2, [BigInt(poolOutIndex), BigInt(loanOutIndex)]),
  //   BigInt(poolInIndex),
  //   -1n,
  //   BigInt(protocolScriptRefIndex),
  //   BigInt(protocolConfigRefIndex),
  //   BigInt(feeOutIndex),
  // ];

  const originCbor = Data.to(
    new Constr(0, [
      new Constr(2, [BigInt(poolOutIndex), BigInt(loanOutIndex)]),
      BigInt(poolInIndex),
      -1n,
      BigInt(protocolScriptRefIndex),
      BigInt(protocolConfigRefIndex),
      BigInt(feeOutIndex),
    ])
  );
  // console.log({ fixedRedeemer: transformString(originCbor) });
  // return transformString(originCbor);
  return originCbor
};

/**
 * Creates the redeemer for the 'FloatPool' actions.
 * @param {Lucid} lucid - The Lucid instance.
 * @param {Tx} tx - The Lucid transaction object (partially built).
 * @param {ApiData} apiData - The 'data' part of your API response.
 * @returns {Promise<PlutusData>} The serialized PlutusData for the redeemer.
 */
const createFloatPoolRedeemer = async (
  lucid: LucidEvolution, // Keep for utility functions if needed
  collateralUtxo: UTxO, // Kept for consistent signature, though not used here
  apiData: ApiData
): Promise<string> => {
  const refInputs = apiData.referenceInputs
    .filter((r) => r.type !== "DANOGO_FLOAT_POOL")
    .map(apiToRefUtxo)
    .filter((r): r is OutRef => r !== null)
    .sort(
      (a, b) =>
        a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
    );

  const protocolConfigRef = apiToRefUtxo(
    apiData.referenceInputs.find((r) => r.type === "FLOAT_PROTOCOL_CONFIG")
  );
  const poolParamsRef = apiToRefUtxo(
    apiData.referenceInputs.find((r) => r.type === "FLOAT_POOL_CONFIG")
  );

  const protocolCfgRefIdx: number = refInputs.findIndex(
    (ref) =>
      ref.txHash === protocolConfigRef!.txHash &&
      ref.outputIndex === protocolConfigRef!.outputIndex
  );
  const marketRefIdx: number = refInputs.findIndex(
    (ref) =>
      ref.txHash === poolParamsRef!.txHash &&
      ref.outputIndex === poolParamsRef!.outputIndex
  );

  if (protocolCfgRefIdx === -1)
    throw new Error("Could not find float protocol config reference input.");
  if (marketRefIdx === -1)
    throw new Error("Could not find float pool config reference input.");

  // --- Get output indices ---
  // The order of outputs is determined by the order they are added in the main function.
  // We replicate that order here to get the correct indices.
  const outputs = [
    apiData.outputs.floatPoolOutUtxo,
    apiData.outputs.poolOutUtxo,
    apiData.outputs.feeOutUtxo,
    apiData.outputs.loanOutUtxo,
  ].filter((o): o is ApiUtxo => o !== null);

  const poolOutIndex: number = outputs.findIndex(
    (out) => out.address === apiData.outputs.floatPoolOutUtxo?.address
  );
  const feeOutIndex: number = outputs.findIndex(
    (out) => out.address === apiData.outputs.withdrawalFeeOutUtxo?.address
  );
  oracleOutputByOutRef.set(
    apiData.inputs.floatPoolInUtxo!.outRef as string,
    poolOutIndex
  );

  if (poolOutIndex === -1)
    throw new Error("Could not find floatPoolOutUtxo in transaction outputs.");

  const feeOutMaybe =
    feeOutIndex === -1
      ? new Constr(1, []) // Nothing
      : new Constr(0, [BigInt(feeOutIndex)]); // Just feeOutIndex

  // Final redeemer: Constr(2, [protocolCfgRefIdx, [poolEntry]])
  const redeemer = new Constr(2, [
    BigInt(protocolCfgRefIdx),
    [new Constr(0, [BigInt(poolOutIndex), feeOutMaybe, BigInt(marketRefIdx)])],
  ]);

  return Data.to(redeemer);
};

const main = async () => {
  console.log("Preparing complex transaction...");

  try {
    const lucid: LucidEvolution = await Lucid(
      new Blockfrost(
        "https://cardano-preview.blockfrost.io/api/v0",
        "previewFXVEf9xh8CIKeXDimSww7HCUumrxN22w"
      ),
      "Preview"
    );

    // By default, account 0 is used. You can select a different account
    // by providing the accountIndex option. For example, to use account #1:
    const accountIndexToUse = 1;
    lucid.selectWallet.fromSeed(seedPhrase, {
      accountIndex: accountIndexToUse,
    });

    const address = await lucid.wallet().address();
    console.log(`Wallet connected. Address: ${address}`);

    if (!lucid || !lucid.wallet()) {
      throw new Error("Please connect a wallet first.");
    }

    console.log("Building complex transaction...");

    // Initialize the transaction builder
    let tx: TxBuilder = lucid.newTx();

    // 1. Collect collateral from user's wallet
    // The API response indicates that this collateral is required for the loan.
    const collateralAsset =
      "919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e74444a4544";
    const collateralAmount = 202770657n;
    const userUtxos = await lucid.wallet().getUtxos();
    const collateralUtxo: UTxO | undefined = userUtxos.find(
      (utxo) => (utxo.assets[collateralAsset] || 0n) >= collateralAmount
    );

    if (!collateralUtxo) {
      throw new Error(
        `Could not find collateral asset (${collateralAsset}) in your wallet.`
      );
    }

    // 2. Collect Inputs from API
    // We need to collect inputs separately as they might need different redeemers.
    // For local testing with a static API response, we can construct the UTxO directly
    // instead of fetching it from the chain. This avoids errors if the UTxO has been spent.
    const fixedPoolInUtxo: UTxO[] = [
      apiToUtxo(apiResponse.data.inputs.poolInUtxo),
    ];
    const floatPoolInUtxo: UTxO[] = [
      apiToUtxo(apiResponse.data.inputs.floatPoolInUtxo),
    ];

    if (!fixedPoolInUtxo.length)
      throw new Error("Could not find fixed pool input UTxO.");
    if (!floatPoolInUtxo.length)
      throw new Error("Could not find float pool input UTxO.");

    // 3. Add Outputs
    // We explicitly define the order of outputs to ensure it's deterministic
    // and matches the order used for calculating redeemer indices.
    const orderedOutputs = [
      {
        key: "floatPoolOutUtxo",
        value: apiResponse.data.outputs.floatPoolOutUtxo,
      },
      { key: "poolOutUtxo", value: apiResponse.data.outputs.poolOutUtxo },
      { key: "feeOutUtxo", value: apiResponse.data.outputs.feeOutUtxo },
      { key: "loanOutUtxo", value: apiResponse.data.outputs.loanOutUtxo },
    ];

    for (const { key, value: apiOut } of orderedOutputs) {
      if (!apiOut) continue; // Skip any null outputs
      if (apiOut.coin === "0") {
        apiOut.coin = "2000000"; // Ensure minimum ADA to avoid "output has no value" errors
        // addr_test1wrs6vjp5wwjavyyw6tkh73f294dnhmz6a2a7xvalte4j2pgemsun9
        apiOut.address =
          "addr_test1zrs6vjp5wwjavyyw6tkh73f294dnhmz6a2a7xvalte4j2pg8gkm7g90pw4l5edvw8ny96ykpqyrcy9z5dzqv4es4r2asywgcfs";
      }

      const assets: Assets = apiToAssets(apiOut.multiAssets, apiOut.coin);
      if (apiOut.datum) {
        // Transform the API datum to match the on-chain schema before serializing.
        const transformedDatum = transformDatum(key, apiOut.datum);

        tx = tx.pay.ToAddressWithData(
          apiOut.address,
          {
            kind: "inline",
            value: transformedDatum,
          },
          assets
        );
      } else {
        tx = tx.pay.ToAddress(apiOut.address, assets);
      }
    }

    // 4. Add Reference Inputs
    // type guard
    const isOutRef = (x: OutRef | null): x is OutRef =>
      x !== null && x !== undefined;
    const refUtxos = apiResponse.data.referenceInputs
      .filter(ref => ref.type != "DANOGO_FLOAT_POOL")
      .map(apiToRefUtxo) // (OutRef | null)[]
      .filter(isOutRef); // OutRef[]

    const refUtxosOnChain: UTxO[] = await lucid.utxosByOutRef(refUtxos);
    tx = tx.readFrom(refUtxosOnChain);

    // 6. Add Metadata - This is the correct place to attach it.
    tx = tx.attachMetadata(674, {
      msg: ["Danogo Fixed-Rate Lending: Create Loan"],
    });
    tx = tx.attachMetadata(721, {
      version: 2,
      e1a6483473a5d6108ed2ed7f452a2d5b3bec5aeabbe333bf5e6b2505: {
        "60c037785ac6ac5b60f13389dc7e8af9ef60de53cc38ff2cfd669123f82571fd": {
          debt: "101.69644 ADA",
          name: "Borrower NFT (Fixed Rate Lending)",
          image: "ipfs://QmWpzeJwioirfFWFwDvxmETjemo2yVbnk16zz74U6a46Gz",
          website: "https://danogo.io",
          duration: "60 days",
          maturity: "2025-09-25 12:41:34 UTC",
          description:
            "An NFT representing the loan principal and interest by Danogo",
        },
      },
    });

    // 7. Build redeemers now that we have a transaction structure
    console.log("Building redeemers...");

    const createLoanRedeemerData: string = await createLoanRedeemer(
      lucid,
      collateralUtxo,
      apiResponse.data as ApiData
    );
    console.log({ createLoanRedeemerData });
    const floatPoolRedeemerData: string = await createFloatPoolRedeemer(
      lucid,
      collateralUtxo,
      apiResponse.data as ApiData
    );
    console.log({ floatPoolRedeemerData });
    const oracleRedeemerData = await createOracleRedeemer(
      lucid,
      collateralUtxo,
      apiResponse.data as ApiData
    ); // Build all redeemers
    console.log({ oracleRedeemerData });

    console.log("Loan redeemer (decoded):", Data.from(createLoanRedeemerData));
    console.log(
      "Float pool redeemer (decoded):",
      Data.from(floatPoolRedeemerData)
    );
    console.log("Oracle redeemer (decoded):", Data.from(oracleRedeemerData));

    // Now that we have the final redeemers, we can collect the script inputs.
    tx = tx.collectFrom(fixedPoolInUtxo, createLoanRedeemerData);
    tx = tx.collectFrom(floatPoolInUtxo, floatPoolRedeemerData);
    tx = tx.collectFrom([collateralUtxo]);

    // Add withdrawal with a placeholder, as its redeemer will be updated later.
    const withdrawal = apiResponse.data.withdrawal;
    if (withdrawal) {
      // The API provides the full reward address hex, but we only need the script collectFromhash (the part after the 'f0' header).
      const rewardScriptHash = withdrawal.rewardAddressScriptHash.startsWith(
        "f0"
      )
        ? withdrawal.rewardAddressScriptHash.substring(2)
        : withdrawal.rewardAddressScriptHash;
      const rewardAddress = credentialToRewardAddress(lucid.config().network!, {
        type: "Script",
        hash: rewardScriptHash,
      });
      tx = tx.withdraw(
        rewardAddress,
        BigInt(withdrawal.coin),
        oracleRedeemerData
      );
    }

    // 8. Add Minting with the correct redeemer
    // Note: The new TxBuilder automatically handles grouping assets by policy.
    for (const mint of apiResponse.data.mint.multiAssets) {
      const redeemer =
        mint.redeemerType === "FIXED"
          ? createLoanRedeemerData
          : floatPoolRedeemerData;

      const mintAssets: Assets = {};
      for (const asset of mint.assets) {
        const unit = mint.policyId + (asset.name || "");
        mintAssets[unit] = (mintAssets[unit] || 0n) + BigInt(asset.value);
      }
      tx = tx.mintAssets(mintAssets, redeemer);
    }

    tx = tx.validFrom(now);
    tx = tx.validTo(now + 360000); // 6 minutes validity

    // Log the transaction CBOR before final completion for debugging purposes.
    // This creates a temporary transaction without running coin selection to get a preview.
    const presetUtxos = (await lucid.wallet().getUtxos()).filter(
      (utxo) => utxo.outputIndex === 1 && utxo.txHash === "b650559db26322a1c3a724a3d6c1791c92fd7617902d9f1dd21626e9fca3cb06"
    );
    // console.log({presetUtxos})
    const tempBuiltTx = await tx.complete({
      // setCollateral: 0n,
      // coinSelection: false,
      localUPLCEval: false, // No need to evaluate scripts for this preview
      // presetWalletInputs: presetUtxos
    });
    const txCbor = tempBuiltTx.toCBOR();
    console.log("Transaction CBOR (pre-balancing):", txCbor);
    

    // 9. Complete, sign, and submit the transaction.
    // By enabling coin selection (default), Lucid will automatically add inputs from your wallet
    // to cover the transaction fee and send any change back to your address.
    const builtTx = await tx.complete({ setCollateral: 0n, coinSelection: false, presetWalletInputs: presetUtxos });
    // Sign with the wallet that was selected from the seed phrase.
    const signedTx = await builtTx.sign.withWallet().complete();

    const txHash = await signedTx.submit();
    console.log("Complex transaction submitted successfully!");
    console.log(`Tx Hash: ${txHash}`);
    console.log(`https://preview.cardanoscan.io/transaction/${txHash}`);

    console.log(`Complex transaction submitted with hash: ${txHash}`);
  } catch (err: any) {
    console.error("CompleteTxError:", err?.message || err);
    if (err?.cause) {
      console.error("Cause JSON:", JSON.stringify(err.cause, null, 2));
    }
    throw err;
  }
};

main();

const transformDatum = (outputKey: string, datum: any): string => {
  switch (outputKey) {
    case "loanOutUtxo":
      return transformLoanDatum(datum as LoanDatum);
    case "poolOutUtxo":
      return transformPoolDatum(datum as PoolDatum);
    case "floatPoolOutUtxo":
      return transformFloatPoolDatum(datum as FloatPoolDatum);
    default:
      return datum;
  }
};

/**
 * Transforms the loan datum from the API response to match the on-chain contract schema.
 * The contract expects a Constr with four fields in a specific order.
 * @param datum The loan datum from the API.
 * @returns An array of fields for the PlutusData Constr.
 */
const transformLoanDatum = (datum: LoanDatum): string => {
  // Define the schema for the loan datum. It's a constructor (index 0)
  // containing a tuple of four fields.
  const LoanDatumSchema = Data.Tuple(
    [Data.Integer(), Data.Integer(), Data.Integer(), Data.Bytes()],
    { hasConstr: true }
  );

  const loanOwnerNFTName = datum.loanOwnerNft.split(".")[1];
  const loanMaturity = now + 60 * 360000; // 1 day = 360000

  const dataArray: [bigint, bigint, bigint, string] = [
    BigInt(datum.loanProfitFee),
    BigInt(datum.loanAmount),
    BigInt(loanMaturity),
    loanOwnerNFTName, // This is a hex string, Data.to will handle it as bytes.
  ];

  return encodeData(dataArray, LoanDatumSchema);
};

/**
 * Transforms the fixed-rate pool datum from the API to match the on-chain contract schema.
 * The contract expects a Constr with a specific field order.
 * @param datum The pool datum from the API.
 * @returns An array of fields for the PlutusData Constr.
 */
const transformPoolDatum = (datum: PoolDatum): string => {
  // Schema for a single token ID tuple: [policyId, assetName]
  const TokenIdSchema = Data.Tuple([Data.Bytes(), Data.Bytes()]);

  // The complete schema for the Pool Datum.
  const PoolDatumSchema = Data.Tuple(
    [
      // supplyTokens: [[policy, asset], [policy, asset]]
      Data.Tuple([TokenIdSchema, TokenIdSchema]),
      // circulatingPTSupply
      Data.Integer(),
      // circulatingYTSupply
      Data.Integer(),
      // supplyMaturity
      Data.Integer(),
      // collateralsMap: Map<TokenId, Integer>
      Data.Map(TokenIdSchema, Data.Integer()),
      // baseInterestRate
      Data.Integer(),
      // gradient
      Data.Integer(),
      // maxLoanDuration
      Data.Integer(),
      // activeLoanCount
      Data.Integer(),
      // feeCollected (placeholder)
      Data.Boolean(),
      // minBorrowAmount
      Data.Integer(),
    ],
    { hasConstr: true }
  );

  const supplyTokens: [[string, string], [string, string]] = [
    tokenIdToTuple(datum.supplyYieldToken).map((v) =>
      v instanceof Uint8Array ? toHex(v) : v
    ) as [string, string],
    tokenIdToTuple(datum.supplyToken).map((v) =>
      v instanceof Uint8Array ? toHex(v) : v
    ) as [string, string],
  ];

  const collateralsMap = new Map(
    datum.collaterals.map((c) => [
      tokenIdToTuple(c.collateralToken).map((v) =>
        v instanceof Uint8Array ? toHex(v) : v
      ) as [string, string],
      BigInt(c.liquidationThreshold),
    ])
  );

  const dataArray: [
    [[string, string], [string, string]],
    bigint,
    bigint,
    bigint,
    Map<[string, string], bigint>,
    bigint,
    bigint,
    bigint,
    bigint,
    boolean,
    bigint
  ] = [
    supplyTokens,
    BigInt(datum.circulatingPTSupply),
    BigInt(datum.circulatingYTSupply),
    BigInt(datum.supplyMaturity),
    collateralsMap,
    BigInt(datum.baseInterestRate),
    BigInt(datum.gradient),
    BigInt(datum.maxLoanDuration),
    BigInt(datum.activeLoanCount),
    false,
    BigInt(datum.minBorrowAmount),
  ];
  // return transformString(encodeData(dataArray, PoolDatumSchema));
  return encodeData(dataArray, PoolDatumSchema);
};

/**
 * Transforms the float pool datum from the API to match the on-chain contract schema.
 * The contract expects a Constr with 8 fields.
 * @param datum The float pool datum from the API.
 * @returns An array of fields for the PlutusData Constr.
 */
const transformFloatPoolDatum = (datum: FloatPoolDatum): string => {
  const alternativeSupplyTokensRate = (datum.alternativeSupplyTokens || []).map(
    (token) =>
      // Rational is a Constr(0, [numerator, denominator])
      new Constr(0, [
        BigInt(token.latestExchangeRateNum),
        BigInt(token.latestExchangeRateDen),
      ])
  );

  const dataArray = [
    BigInt(datum.totalSupply),
    BigInt(datum.circulatingDToken),
    BigInt(datum.totalBorrow),
    BigInt(datum.borrowRate), // API 'borrowRate' maps to contract 'borrowApy'
    BigInt(datum.undistributedFee),
    BigInt(datum.interestIndex),
    BigInt(datum.interestTime),
    alternativeSupplyTokensRate,
  ];

  console.log({ floatDatum: Data.to(new Constr(0, dataArray)) });
  return Data.to(new Constr(0, dataArray));
};



// Oracle UTxO types set
const utxoTypes = new Set<string>(
  Object.values(UtxoType).filter((v) => typeof v === "string") as string[]
);

// Oracle UTxO types set
const oracleUTxOTypes = new Set<string>(
  Object.values(OracleUtxoType).filter((v) => typeof v === "string") as string[]
);

// ---- Reference input collector ----
type RefByType = Map<string, Set<string>>;

// ---- Oracle redeemer builder ----
const createOracleRedeemer = async (
  lucid: LucidEvolution,
  collateralUtxo: UTxO, // Kept for consistent signature, though not used here
  apiData: ApiData
): Promise<string> => {
  // --- Collect & sort reference inputs ---
  const refInputs = apiData.referenceInputs
    .filter((r) => r.type !== "DANOGO_FLOAT_POOL")
    .map(apiToRefUtxo)
    .filter((r): r is OutRef => r !== null)
    .sort(
      (a, b) =>
        a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
    );

  // --- Find oracle source and path reference indices from apiData ---
  const oracleSourceRef = apiToRefUtxo(
    apiData.referenceInputs.find((r) => r.type === "ORACLE_CONFIG")
  );
  const oraclePathRefs = apiData.referenceInputs
    .filter((r) => r.type === "ORACLE_SOURCE_PATH")
    .map(apiToRefUtxo);

  const sourceRefIndex: number = refInputs.findIndex(
    (ref) =>
      ref.txHash === oracleSourceRef!.txHash &&
      ref.outputIndex === oracleSourceRef!.outputIndex
  );
  const pathRefIndexes: number[] = oraclePathRefs.map((pathRef) =>
    refInputs.findIndex(
      (ref) =>
        ref.txHash === pathRef!.txHash &&
        ref.outputIndex === pathRef!.outputIndex
    )
  );

  if (sourceRefIndex === -1)
    throw new Error("Could not find oracle source reference input.");
  if (pathRefIndexes.some((idx) => idx === -1))
    throw new Error("Could not find an oracle path reference input.");

  // --- Helper to create OracleIndex entries ---
  // Each OracleIndex is represented as: [ UtxoTargetConstr, OracleUtxoTypeConstr, BigInt(index) ]
  const makeOracleIndex = (
    utxoTargetConstr: number,
    oracleTypeConstr: number,
    index: number
  ): [Constr<[]>, Constr<[]>, bigint] => [
    new Constr<[]>(utxoTargetConstr, []),
    new Constr<[]>(oracleTypeConstr, []),
    BigInt(index),
  ];

  // --- Build oracleIndexes ---
  // Preferred: if your API already returns a list describing oracle indexes (with constructor numbers),
  // place it into `apiData.oracleIndexes` as array of {utxoTarget: number, oracleType: number, index: number}
  // Example fallback: if not present, we leave it empty (or you can adapt to build from other API fields).
  let oracleIndexes: [Constr<[]>, Constr<[]>, bigint][] = [];

  const referenceInputByType = new Map<string, Set<string>>();
  apiData.referenceInputs.forEach((refInput) => {
    if (!referenceInputByType.has(refInput.type)) {
      referenceInputByType.set(refInput.type, new Set());
    }
    referenceInputByType.get(refInput.type)?.add(refInput.outRef);
  });

  const oracleRefByType = new Map<string, Set<string>>();
  const oracleOutByType = new Map<string, number>();
  const requiredRefTypes = new Set(oracleUTxOTypes);
  requiredRefTypes.add("ORACLE_CONFIG");
  requiredRefTypes.add("ORACLE_SOURCE_PATH");
  requiredRefTypes.add("ORACLE_PRICE_SCRIPT");
  referenceInputByType.forEach((outRefs, type) => {
    outRefs.forEach((outRef) => {
      const outIdx = oracleOutputByOutRef.get(outRef);
      if (outIdx !== undefined) oracleOutByType.set(type, outIdx);
      else if (requiredRefTypes.has(type)) {
        const outRefs = oracleRefByType.get(type) ?? new Set();
        outRefs.add(outRef);
        oracleRefByType.set(type, outRefs);
      }
    });
  });

  oracleOutByType.forEach((outputIndex, oracleType) => {
    if (oracleUTxOTypes.has(oracleType)) {
      oracleIndexes.push(
        makeOracleIndex(
          1,
          OracleUtxoType[oracleType as keyof typeof OracleUtxoType],
          outputIndex
        )
      );
    }
  });

  oracleRefByType.forEach((outRefs, oracleType) => {
    outRefs.forEach((outRef) => {
      const index = refInputs.findIndex(
        (ref) => ref.txHash + "#" +ref.outputIndex.toString() === outRef
      );
      // Check if the index was found and if the oracleType is a valid enum key
      if (index !== -1 && oracleUTxOTypes.has(oracleType)) {
        oracleIndexes.push(
          makeOracleIndex(
            0,
            OracleUtxoType[oracleType as keyof typeof OracleUtxoType],
            index
          )
        );
      }
    });
  });

  // Prices: Map<TokenIdTuple, Map<TokenIdTuple, RationalConstr>>
  const pricesMap = new Map<any, any>();
  const priceGroups = (apiData.withdrawal?.withdrawalRedeemer?.prices ??
    []) as any[];
  for (const pg of priceGroups) {
    const borrowKey = tokenIdToTuple(pg.borrowToken).map((v) =>
      v instanceof Uint8Array ? toHex(v) : v
    ) as [string, string];
    const inner = new Map<any, any>();
    for (const op of pg.oraclePrices ?? []) {
      // encode Rational as Constr(0, [numerator, denominator]) to match your example
      const rationalTuple = [BigInt(op.priceNum), BigInt(op.priceDen)];
      inner.set(
        tokenIdToTuple(op.collateralToken).map((v) =>
          v instanceof Uint8Array ? toHex(v) : v
        ) as [string, string],
        rationalTuple
      );
    }
    pricesMap.set(borrowKey, inner);
  }

  // BorrowRates: Map<TokenIdTuple, BigInt>
  const borrowRatesMap = new Map<any, any>();
  const brs = (apiData.withdrawal?.withdrawalRedeemer?.borrowRates ??
    []) as any[];
  for (const br of brs) {
    borrowRatesMap.set(
      tokenIdToTuple(br.yieldToken).map((v) =>
        v instanceof Uint8Array ? toHex(v) : v
      ) as [string, string],
      BigInt(br.borrowRate)
    );
  }

  const TokenIdSchema = Data.Tuple([Data.Bytes(), Data.Bytes()]);

  // Schema for a Rational Number: a Constr with [numerator, denominator]
  const RationalSchema = Data.Tuple([Data.Integer(), Data.Integer()], {
    hasConstr: true, // Serializes as Constr(0, [num, den])
  });

  // The complete schema for the Oracle Redeemer data structure
  const OracleRedeemerSchema = Data.Tuple(
    [
      // Field 0: oracleSourceIndex
      Data.Integer(),
      // Field 1: oraclePathIndexes
      Data.Array(Data.Integer()),
      // Field 2: oracleIndexes (an array of complex tuples)
      Data.Array(
        Data.Tuple([Data.Any(), Data.Any(), Data.Integer()]) // Using Data.Any() for the Constrs
      ),
      // Field 3: pricesMap (a map where the value is another map)
      Data.Map(TokenIdSchema, Data.Map(TokenIdSchema, RationalSchema, {minItems: 3, maxItems: 3}), {minItems: 1, maxItems: 1}),
      // Field 4: borrowRatesMap
      Data.Map(TokenIdSchema, Data.Integer(), {minItems: 1, maxItems: 1}),
    ],
    { hasConstr: true } // The entire redeemer is a Constr(0, [fields])
  );

  // Create a plain array that matches the OracleRedeemerSchema structure
  const redeemerData: [
    bigint,
    bigint[],
    [Constr<[]>, Constr<[]>, bigint][],
    Map<any, any>,
    Map<any, any>
  ] = [
    BigInt(sourceRefIndex), // oracleSourceIndexx
    pathRefIndexes.map((i) => BigInt(i)), // oraclePathIndexes
    oracleIndexes, // oracleIndexes array of [Constr, Constr, bigint]
    pricesMap, // nested Map structure
    borrowRatesMap, // map of borrow rates
  ];

  // Serialize to hex CBOR string
  const encodedData = encodeData(redeemerData, OracleRedeemerSchema);
  // console.log({ transformOracleRedeemer: transformOracleRedeemer(encodedData) });
  // return transformOracleRedeemer(encodedData);
  return encodedData
};

/**
 * Applies specific CBOR transformations to the oracle redeemer.
 * - Replaces the first 'bf9f' with 'a19f'.
 * - Replaces the second 'bf9f' with 'a39f'.
 * - Removes 'ff' before the last 'bf9f' and replaces that 'bf9f' with 'a19f'.
 * @param cborString The original CBOR string.
 * @returns The transformed CBOR string.
 */
// const transformOracleRedeemer = (cborString: string): string => {
//   const occurrences: number[] = [];
//   let index = cborString.indexOf("bf9f");
//   while (index !== -1) {
//     occurrences.push(index);
//     index = cborString.indexOf("bf9f", index + 1);
//   }

//   if (occurrences.length < 3) {
//     console.warn(`Expected at least 3 occurrences of "bf9f", but found ${occurrences.length}. Returning original string.`);
//     return cborString;
//   }

//   let result = cborString.substring(0, occurrences[0]) + "a19f" + cborString.substring(occurrences[0] + 4);
//   result = result.substring(0, occurrences[1]) + "a39f" + result.substring(occurrences[1] + 4);
//   const lastOccurence = occurrences[occurrences.length - 1];
//   result = result.substring(0, lastOccurence - 2) + "a19f" + result.substring(lastOccurence + 4);
//   return result;
// };

// function transformString(originalString: string): string {
//   let result = originalString;

//   const bfIndex = originalString.indexOf("bf");
//   if (bfIndex === -1) return result; // 'bf' not found

//   const firstFfIndex = originalString.indexOf("ff", bfIndex + 2);
//   if (firstFfIndex === -1) return result; // First 'ff' not found

//   const secondFfIndex = originalString.indexOf("ff", firstFfIndex + 2);
//   if (secondFfIndex === -1) return result; // Second 'ff' not found

//   const part1 = originalString.substring(0, bfIndex);
//   const part2_middle = originalString.substring(bfIndex + 2, secondFfIndex);
//   const part3_end = originalString.substring(secondFfIndex + 2);

//   result = part1 + "a1" + part2_middle + part3_end;
//   return result;
// }
