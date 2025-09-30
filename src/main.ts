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
  mintingPolicyToId,
  Kupmios,
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
import { UTxOTarget, OracleUtxoType, UtxoType } from "./enum.js";

// Filter out problematic reference inputs
apiResponse.data.referenceInputs = apiResponse.data.referenceInputs.filter(
  (ref) => ref.type != "DANOGO_STAKING_SCRIPT"
);

// Type definitions for better code clarity and safety
const now = parseInt(
  (apiResponse.data.outputs.floatPoolOutUtxo!.datum! as FloatPoolDatum)
    .interestTime,
  10
);
const oracleOutputByOutRef = new Map<string, number>();

// IMPORTANT: Replace this with your actual 24-word seed phrase
const seedPhrase =
  "fork target sense patient museum unusual rough hair brief misery main duty below garbage pizza oval truth invite vessel father flame repair ketchup field";

// Utility to validate hex strings
const isValidHex = (str: string): boolean => {
  return /^[0-9a-fA-F]*$/.test(str);
};

// Add CBOR validation function
const validateCbor = (cborHex: string, description: string): boolean => {
  try {
    // Check if valid hex
    if (!isValidHex(cborHex)) {
      console.error(`Invalid hex in ${description}:`, cborHex);
      return false;
    }

    // Check if even length (valid hex pairs)
    if (cborHex.length % 2 !== 0) {
      console.error(`Odd length hex string in ${description}:`, cborHex);
      return false;
    }

    // Try to parse with Lucid's Data.from()
    Data.from(cborHex);
    console.log(`✓ Valid CBOR for ${description}`);
    return true;
  } catch (error) {
    console.error(`Invalid CBOR in ${description}:`, error);
    console.error(`CBOR hex:`, cborHex);
    return false;
  }
};

// Helper functions to parse API response
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

const apiToUtxo = (apiUtxo: ApiUtxo | null): UTxO => {
  if (apiUtxo == null || apiUtxo == undefined || !apiUtxo?.outRef) {
    throw new Error("apiToUtxo: outRef is missing");
  }

  const [txHash, outputIndex] = apiUtxo.outRef.split("#");
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

const apiToRefUtxo = (apiRef: ApiReferenceInput | undefined): OutRef | null => {
  if (!apiRef) return null;
  const [txHash, outputIndex] = apiRef.outRef.split("#");
  if (txHash === undefined || outputIndex === undefined) {
    throw new Error("apiToRefUtxo: Invalid outRef format");
  }
  return { txHash, outputIndex: parseInt(outputIndex) };
};

// Enhanced tokenIdToTuple with better error handling
const tokenIdToTuple = (tokenId: string): [string, Uint8Array] => {
  const emptyBytes = new Uint8Array(0);

  if (!tokenId) return ["", emptyBytes];

  try {
    const parts = tokenId.split(".");
    if (parts.length === 2) {
      const policy = parts[0] ?? "";
      const assetName = parts[1] ?? "";

      // Validate policy ID
      if (policy && !isValidHex(policy)) {
        throw new Error(`Invalid hex policy ID: ${policy}`);
      }

      if (assetName.length > 0) {
        if (!isValidHex(assetName)) {
          throw new Error(`Invalid hex asset name: ${assetName}`);
        }
        return [policy, fromHex(assetName)];
      }
      return [policy, emptyBytes];
    }

    // Single part - treat as policy ID
    if (tokenId && !isValidHex(tokenId)) {
      throw new Error(`Invalid hex token ID: ${tokenId}`);
    }
    return [tokenId, emptyBytes];
  } catch (error) {
    console.error(`Error parsing token ID "${tokenId}":`, error);
    throw new Error(`Failed to parse token ID: ${tokenId}`);
  }
};

// Create loan redeemer with validation
const createLoanRedeemer = async (
  lucid: LucidEvolution,
  collateralUtxo: UTxO,
  apiData: ApiData
): Promise<string> => {
  try {
    const allInputs = [
      apiToUtxo(apiData.inputs.poolInUtxo),
      apiToUtxo(apiData.inputs.floatPoolInUtxo),
      collateralUtxo,
    ].sort(
      (a, b) =>
        a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
    );

    const poolInUtxo = apiToUtxo(apiData.inputs.poolInUtxo);
    const poolInIndex = allInputs.findIndex(
      (inp) =>
        inp.txHash === poolInUtxo.txHash &&
        inp.outputIndex === poolInUtxo.outputIndex
    );

    if (poolInIndex === -1) {
      throw new Error(
        "Could not find poolInUtxo in transaction script inputs."
      );
    }

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

    if (!fixedProtocolScriptRef || !fixedProtocolConfigRef) {
      throw new Error("Missing required reference inputs for loan redeemer");
    }

    const protocolScriptRefIndex = refInputs.findIndex(
      (ref) =>
        ref.txHash === fixedProtocolScriptRef.txHash &&
        ref.outputIndex === fixedProtocolScriptRef.outputIndex
    );
    const protocolConfigRefIndex = refInputs.findIndex(
      (ref) =>
        ref.txHash === fixedProtocolConfigRef.txHash &&
        ref.outputIndex === fixedProtocolConfigRef.outputIndex
    );

    if (protocolScriptRefIndex === -1 || protocolConfigRefIndex === -1) {
      throw new Error(
        "Could not find required reference inputs in sorted list"
      );
    }

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

    if (poolOutIndex === -1 || loanOutIndex === -1 || feeOutIndex === -1) {
      throw new Error("Could not find required outputs in transaction");
    }

    const redeemerCbor = Data.to(
      new Constr(0, [
        new Constr(2, [BigInt(poolOutIndex), BigInt(loanOutIndex)]),
        BigInt(poolInIndex),
        -1n,
        BigInt(protocolScriptRefIndex),
        BigInt(protocolConfigRefIndex),
        BigInt(feeOutIndex),
      ])
    );

    if (!validateCbor(redeemerCbor, "loan redeemer")) {
      throw new Error("Generated invalid CBOR for loan redeemer");
    }

    return redeemerCbor;
  } catch (error) {
    console.error("Error creating loan redeemer:", error);
    throw error;
  }
};

// Create float pool redeemer with validation
const createFloatPoolRedeemer = async (
  lucid: LucidEvolution,
  collateralUtxo: UTxO,
  apiData: ApiData
): Promise<string> => {
  try {
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

    if (!protocolConfigRef || !poolParamsRef) {
      throw new Error(
        "Missing required reference inputs for float pool redeemer"
      );
    }

    const protocolCfgRefIdx = refInputs.findIndex(
      (ref) =>
        ref.txHash === protocolConfigRef.txHash &&
        ref.outputIndex === protocolConfigRef.outputIndex
    );
    const marketRefIdx = refInputs.findIndex(
      (ref) =>
        ref.txHash === poolParamsRef.txHash &&
        ref.outputIndex === poolParamsRef.outputIndex
    );

    if (protocolCfgRefIdx === -1 || marketRefIdx === -1) {
      throw new Error(
        "Could not find required reference inputs in sorted list"
      );
    }

    const outputs = [
      apiData.outputs.floatPoolOutUtxo,
      apiData.outputs.poolOutUtxo,
      apiData.outputs.feeOutUtxo,
      apiData.outputs.loanOutUtxo,
    ].filter((o): o is ApiUtxo => o !== null);

    const poolOutIndex = outputs.findIndex(
      (out) => out.address === apiData.outputs.floatPoolOutUtxo?.address
    );
    const feeOutIndex = outputs.findIndex(
      (out) => out.address === apiData.outputs.withdrawalFeeOutUtxo?.address
    );

    oracleOutputByOutRef.set(
      apiData.inputs.floatPoolInUtxo!.outRef as string,
      poolOutIndex
    );

    if (poolOutIndex === -1) {
      throw new Error("Could not find floatPoolOutUtxo in transaction outputs");
    }

    const feeOutMaybe =
      feeOutIndex === -1
        ? new Constr(1, []) // Nothing
        : new Constr(0, [BigInt(feeOutIndex)]); // Just feeOutIndex

    const redeemerCbor = Data.to(
      new Constr(2, [
        BigInt(protocolCfgRefIdx),
        [
          new Constr(0, [
            BigInt(poolOutIndex),
            feeOutMaybe,
            BigInt(marketRefIdx),
          ]),
        ],
      ])
    );

    if (!validateCbor(redeemerCbor, "float pool redeemer")) {
      throw new Error("Generated invalid CBOR for float pool redeemer");
    }

    return redeemerCbor;
  } catch (error) {
    console.error("Error creating float pool redeemer:", error);
    throw error;
  }
};

// Enhanced datum transformations with CBOR validation
const transformDatum = (outputKey: string, datum: any): string => {
  try {
    switch (outputKey) {
      case "loanOutUtxo":
        return transformLoanDatum(datum as LoanDatum);
      case "poolOutUtxo":
        return transformPoolDatum(datum as PoolDatum);
      case "floatPoolOutUtxo":
        return transformFloatPoolDatum(datum as FloatPoolDatum);
      default:
        throw new Error(`Unknown datum type: ${outputKey}`);
    }
  } catch (error) {
    console.error(`Error transforming datum for ${outputKey}:`, error);
    throw error;
  }
};

const transformLoanDatum = (datum: LoanDatum): string => {
  const LoanDatumSchema = Data.Tuple(
    [Data.Integer(), Data.Integer(), Data.Integer(), Data.Bytes()],
    { hasConstr: true }
  );

  const nftParts = datum.loanOwnerNft.split(".");
  if (nftParts.length !== 2) {
    throw new Error(`Invalid NFT format: ${datum.loanOwnerNft}`);
  }

  const loanOwnerNFTName = nftParts[1];
  if (!isValidHex(loanOwnerNFTName)) {
    throw new Error(`Invalid hex in NFT name: ${loanOwnerNFTName}`);
  }

  const loanMaturity = now + 60 * 360000; // 1 day = 360000

  const dataArray: [bigint, bigint, bigint, string] = [
    BigInt(datum.loanProfitFee),
    BigInt(datum.loanAmount),
    BigInt(loanMaturity),
    loanOwnerNFTName,
  ];

  const encodedData = encodeData(dataArray, LoanDatumSchema);

  if (!validateCbor(encodedData, "loan datum")) {
    throw new Error("Generated invalid CBOR for loan datum");
  }

  return encodedData;
};

const transformPoolDatum = (datum: PoolDatum): string => {
  const TokenIdSchema = Data.Tuple([Data.Bytes(), Data.Bytes()]);

  const PoolDatumSchema = Data.Tuple(
    [
      Data.Tuple([TokenIdSchema, TokenIdSchema]), // supplyTokens
      Data.Integer(), // circulatingPTSupply
      Data.Integer(), // circulatingYTSupply
      Data.Integer(), // supplyMaturity
      Data.Map(TokenIdSchema, Data.Integer()), // collateralsMap
      Data.Integer(), // baseInterestRate
      Data.Integer(), // gradient
      Data.Integer(), // maxLoanDuration
      Data.Integer(), // activeLoanCount
      Data.Boolean(), // feeCollected
      Data.Integer(), // minBorrowAmount
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
    datum.collaterals.map((c) => {
      const tokenKey = tokenIdToTuple(c.collateralToken).map((v) =>
        v instanceof Uint8Array ? toHex(v) : v
      ) as [string, string];
      return [tokenKey, BigInt(c.liquidationThreshold)];
    })
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

  const encodedData = encodeData(dataArray, PoolDatumSchema);

  if (!validateCbor(encodedData, "pool datum")) {
    throw new Error("Generated invalid CBOR for pool datum");
  }

  return transformString(encodedData);
};

const transformFloatPoolDatum = (datum: FloatPoolDatum): string => {
  const alternativeSupplyTokensRate = (datum.alternativeSupplyTokens || []).map(
    (token) =>
      new Constr(0, [
        BigInt(token.latestExchangeRateNum),
        BigInt(token.latestExchangeRateDen),
      ])
  );

  const dataArray = [
    BigInt(datum.totalSupply),
    BigInt(datum.circulatingDToken),
    BigInt(datum.totalBorrow),
    BigInt(datum.borrowRate),
    BigInt(datum.undistributedFee),
    BigInt(datum.interestIndex),
    BigInt(datum.interestTime),
    alternativeSupplyTokensRate,
  ];

  const encodedData = Data.to(new Constr(0, dataArray));

  if (!validateCbor(encodedData, "float pool datum")) {
    throw new Error("Generated invalid CBOR for float pool datum");
  }

  return encodedData;
};

// Oracle redeemer creation with validation
const createOracleRedeemer = async (
  lucid: LucidEvolution,
  collateralUtxo: UTxO,
  apiData: ApiData
): Promise<string> => {
  try {
    const refInputs = apiData.referenceInputs
      .filter((r) => r.type !== "DANOGO_FLOAT_POOL")
      .map(apiToRefUtxo)
      .filter((r): r is OutRef => r !== null)
      .sort(
        (a, b) =>
          a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
      );

    const oracleSourceRef = apiToRefUtxo(
      apiData.referenceInputs.find((r) => r.type === "ORACLE_CONFIG")
    );
    const oraclePathRefs = apiData.referenceInputs
      .filter((r) => r.type === "ORACLE_SOURCE_PATH")
      .map(apiToRefUtxo);

    if (!oracleSourceRef) {
      throw new Error("Missing oracle source reference");
    }

    const sourceRefIndex = refInputs.findIndex(
      (ref) =>
        ref.txHash === oracleSourceRef.txHash &&
        ref.outputIndex === oracleSourceRef.outputIndex
    );
    const pathRefIndexes = oraclePathRefs.map((pathRef) =>
      refInputs.findIndex(
        (ref) =>
          ref.txHash === pathRef!.txHash &&
          ref.outputIndex === pathRef!.outputIndex
      )
    );

    if (sourceRefIndex === -1 || pathRefIndexes.some((idx) => idx === -1)) {
      throw new Error("Could not find required oracle reference inputs");
    }

    const makeOracleIndex = (
      utxoTargetConstr: number,
      oracleTypeConstr: number,
      index: number
    ): [Constr<[]>, Constr<[]>, bigint] => [
      new Constr<[]>(utxoTargetConstr, []),
      new Constr<[]>(oracleTypeConstr, []),
      BigInt(index),
    ];

    let oracleIndexes: [Constr<[]>, Constr<[]>, bigint][] = [];

    const referenceInputByType = new Map<string, Set<string>>();
    apiData.referenceInputs.forEach((refInput) => {
      if (!referenceInputByType.has(refInput.type)) {
        referenceInputByType.set(refInput.type, new Set());
      }
      referenceInputByType.get(refInput.type)?.add(refInput.outRef);
    });

    const oracleUTxOTypes = new Set<string>(
      Object.values(OracleUtxoType).filter(
        (v) => typeof v === "string"
      ) as string[]
    );

    const oracleRefByType = new Map<string, Set<string>>();
    const oracleOutByType = new Map<string, number>();
    const requiredRefTypes = new Set(oracleUTxOTypes);
    requiredRefTypes.add("ORACLE_CONFIG");
    requiredRefTypes.add("ORACLE_SOURCE_PATH");
    requiredRefTypes.add("ORACLE_PRICE_SCRIPT");

    referenceInputByType.forEach((outRefs, type) => {
      outRefs.forEach((outRef) => {
        const outIdx = oracleOutputByOutRef.get(outRef);
        if (outIdx !== undefined) {
          oracleOutByType.set(type, outIdx);
        } else if (requiredRefTypes.has(type)) {
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
          (ref) => ref.txHash + "#" + ref.outputIndex.toString() === outRef
        );
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

    const pricesMap = new Map<any, any>();
    const priceGroups = (apiData.withdrawal?.withdrawalRedeemer?.prices ??
      []) as any[];
    for (const pg of priceGroups) {
      const borrowKey = tokenIdToTuple(pg.borrowToken).map((v) =>
        v instanceof Uint8Array ? toHex(v) : v
      ) as [string, string];
      const inner = new Map<any, any>();
      for (const op of pg.oraclePrices ?? []) {
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
    const RationalSchema = Data.Tuple([Data.Integer(), Data.Integer()], {
      hasConstr: true,
    });

    const OracleRedeemerSchema = Data.Tuple(
      [
        Data.Integer(), // oracleSourceIndex
        Data.Array(Data.Integer()), // oraclePathIndexes
        Data.Array(Data.Tuple([Data.Any(), Data.Any(), Data.Integer()])), // oracleIndexes
        Data.Map(
          TokenIdSchema,
          Data.Map(TokenIdSchema, RationalSchema, { minItems: 3, maxItems: 3 }),
          { minItems: 1, maxItems: 1 }
        ), // pricesMap
        Data.Map(TokenIdSchema, Data.Integer(), { minItems: 1, maxItems: 1 }), // borrowRatesMap
      ],
      { hasConstr: true }
    );
    const redeemerData: [
      bigint,
      bigint[],
      [Constr<[]>, Constr<[]>, bigint][],
      Map<any, any>,
      Map<any, any>
    ] = [
      BigInt(sourceRefIndex),
      pathRefIndexes.map((i) => BigInt(i)),
      oracleIndexes,
      pricesMap,
      borrowRatesMap,
    ];

    const encodedData = encodeData(redeemerData, OracleRedeemerSchema);

    if (!validateCbor(encodedData, "oracle redeemer")) {
      throw new Error("Generated invalid CBOR for oracle redeemer");
    }
    return transformOracleRedeemer(encodedData);
  } catch (error) {
    console.error("Error creating oracle redeemer:", error);
    throw error;
  }
};

const main = async () => {
  console.log("Preparing complex transaction...");

  try {
    const lucid: LucidEvolution = await Lucid(
      // new Blockfrost(
      //   "https://cardano-preview.blockfrost.io/api/v0/",
      //   "previewkUPq78ccpDRbXNQM3YeSg6YhXgq9JoNT"
      // ),
      new Kupmios(
        "http://172.16.61.2:1442",
        "http://172.16.61.4:1337",
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
    const collateralAmount = 142770657n;
    const userUtxos = await lucid.wallet().getUtxos();
    const collateralUtxo: UTxO | undefined = userUtxos.find(
      (utxo) =>
        utxo.txHash ===
          "2647ec8e69ad90007309ea5acf137e6946245908791d1cfd81f704054889eb3d" &&
        utxo.outputIndex === 3
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

    // 4. Add Reference Inputs
    // type guard
    const isOutRef = (x: OutRef | null): x is OutRef =>
      x !== null && x !== undefined;
    const refUtxos = apiResponse.data.referenceInputs
      .filter((ref) => ref.type != "DANOGO_FLOAT_POOL")
      .map(apiToRefUtxo) // (OutRef | null)[]
      .filter(isOutRef) // OutRef[]
      .sort(
        (a, b) =>
          a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
      );

    
    const refUtxosOnChain: UTxO[] = await lucid.utxosByOutRef(refUtxos);
    tx = tx.readFrom(refUtxosOnChain);

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
        apiOut.address =
          "addr_test1zrs6vjp5wwjavyyw6tkh73f294dnhmz6a2a7xvalte4j2pg8gkm7g90pw4l5edvw8ny96ykpqyrcy9z5dzqv4es4r2asywgcfs";
      }

      const assets: Assets = apiToAssets(apiOut.multiAssets, apiOut.coin);

      if (apiOut.datum) {
        // Transform the API datum to match the on-chain schema before serializing.
        const transformedDatum = transformDatum(key, apiOut.datum);
        console.log({ transformedDatum });
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

    // 6. Add Metadata - This is the correct place to attach it.
    // tx = tx.attachMetadata(674, {
    //   msg: ["Danogo Fixed-Rate Lending: Create Loan"],
    // });
    // tx = tx.attachMetadata(721, {
    //   version: 2,
    //   e1a6483473a5d6108ed2ed7f452a2d5b3bec5aeabbe333bf5e6b2505: {
    //     "60c037785ac6ac5b60f13389dc7e8af9ef60de53cc38ff2cfd669123f82571fd": {
    //       debt: "101.69644 ADA",
    //       name: "Borrower NFT (Fixed Rate Lending)",
    //       image: "ipfs://QmWpzeJwioirfFWFwDvxmETjemo2yVbnk16zz74U6a46Gz",
    //       website: "https://danogo.io",
    //       duration: "60 days",
    //       maturity: "2025-09-25 12:41:34 UTC",
    //       description:
    //         "An NFT representing the loan principal and interest by Danogo",
    //     },
    //   },
    // });

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

    // Now that we have the final redeemers, we can collect the script inputs.
    tx = tx
      .collectFrom([collateralUtxo])
      .collectFrom(fixedPoolInUtxo, createLoanRedeemerData)
      .collectFrom(floatPoolInUtxo, floatPoolRedeemerData);

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
        console.log({ policy: mint.policyId, redeemer });
      }
      tx = tx.mintAssets(mintAssets, redeemer);
    }

    tx = tx
      .validFrom(now)
      .validTo(now + 300000)
      .setMinFee(170000n)
      .addSigner(await lucid.wallet().address());

    // Log the transaction CBOR before final completion for debugging purposes.
    // This creates a temporary transaction without running coin selection to get a preview.
    // const presetUtxos = (await lucid.wallet().getUtxos()).filter(
    //   (utxo) => utxo.outputIndex === 1 && utxo.txHash === "8122f3a323cdde6a3cead637f309a0321598417497939dc27a0bf34f04f86797"
    // );
    // if (presetUtxos.length === 0) throw Error("No UTXO found")
    const tempTx = await tx.complete({ localUPLCEval: false });
    console.log({cbor: tempTx.toCBOR()})

    const builtTx = lucid.fromTx(tempTx.toCBOR());

    // 9. Complete, sign, and submit the transaction.
    // const builtTx = await tx.complete({ setCollateral: 0n, coinSelection: false, presetWalletInputs: presetUtxos });
    // const builtTx = await tx.complete();

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

const transformOracleRedeemer = (cborString: string): string => {
  // 1. First, replace all occurrences of "ffffff" with "ff".
  const modifiedString = cborString.replace(/ffffff/g, "ff");

  // 2. Now, find all occurrences of "bf9f" in the *modified* string.
  const occurrences: number[] = [];
  let index = modifiedString.indexOf("bf9f");
  while (index !== -1) {
    occurrences.push(index);
    index = modifiedString.indexOf("bf9f", index + 1);
  }

  if (occurrences.length < 3) {
    console.warn(
      `Expected at least 3 occurrences of "bf9f", but found ${occurrences.length}. Returning original string.`
    );
    return cborString;
  }

  // 3. Perform the replacements for "bf9f" on the modified string.
  let result = modifiedString;
  result =
    result.substring(0, occurrences[0]) +
    "a19f" +
    result.substring(occurrences[0] + 4);
  result =
    result.substring(0, occurrences[1]) +
    "a39f" +
    result.substring(occurrences[1] + 4);
  result =
    result.substring(0, occurrences[2]) +
    "a19f" +
    result.substring(occurrences[2] + 4);
  return result.substring(0, result.length - 2);
};

function transformString(originalString: string): string {
  let result = originalString;

  const bfIndex = originalString.indexOf("bf");
  if (bfIndex === -1) return result; // 'bf' not found

  const firstFfIndex = originalString.indexOf("ff", bfIndex + 2);
  if (firstFfIndex === -1) return result; // First 'ff' not found

  const secondFfIndex = originalString.indexOf("ff", firstFfIndex + 2);
  if (secondFfIndex === -1) return result; // Second 'ff' not found

  const part1 = originalString.substring(0, bfIndex);
  const part2_middle = originalString.substring(bfIndex + 2, secondFfIndex);
  const part3_end = originalString.substring(secondFfIndex + 2);

  result = part1 + "a1" + part2_middle + part3_end;
  return result;
}
