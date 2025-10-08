import { Constr, Data, fromHex, toHex } from "@lucid-evolution/lucid";
import {
  FloatPoolDatum,
  interestTime,
  LiqwidPoolDatum,
  LoanDatum,
  PoolDatum,
  StakingPoolDatum,
} from "./apiResponse.js";
import { encodeData } from "./schema.js";
import { transformString } from "./transform.js";

// Enhanced datum transformations with CBOR validation
export const transformDatum = (outputKey: string, datum: any): string => {
  try {
    switch (outputKey) {
      case "loanOutUtxo":
        return transformLoanDatum(datum as LoanDatum);
      case "poolOutUtxo":
        return transformPoolDatum(datum as PoolDatum);
      case "floatPoolOutUtxo":
        return transformFloatPoolDatum(datum as FloatPoolDatum);
      case "stakingContractOutUtxo":
        return transformStakingPoolDatum(datum as StakingPoolDatum);
      case "liqwidOutUtxo":
        return transformLiqwidPoolDatum(datum as LiqwidPoolDatum);
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

  const loanMaturity = interestTime + 60 * 360000; // 1 day = 360000

  const dataArray: [bigint, bigint, bigint, string] = [
    BigInt(datum.loanProfitFee),
    BigInt(datum.loanAmount),
    BigInt(loanMaturity),
    loanOwnerNFTName,
  ];

  const encodedData = encodeData(dataArray, LoanDatumSchema);

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

  return encodedData;
};

export const transformStakingPoolDatum = (datum: StakingPoolDatum): string => {
  const StakingPoolDatumSchema = Data.Tuple(
    [Data.Integer(), Data.Integer(), Data.Integer()],
    { hasConstr: true }
  );
  const dataArray: [bigint, bigint, bigint] = [
    BigInt(datum.totalSupply),
    BigInt(datum.circulatingSToken),
    BigInt(datum.validUntil),
  ];

  const encodedData = encodeData(dataArray, StakingPoolDatumSchema);

  return encodedData;
};

export const transformLiqwidPoolDatum = (datum: LiqwidPoolDatum): string => {
  const LiqwidPoolDatumSchema = Data.Tuple(
    [
      Data.Tuple([
        Data.Integer(),
        Data.Integer(),
        Data.Integer(),
        Data.Integer(),
        Data.Integer(),
      ]),
      Data.Integer(),
    ]
  );
  const dataArray: [[bigint, bigint, bigint, bigint, bigint], bigint] = [
    [
      BigInt(datum.supplyChanged),
      BigInt(datum.mintChanged),
      BigInt(datum.principal),
      BigInt(datum.interest),
      BigInt(datum.minInterest),
    ],
    BigInt(datum.poolIndex),
  ];

  const encodedData = encodeData(dataArray, LiqwidPoolDatumSchema);

  return encodedData;
};

// Enhanced tokenIdToTuple with better error handling
export const tokenIdToTuple = (tokenId: string): [string, Uint8Array] => {
  const emptyBytes = new Uint8Array(0);

  if (!tokenId) return ["", emptyBytes];

  try {
    const parts = tokenId.split(".");
    if (parts.length === 2) {
      const policy = parts[0] ?? "";
      const assetName = parts[1] ?? "";

      if (assetName.length > 0) return [policy, fromHex(assetName)];

      return [policy, emptyBytes];
    }
    return [tokenId, emptyBytes];
  } catch (error) {
    console.error(`Error parsing token ID "${tokenId}":`, error);
    throw new Error(`Failed to parse token ID: ${tokenId}`);
  }
};
