import {
  Lucid,
  LucidEvolution,
  credentialToRewardAddress,
  TxBuilder,
  Kupmios,
  Blockfrost,
} from "@lucid-evolution/lucid";
import {
  apiInputs,
  apiMint,
  apiOutputs,
  apiRefInputs,
  apiWithdrawal,
  interestTime,
} from "./apiResponse.js";
import type { Assets, UTxO, OutRef } from "@lucid-evolution/lucid";
import { transformDatum } from "./datum.js";
import { apiToAssets, apiToRefUtxo, apiToUtxo } from "./convertApi.js";
import {
  createFloatPoolRedeemer,
  createLiqwidRedeemer,
  createLoanRedeemer,
  createOracleRedeemer,
  createStakingRedeemer,
} from "./redeemer.js";

// IMPORTANT: Replace this with your actual 24-word seed phrase
const seedPhrase =
  "fork target sense patient museum unusual rough hair brief misery main duty below garbage pizza oval truth invite vessel father flame repair ketchup field";

const main = async () => {
  console.log("Preparing transaction...");

  try {
    const lucid: LucidEvolution = await Lucid(
      // new Blockfrost("https://blockfrost1qt3hwvdf3rmsy3lu5aq.blockfrost-m1.demeter.run"
      //   "https://cardano-preview.blockfrost.io/api/v0/",
      //   "previewkUPq78ccpDRbXNQM3YeSg6YhXgq9JoNT"
      // ),
      new Kupmios(
        "https://kupo1tj2lsutwa9lhyend373.preview-v2.kupo-m1.demeter.run",
        "https://ogmios1zpmknz7hs6sx2eegtcw.preview-v6.ogmios-m1.demeter.run"
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
      (utxo) => utxo.assets[collateralAsset] >= collateralAmount
    );
    if (!collateralUtxo) {
      throw new Error(
        `Could not find collateral asset (${collateralAsset}) in your wallet.`
      );
    } else console.log({ userInput: collateralUtxo });

    // 2. Collect Inputs from API
    const fixedPoolInUtxo: UTxO[] = [apiToUtxo(apiInputs.poolInUtxo)];
    const floatPoolInUtxo: UTxO[] = [apiToUtxo(apiInputs.floatPoolInUtxo)];
    const stakingContractInUtxo: UTxO | undefined =
      apiInputs.stakingContractInUtxo
        ? apiToUtxo(apiInputs.stakingContractInUtxo)
        : undefined;
    const liqwidPoolInUtxo: UTxO | undefined =
      apiInputs.liqwidInUtxo
        ? apiToUtxo(apiInputs.liqwidInUtxo)
        : undefined;

    if (!fixedPoolInUtxo.length)
      throw new Error("Could not find fixed pool input UTxO.");
    if (!floatPoolInUtxo.length)
      throw new Error("Could not find float pool input UTxO.");

    // 3. Add Reference Inputs
    const isOutRef = (x: OutRef | null): x is OutRef =>
      x !== null && x !== undefined;
    const refUtxos = apiRefInputs
      .map(apiToRefUtxo)
      .filter(isOutRef)
      .sort(
        // no need to sort but sort to debug easily
        (a, b) =>
          a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
      );

    const refUtxosOnChain: UTxO[] = await lucid.utxosByOutRef(refUtxos);
    tx = tx.readFrom(refUtxosOnChain);

    // 4. Add Outputs
    const orderedOutputs = [
      {
        key: "floatPoolOutUtxo",
        value: apiOutputs.floatPoolOutUtxo,
      },
      { key: "poolOutUtxo", value: apiOutputs.poolOutUtxo },
      { key: "feeOutUtxo", value: apiOutputs.feeOutUtxo },
      { key: "loanOutUtxo", value: apiOutputs.loanOutUtxo },
      {
        key: "stakingContractOutUtxo",
        value: apiOutputs.stakingContractOutUtxo,
      },
      { key: "withdrawalFeeOutUtxo", value: apiOutputs.withdrawalFeeOutUtxo },
      { key: "liqwidOutUtxo", value: apiOutputs.liqwidOutUtxo },
    ];

    for (const { key, value: apiOut } of orderedOutputs) {
      if (!apiOut) continue;
      if (apiOut.coin === "0") {
        apiOut.coin = "2000000"; // set minAda = 2 for loanOutUtxo
        // add stake key of user's wallet if needed
        // apiOut.address =
        //   "addr_test1zrs6vjp5wwjavyyw6tkh73f294dnhmz6a2a7xvalte4j2pg8gkm7g90pw4l5edvw8ny96ykpqyrcy9z5dzqv4es4r2asywgcfs";
      }

      const assets: Assets = apiToAssets(apiOut.multiAssets, apiOut.coin);

      if (apiOut.datum) {
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

    // 5. Add Metadata - This is the correct place to attach it.
    tx = tx.attachMetadata(674, {
      msg: ["Danogo Fixed-Rate Lending: Create Loan"],
    });
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

    // 6. Build redeemers for spend/mint/withdraw
    console.log("Building redeemers...");

    const createLoanRedeemerData: string = await createLoanRedeemer(
      collateralUtxo
    );
    console.log({ createLoanRedeemerData });
    const floatPoolRedeemerData: string = await createFloatPoolRedeemer();
    console.log({ floatPoolRedeemerData });
    const oracleRedeemerData = await createOracleRedeemer();
    console.log({ oracleRedeemerData });
    let stakingRedeemerData, liqwidRedeemerData;
    if (apiInputs.stakingContractInUtxo) {
      stakingRedeemerData = await createStakingRedeemer();
      console.log({ stakingRedeemerData });
    }
    if (apiInputs.liqwidInUtxo) {
      liqwidRedeemerData = await createLiqwidRedeemer();
      console.log({ liqwidRedeemerData });
    }

    // Now that we have the final redeemers, we can collect the script inputs.
    tx = tx
      .collectFrom([collateralUtxo])
      .collectFrom(fixedPoolInUtxo, createLoanRedeemerData)
      .collectFrom(floatPoolInUtxo, floatPoolRedeemerData);
    if (stakingContractInUtxo)
      tx = tx.collectFrom([stakingContractInUtxo], stakingRedeemerData);
    if (liqwidPoolInUtxo)
      tx = tx.collectFrom([liqwidPoolInUtxo], liqwidRedeemerData)

    // 7. Add withdrawal with a placeholder, as its redeemer will be updated later.
    if (apiWithdrawal) {
      const rewardScriptHash = apiWithdrawal.rewardAddressScriptHash.startsWith(
        "f0"
      )
        ? apiWithdrawal.rewardAddressScriptHash.substring(2)
        : apiWithdrawal.rewardAddressScriptHash;
      const rewardAddress = credentialToRewardAddress(lucid.config().network!, {
        type: "Script",
        hash: rewardScriptHash,
      });
      tx = tx.withdraw(
        rewardAddress,
        BigInt(apiWithdrawal.coin),
        oracleRedeemerData
      );
      if (apiInputs.stakingContractInUtxo !== null && apiWithdrawal.stakeRewards) {
        tx = tx.withdraw(
          apiWithdrawal.stakeAddress!,
          BigInt(apiWithdrawal.stakeRewards),
          stakingRedeemerData
        )
      }
    }

    // 8. Add Minting with the correct redeemer
    // Note: The new TxBuilder automatically handles grouping assets by policy.
    for (const mint of apiMint.multiAssets) {
      const redeemer = (function () {
        switch (mint.redeemerType) {
          case "FIXED":
            return createLoanRedeemerData;
          case "FLOAT":
            return floatPoolRedeemerData;
          case "STAKING":
            return stakingRedeemerData;
          case "LIQWID":
            return liqwidRedeemerData;
          default:
            throw new Error(`Unknown redeemer type: ${mint.redeemerType}`);
        }
      })();

      const mintAssets: Assets = {};
      for (const asset of mint.assets) {
        const unit = mint.policyId + (asset.name || "");
        mintAssets[unit] = (mintAssets[unit] || 0n) + BigInt(asset.value);
      }
      tx = tx.mintAssets(mintAssets, redeemer);
    }

    console.log({ gap: Date.now() - interestTime });
    tx = tx
      .validFrom(interestTime)
      .validTo(interestTime + 360000)
      .setMinFee(17000n)
      .addSigner(await lucid.wallet().address());

    const builtTx = await tx.complete({ localUPLCEval: false });
    const signedTx = await builtTx.sign.withWallet().complete();

    const txHash = await signedTx.submit();
    console.log("Complex transaction submitted successfully!");
    console.log(`Tx Hash: ${txHash}`);
    console.log(`https://preview.cardanoscan.io/transaction/${txHash}`);
  } catch (err: any) {
    console.error("CompleteTxError:", err?.message || err);
    if (err?.cause) {
      console.error("Cause JSON:", JSON.stringify(err.cause, null, 2));
    }
    throw err;
  }
};

main();
