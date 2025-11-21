import { stringify } from "@lucid-evolution/lucid";

const response = {
  data: {},
};

const apiResponse = response.data as ApiResponse;

console.log({ apiResponse: stringify(apiResponse) });

const {
  inputs: apiInputs,
  outputs: apiOutputs,
  mint: apiMint,
  withdrawal: apiWithdrawal,
  referenceInputs: apiRefInputs,
} = apiResponse.data;

export { apiInputs, apiOutputs, apiMint, apiWithdrawal, apiRefInputs };

export interface ApiResponse {
  code: number;
  traceId: string;
  message: string;
  data: ApiData;
}

export interface ApiData {
  inputs: ApiInputs;
  outputs: ApiOutputs;
  withdrawal: ApiWithdrawal;
  mint: ApiMint;
  referenceInputs: ApiReferenceInput[];
  auxiliaryData: ApiAuxiliaryData;
  smartContractVersion: string;
}

// apiResponse.ts
export interface ApiAsset {
  name: string;
  value: string;
}

export interface ApiMultiAsset {
  policyId: string;
  assets: ApiAsset[];
}

export interface ApiInputs {
  poolInUtxo: ApiUtxo;
}

export interface ApiOutputs {
  poolOutUtxo: ApiUtxo;
  feeOutUtxo: ApiUtxo | null;
}

export interface ApiReferenceInput {
  outRef: string;
  type: string;
}

export interface ApiOraclePrice {
  collateralToken: string;
  priceNum: string;
  priceDen: string;
}

export interface ApiPriceGroup {
  borrowToken: string;
  oraclePrices: ApiOraclePrice[];
}

export interface ApiBorrowRate {
  yieldToken: string;
  borrowRate: string;
}

export interface ApiWithdrawal {
  rewardAddressScriptHash: string;
  coin: string;
  stakeAddress: string | null;
  stakeRewards: string | null;
}

export interface ApiMint {
  multiAssets: (ApiMultiAsset & { redeemerType: string })[];
}

export interface ApiAuxiliaryData {
  loanOwnerNftMetadata: {
    name: string;
    image: string;
    description: string;
  };
}

export interface PoolDatum {
  tokenA: string;
  tokenB: string;
  sqrtPriceLowerNum: number;
  sqrtPriceLowerDen: number;
  sqrtPriceUpperNum: number;
  sqrtPriceUpperDen: number;
  lpFeeRate: number;
  platformFeeA: number;
  platformFeeB: number;
  minAChange: number;
  minBChange: number;
  circulatingLpToken: number;
}

// ---- UTxO ----

export interface ApiUtxo {
  outRef?: string; // optional in inputs
  address: string;
  coin: string;
  multiAssets: ApiMultiAsset[];
  datum?: PoolDatum;
}
