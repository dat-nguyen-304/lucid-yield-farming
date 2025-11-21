import { Constr, Data, UTxO } from "@lucid-evolution/lucid";
import { apiInputs, apiOutputs } from "./lpResponse.js";
import { apiToUtxo } from "./convertApi2.js";

export const createPoolRedeemer = async (deltaAmount:number, userInput: UTxO): Promise<string> => {
  try {
    const poolInUtxo = apiToUtxo(apiInputs.poolInUtxo);
    let allInputs = [
      userInput,
      poolInUtxo,
    ]

    allInputs = allInputs.sort((a, b) =>
      a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
    );

    const poolInIndex = allInputs.findIndex(
      (inp) =>
        inp.txHash === poolInUtxo.txHash &&
        inp.outputIndex === poolInUtxo.outputIndex
    );

    const outputs = [
        apiOutputs.poolOutUtxo
    ]
    const poolOutIndex = 0

    const redeemerCbor = Data.to(
      new Constr(0, [
        new Constr(2, [BigInt(poolOutIndex), BigInt(poolOutIndex), BigInt(deltaAmount)]),
        BigInt(poolInIndex),
      ])
    );

    return redeemerCbor;
  } catch (error) {
    console.error("Error creating loan redeemer:", error);
    throw error;
  }
};