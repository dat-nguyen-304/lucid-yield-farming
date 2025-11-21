import { Data, toHex } from "@lucid-evolution/lucid";
import { PoolDatum } from "./lpResponse.js";
import { tokenIdToTuple } from "./datum.js";
import { encodeData } from "./schema.js";

export const transformPoolDatum = (datum: PoolDatum): string => {
  const TokenIdSchema = Data.Tuple([Data.Bytes(), Data.Bytes()]);

  const PoolDatumSchema = Data.Tuple(
    [
      TokenIdSchema, // tokenA
      TokenIdSchema, // tokenB
      Data.Integer(), // sqrtPriceLowerNum
      Data.Integer(), // sqrtPriceLowerDen
      Data.Integer(), // sqrtPriceUpperNum
      Data.Integer(), // sqrtPriceUpperDen
      Data.Integer(), // lpFeeRate
      Data.Integer(), // platformFeeA
      Data.Integer(), // platformFeeB,
      Data.Integer(), // minAChange
      Data.Integer(), // minBChange
      Data.Integer(), // circulatingLpToken
    ],
    { hasConstr: true }
  );

  const tokenA: [string, string] = tokenIdToTuple(datum.tokenA).map((v) =>
    v instanceof Uint8Array ? toHex(v) : v
  ) as [string, string];
  const tokenB: [string, string] = tokenIdToTuple(datum.tokenA).map((v) =>
    v instanceof Uint8Array ? toHex(v) : v
  ) as [string, string];
  
  const dataArray: [
    [string, string],
    [string, string],
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint
  ] = [
    tokenA,
    tokenB,
    BigInt(datum.sqrtPriceLowerNum),
    BigInt(datum.sqrtPriceLowerDen),
    BigInt(datum.sqrtPriceUpperNum),
    BigInt(datum.sqrtPriceUpperDen),
    BigInt(datum.lpFeeRate),
    BigInt(datum.platformFeeA),
    BigInt(datum.platformFeeB),
    BigInt(datum.minBChange),
    BigInt(datum.minAChange),
    BigInt(datum.circulatingLpToken),
  ];

  return encodeData(dataArray, PoolDatumSchema);
};
