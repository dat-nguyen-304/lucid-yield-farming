import { Constr, Data, OutRef, toHex, UTxO } from "@lucid-evolution/lucid";
import { encodeData } from "./schema.js";
import { tokenIdToTuple } from "./datum.js";
import { OracleUtxoType } from "./enum.js";
import {
  apiInputs,
  apiOutputs,
  apiRefInputs,
  ApiUtxo,
  apiWithdrawal,
  referenceInputByType,
} from "./apiResponse.js";
import { apiToRefUtxo, apiToUtxo } from "./convertApi.js";

const outputs = [
  apiOutputs.floatPoolOutUtxo,
  apiOutputs.poolOutUtxo,
  apiOutputs.feeOutUtxo,
  apiOutputs.loanOutUtxo,
  apiOutputs.stakingContractOutUtxo,
  apiOutputs.withdrawalFeeOutUtxo,
  apiOutputs.liqwidOutUtxo,
].filter((o): o is ApiUtxo => o !== null);

const oracleOutputByOutRef = new Map<string, number>();
export const createLoanRedeemer = async ( collateralUtxo: UTxO): Promise<string> => {
  try {
    let allInputs = [
      collateralUtxo,
      apiToUtxo(apiInputs.poolInUtxo),
      apiToUtxo(apiInputs.floatPoolInUtxo),
    ]
    if (apiInputs.stakingContractInUtxo)
      allInputs.push(apiToUtxo(apiInputs.stakingContractInUtxo))
    if (apiInputs.liqwidInUtxo)
      allInputs.push(apiToUtxo(apiInputs.liqwidInUtxo))
    allInputs = allInputs.sort((a, b) =>
      a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
    );

    const poolInUtxo = apiToUtxo(apiInputs.poolInUtxo);
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

    const refInputs = apiRefInputs
      .map(apiToRefUtxo)
      .filter((r): r is OutRef => r !== null)
      .sort(
        (a, b) =>
          a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
      );

    const fixedProtocolScriptRef = apiToRefUtxo(
      apiRefInputs.find((r) => r.type === "FIXED_PROTOCOL_SCRIPT")
    );
    const fixedProtocolConfigRef = apiToRefUtxo(
      apiRefInputs.find((r) => r.type === "FIXED_PROTOCOL_CONFIG")
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

    const poolOutIndex = outputs.findIndex(
      (out) => out.address === apiOutputs.poolOutUtxo.address
    );
    const loanOutIndex = outputs.findIndex(
      (out) => out.address === apiOutputs.loanOutUtxo.address
    );
    const feeOutIndex = outputs.findIndex(
      (out) => out.address === apiOutputs.feeOutUtxo?.address
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

    return redeemerCbor;
  } catch (error) {
    console.error("Error creating loan redeemer:", error);
    throw error;
  }
};

export const createFloatPoolRedeemer = async (): Promise<string> => {
  try {
    const refInputs = apiRefInputs
      .map(apiToRefUtxo)
      .filter((r): r is OutRef => r !== null)
      .sort(
        (a, b) =>
          a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
      );

    const protocolConfigRef = apiToRefUtxo(
      apiRefInputs.find((r) => r.type === "FLOAT_PROTOCOL_CONFIG")
    );
    const poolParamsRef = apiToRefUtxo(
      apiRefInputs.find((r) => r.type === "FLOAT_POOL_CONFIG")
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

    const poolOutIndex = outputs.findIndex(
      (out) => out.address === apiOutputs.floatPoolOutUtxo?.address
    );
    const feeOutIndex = outputs.findIndex(
      (out) => out.address === apiOutputs.withdrawalFeeOutUtxo?.address
    );

    oracleOutputByOutRef.set(
      apiInputs.floatPoolInUtxo!.outRef as string,
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

    return redeemerCbor;
  } catch (error) {
    console.error("Error creating float pool redeemer:", error);
    throw error;
  }
};

export const createOracleRedeemer = async (): Promise<string> => {
  try {
    const refInputs = apiRefInputs
      .map(apiToRefUtxo)
      .filter((r): r is OutRef => r !== null)
      .sort(
        (a, b) =>
          a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
      );

    const oracleSourceRef = apiToRefUtxo(
      apiRefInputs.find((r) => r.type === "ORACLE_CONFIG") // ORACLE_SOURCE in kotlin
    );
    const oraclePathRefs = apiRefInputs
      .filter((r) => r.type === "ORACLE_SOURCE_PATH") // ORACLE_PATH in kotlin
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

    // add oracle indexes for output (for floatPoolOut)
    oracleOutByType.forEach((outputIndex, oracleType) => {
      if (oracleUTxOTypes.has(oracleType)) {
        oracleIndexes.push(
          makeOracleIndex(
            1, // UtxoTarget index for output = 1
            OracleUtxoType[oracleType as keyof typeof OracleUtxoType],
            outputIndex
          )
        );
      }
    });

    // add oracle indexes for reference inputs
    oracleRefByType.forEach((outRefs, oracleType) => {
      outRefs.forEach((outRef) => {
        const index = refInputs.findIndex(
          (ref) => ref.txHash + "#" + ref.outputIndex.toString() === outRef
        );
        if (index !== -1 && oracleUTxOTypes.has(oracleType)) {
          oracleIndexes.push(
            makeOracleIndex(
              0, // UtxoTarget index for reference input = 0
              OracleUtxoType[oracleType as keyof typeof OracleUtxoType],
              index
            )
          );
        }
      });
    });

    // TODO: Update type instead of using "any"
    const pricesMap = new Map<any, any>();
    const priceGroups = (apiWithdrawal.withdrawalRedeemer?.prices ??
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
    const brs = (apiWithdrawal.withdrawalRedeemer?.borrowRates ??
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
    return encodedData;
  } catch (error) {
    console.error("Error creating oracle redeemer:", error);
    throw error;
  }
};

export const createStakingRedeemer = async (): Promise<string> => {
  try {
    const poolOutIndex = outputs.findIndex(
      (out) => out.address === apiOutputs.stakingContractOutUtxo?.address
    );
    const inputOutRef = apiInputs.stakingContractInUtxo!.outRef as string;

    oracleOutputByOutRef.set(inputOutRef, poolOutIndex);
    console.log("staking redeemer", Data.to(new Constr(1, [BigInt(poolOutIndex)])))
    return Data.to(new Constr(1, [BigInt(poolOutIndex)]));
  } catch (error) {
    console.error("Error creating staking redeemer:", error);
    throw error;
  }
};

export const createLiqwidRedeemer = async (): Promise<string> => {
  try {
    return Data.to(new Constr(0, []));
  } catch (error) {
    console.error("Error creating staking redeemer:", error);
    throw error;
  }
};
