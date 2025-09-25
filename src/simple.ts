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
  TxSignBuilder,
} from "@lucid-evolution/lucid";
import { apiResponse } from "./apiResponse.js";
import type { Assets, UTxO, OutRef, Script } from "@lucid-evolution/lucid";
import type {
  ApiUtxo,
  ApiResponse,
  ApiMultiAsset,
  ApiData,
  ApiReferenceInput,
  FloatPoolDatum,
} from "./apiResponse.js";
// --- Type definitions for better code clarity and safety ---
const now = parseInt(
  // The non-null assertions (!) are safe here because we know our static
  // apiResponse object contains these values.
  (apiResponse.data.outputs.floatPoolOutUtxo!.datum! as FloatPoolDatum)
    .interestTime,
  10
);

// IMPORTANT: Replace this with your actual 24-word seed phrase.
// It's recommended to load this from a secure environment variable.
const seedPhrase =
  "fork target sense patient museum unusual rough hair brief misery main duty below garbage pizza oval truth invite vessel father flame repair ketchup field";

const simple = async () => {
  const samples = [
    { label: 674, data: ["msg", ["abc1234"] ] }, // ✅ array
  ];

  for (const s of samples) {
    try {
      const lucid: LucidEvolution = await Lucid(
        new Blockfrost(
          "https://cardano-preview.blockfrost.io/api/v0",
          "previewFXVEf9xh8CIKeXDimSww7HCUumrxN22w"
        ),
        "Preview"
      );

      const accountIndexToUse = 1;

      // ✅ correct way to select wallet from seed
      lucid.selectWallet.fromSeed(seedPhrase, {
        accountIndex: accountIndexToUse,
      });

      const addr = await lucid.wallet().address();
      // build tx
      let tx = lucid
        .newTx()
        .pay.ToAddress("addr_test1qqmesf3ascljjeud8c45txn4z4yv63rdyep7vtckdjwudvf232nj4jhfph0vgc8dmjs4mfwmmxgsvwwlvt79htwafu2stywrh5", { lovelace: 2_000_000n })
    tx = tx.attachMetadata(s.label, s.data)
        const txSigned = await tx.complete(); 

      // ✅ sign + submit
      const signed = await txSigned.sign.withWallet().complete();
      const txHash = await signed.submit();

      console.log("SUCCESS for", s, "Tx hash:", txHash);
    } catch (e) {
      console.error("FAIL for", s, e);
    }
  }
};

simple();
