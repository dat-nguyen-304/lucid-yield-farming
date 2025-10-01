
import axios from "axios";

const apiRequestBody = {
    poolId:
      "fbfe1688e61ff0e52da1ccbaf1b3a601c66b670272ddb5e197ca39bd.046f6a13b524d5884e49d2262bf4d261153d0501b78acb3f9fa9fb67",
    borrowAmount: "100000000",
    loanDuration: "60",
    collaterals: [
      {
        collateralToken:
          "919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.74444a4544",
        collateralAmount: "142770657",
      },
    ],
  };
const response = await axios.post(
    "https://danogo-lending-preview.tekoapis.net/api/v1/get-create-fixed-loan-params",
    apiRequestBody
  );
  export  const apiResponse = response.data as ApiResponse;
  console.log({apiResponse})
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
  liqwidInUtxo: ApiUtxo | null;
  poolInUtxo: ApiUtxo;
  floatPoolInUtxo: ApiUtxo | null;
  stakingContractInUtxo: ApiUtxo | null;
}

export interface ApiOutputs {
  poolOutUtxo: ApiUtxo;
  loanOutUtxo: ApiUtxo;
  feeOutUtxo: ApiUtxo | null;
  liqwidOutUtxo: ApiUtxo | null;
  floatPoolOutUtxo: ApiUtxo | null;
  stakingContractOutUtxo: ApiUtxo | null;
  withdrawalFeeOutUtxo: ApiUtxo | null;
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

export interface ApiWithdrawalRedeemer {
  prices: ApiPriceGroup[];
  borrowRates: ApiBorrowRate[];
}

export interface ApiWithdrawal {
  rewardAddressScriptHash: string;
  coin: string;
  withdrawalRedeemer: ApiWithdrawalRedeemer;
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

// ---- Datum Types ----

export interface PoolDatum {
  supplyToken: string;
  supplyYieldToken: string;
  circulatingPTSupply: string;
  circulatingYTSupply: string;
  supplyMaturity: string;
  baseInterestRate: number;
  gradient: number;
  maxLoanDuration: string;
  activeLoanCount: number;
  minBorrowAmount: string;
  collaterals: {
    collateralToken: string;
    liquidationThreshold: number;
  }[];
}

export interface LoanDatum {
  loanAmount: string;
  loanMaturity: string | null;
  loanOwnerNft: string;
  loanProfitFee: string;
  minAda: null;
}

export interface FloatPoolDatum {
  totalSupply: string;
  circulatingDToken: string;
  totalBorrow: string;
  borrowRate: number;
  interestIndex: string;
  interestTime: string;
  undistributedFee: string;
  dTokenRateNum: string;
  dTokenRateDen: string;
  alternativeSupplyTokens: {
    token: string;
    latestExchangeRateNum: string;
    latestExchangeRateDen: string;
  }[];
}

export type ApiDatum = PoolDatum | LoanDatum | FloatPoolDatum;

// ---- UTxO ----

export interface ApiUtxo {
  outRef?: string; // optional in inputs
  address: string;
  coin: string;
  multiAssets: ApiMultiAsset[];
  datum?: ApiDatum;
}
