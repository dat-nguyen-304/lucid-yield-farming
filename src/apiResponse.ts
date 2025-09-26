

export const apiResponse: ApiResponse = {
    "code": 0,
    "traceId": "4210e930416ce7cb9456d98efe82af84",
    "message": "success",
    "data": {
        "inputs": {
            "liqwidInUtxo": null,
            "poolInUtxo": {
                "outRef": "2647ec8e69ad90007309ea5acf137e6946245908791d1cfd81f704054889eb3d#2",
                "address": "addr_test1zralu95guc0lpefd58xt4udn5cquv6m8qfedmd0pjl9rn0g8gkm7g90pw4l5edvw8ny96ykpqyrcy9z5dzqv4es4r2asu0esez",
                "coin": "2228270",
                "multiAssets": [
                    {
                        "policyId": "7b595fd9e70b625caeace2e20ac91f292e4cc7f510a23fb71916b76b",
                        "assets": [
                            {
                                "name": "32c41815d270a4cc8be4bc9d3d171546b44d36cb57aa7b8b05618558",
                                "value": "995202235"
                            }
                        ]
                    },
                    {
                        "policyId": "fbfe1688e61ff0e52da1ccbaf1b3a601c66b670272ddb5e197ca39bd",
                        "assets": [
                            {
                                "name": "676cd3a21e5cadd9c41fec6b2a5c405ee0c9c275a82c6990ced01bdb",
                                "value": "1"
                            }
                        ]
                    }
                ]
            },
            "floatPoolInUtxo": {
                "outRef": "b66d6976c5d6f535313a8e584bf0d3925cbfa45462410adc0c054e1235b1a2cc#0",
                "address": "addr_test1wpa4jh7euu9kyh9w4n3wyzkfru5junx875g2y0ahryttw6clekqft",
                "coin": "20385102236",
                "multiAssets": [
                    {
                        "policyId": "5bc56ab821b1efbce5be150bd97613c577f32167611211ef742c71f0",
                        "assets": [
                            {
                                "name": "32c41815d270a4cc8be4bc9d3d171546b44d36cb57aa7b8b05618558",
                                "value": "1"
                            }
                        ]
                    },
                    {
                        "policyId": "7aa4312097def38936c7b69fb380f9e8685dfa17c52c68151781ea03",
                        "assets": [
                            {
                                "name": "",
                                "value": "325544392320"
                            }
                        ]
                    }
                ]
            },
            "stakingContractInUtxo": null
        },
        "outputs": {
            "poolOutUtxo": {
                "address": "addr_test1zralu95guc0lpefd58xt4udn5cquv6m8qfedmd0pjl9rn0g8gkm7g90pw4l5edvw8ny96ykpqyrcy9z5dzqv4es4r2asu0esez",
                "coin": "2228270",
                "multiAssets": [
                    {
                        "policyId": "7b595fd9e70b625caeace2e20ac91f292e4cc7f510a23fb71916b76b",
                        "assets": [
                            {
                                "name": "32c41815d270a4cc8be4bc9d3d171546b44d36cb57aa7b8b05618558",
                                "value": "895833744"
                            }
                        ]
                    },
                    {
                        "policyId": "fbfe1688e61ff0e52da1ccbaf1b3a601c66b670272ddb5e197ca39bd",
                        "assets": [
                            {
                                "name": "676cd3a21e5cadd9c41fec6b2a5c405ee0c9c275a82c6990ced01bdb",
                                "value": "1"
                            }
                        ]
                    }
                ],
                "datum": {
                    "supplyToken": "",
                    "supplyYieldToken": "7b595fd9e70b625caeace2e20ac91f292e4cc7f510a23fb71916b76b.32c41815d270a4cc8be4bc9d3d171546b44d36cb57aa7b8b05618558",
                    "circulatingPTSupply": "999999999",
                    "circulatingYTSupply": "999999999",
                    "supplyMaturity": "1758931200000",
                    "baseInterestRate": 2000,
                    "gradient": 1800,
                    "maxLoanDuration": "64800000",
                    "activeLoanCount": 1,
                    "minBorrowAmount": "100000000",
                    "collaterals": [
                        {
                            "collateralToken": "919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.74444a4544",
                            "liquidationThreshold": 8000
                        }
                    ]
                }
            },
            "loanOutUtxo": {
                "address": "addr_test1wrs6vjp5wwjavyyw6tkh73f294dnhmz6a2a7xvalte4j2pgemsun9",
                "coin": "0",
                "multiAssets": [
                    {
                        "policyId": "919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e",
                        "assets": [
                            {
                                "name": "74444a4544",
                                "value": "142770657"
                            }
                        ]
                    },
                    {
                        "policyId": "e1a6483473a5d6108ed2ed7f452a2d5b3bec5aeabbe333bf5e6b2505",
                        "assets": [
                            {
                                "name": "676cd3a21e5cadd9c41fec6b2a5c405ee0c9c275a82c6990ced01bdb",
                                "value": "1"
                            }
                        ]
                    }
                ],
                "datum": {
                    "loanAmount": "101693152",
                    "loanMaturity": null,
                    "loanOwnerNft": "e1a6483473a5d6108ed2ed7f452a2d5b3bec5aeabbe333bf5e6b2505.9e407073e5b7753c39888b92c5dc6479bc49b7e9484c36dec3d23d72dac0cf7e",
                    "loanProfitFee": "169316"
                }
            },
            "feeOutUtxo": {
                "address": "addr_test1vq0p9axxfcn53mz66vpcpxw5qtrurn9edftz4rg7wrdu40cp668qs",
                "coin": "1000001",
                "multiAssets": []
            },
            "liqwidOutUtxo": null,
            "floatPoolOutUtxo": {
                "address": "addr_test1wpa4jh7euu9kyh9w4n3wyzkfru5junx875g2y0ahryttw6clekqft",
                "coin": "20285102236",
                "multiAssets": [
                    {
                        "policyId": "5bc56ab821b1efbce5be150bd97613c577f32167611211ef742c71f0",
                        "assets": [
                            {
                                "name": "32c41815d270a4cc8be4bc9d3d171546b44d36cb57aa7b8b05618558",
                                "value": "1"
                            }
                        ]
                    },
                    {
                        "policyId": "7aa4312097def38936c7b69fb380f9e8685dfa17c52c68151781ea03",
                        "assets": [
                            {
                                "name": "",
                                "value": "325544392320"
                            }
                        ]
                    }
                ],
                "datum": {
                    "totalSupply": "364652099533",
                    "circulatingDToken": "362349288114",
                    "totalBorrow": "1823072536",
                    "borrowRate": 500,
                    "interestIndex": "1006879702745",
                    "interestTime": "1758881934000",
                    "undistributedFee": "63098",
                    "dTokenRateNum": "364752083494",
                    "dTokenRateDen": "362448656605",
                    "alternativeSupplyTokens": [
                        {
                            "token": "7aa4312097def38936c7b69fb380f9e8685dfa17c52c68151781ea03",
                            "latestExchangeRateNum": "807257095351",
                            "latestExchangeRateDen": "767183760079"
                        }
                    ]
                }
            },
            "stakingContractOutUtxo": null,
            "withdrawalFeeOutUtxo": null
        },
        "withdrawal": {
            "rewardAddressScriptHash": "f0a2fa8564c279ca144d69bbbd37057f5d3d42e59555bc3bfb874919f6",
            "coin": "0",
            "withdrawalRedeemer": {
                "prices": [
                    {
                        "borrowToken": "",
                        "oraclePrices": [
                            {
                                "collateralToken": "7aa4312097def38936c7b69fb380f9e8685dfa17c52c68151781ea03",
                                "priceNum": "807257095351",
                                "priceDen": "767183760079"
                            },
                            {
                                "collateralToken": "7b595fd9e70b625caeace2e20ac91f292e4cc7f510a23fb71916b76b.32c41815d270a4cc8be4bc9d3d171546b44d36cb57aa7b8b05618558",
                                "priceNum": "364652099533",
                                "priceDen": "362349288114"
                            },
                            {
                                "collateralToken": "919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.74444a4544",
                                "priceNum": "221758",
                                "priceDen": "155667"
                            }
                        ]
                    }
                ],
                "borrowRates": [
                    {
                        "yieldToken": "7b595fd9e70b625caeace2e20ac91f292e4cc7f510a23fb71916b76b.32c41815d270a4cc8be4bc9d3d171546b44d36cb57aa7b8b05618558",
                        "borrowRate": "500"
                    }
                ]
            },
            "stakeAddress": null,
            "stakeRewards": null
        },
        "mint": {
            "multiAssets": [
                {
                    "policyId": "7b595fd9e70b625caeace2e20ac91f292e4cc7f510a23fb71916b76b",
                    "assets": [
                        {
                            "name": "32c41815d270a4cc8be4bc9d3d171546b44d36cb57aa7b8b05618558",
                            "value": "-99368491"
                        }
                    ],
                    "redeemerType": "FLOAT"
                },
                {
                    "policyId": "e1a6483473a5d6108ed2ed7f452a2d5b3bec5aeabbe333bf5e6b2505",
                    "assets": [
                        {
                            "name": "676cd3a21e5cadd9c41fec6b2a5c405ee0c9c275a82c6990ced01bdb",
                            "value": "1"
                        },
                        {
                            "name": "9e407073e5b7753c39888b92c5dc6479bc49b7e9484c36dec3d23d72dac0cf7e",
                            "value": "1"
                        }
                    ],
                    "redeemerType": "FIXED"
                }
            ]
        },
        "referenceInputs": [
            {
                "outRef": "cb65a0baf837a3c079f3b38133dc6e8ce1e42db2159b03209ed8668d2ae2c198#0",
                "type": "FLOAT_POOL_SCRIPT"
            },
            {
                "outRef": "c2e5a4d2c2b1d5d26a80f2675d53e4a64058f4e9745868c133090aab9952936a#0",
                "type": "FIXED_PROTOCOL_SCRIPT"
            },
            {
                "outRef": "c0ff515afd3dc5b5e1ae0242ce6aa1e1ac58bcd93e3672d38be7dc31d256bf26#0",
                "type": "ORACLE_SOURCE_PATH"
            },
            {
                "outRef": "8a7b8a548cb04398eaa78e4160046f749e5ba865168489e751a173c3a99266ea#0",
                "type": "FIXED_POOL_SCRIPT"
            },
            {
                "outRef": "a64d419e6d45e05d7c29fe158bb4528dd145172d52d3ea21bc90362eb42f6d23#0",
                "type": "FIXED_PROTOCOL_CONFIG"
            },
            {
                "outRef": "4f6f0e15b8bf5020f4c5a8e7a35d5126cc2e352aada88313ce63647976671f09#0",
                "type": "DANOGO_STAKING_SCRIPT"
            },
            {
                "outRef": "ae98a2ad6804b0638cb0589d5390e3fedc515d79d555ac497ee0ec3fdb554824#0",
                "type": "FLOAT_PROTOCOL_CONFIG"
            },
            {
                "outRef": "cb0cbaf47214ecc9284e204bb593842c48e5c820cf8eb8364fdfec288ffdc012#0",
                "type": "ORACLE_CONFIG"
            },
            {
                "outRef": "15c60cb9a9b8783d6310844dbfef11239b33a10e4c30d80f387b5653de80b385#0",
                "type": "FIXED_LOAN_SCRIPT"
            },
            {
                "outRef": "4bd11ee91e4b1e8322f094a3dc9b92eb9a28036580ef35012b4261234df8f321#0",
                "type": "ORACLE_PRICE_SCRIPT"
            },
            {
                "outRef": "c4af5ec19e3c78295ceee0d65be77132c991bd93350642fbadae3342cd708742#0",
                "type": "FLOAT_POOL_CONFIG"
            },
            {
                "outRef": "b66d6976c5d6f535313a8e584bf0d3925cbfa45462410adc0c054e1235b1a2cc#0",
                "type": "DANOGO_FLOAT_POOL"
            },
            {
                "outRef": "fd3406c4a6e51e21178542e0370d37acd996aab26d744d7afef09c73ca123f68#0",
                "type": "DJED_ORACLE"
            },
            {
                "outRef": "05a73d47f0b4c15696a5e78605b1eaee5b23893d55de59e65ca785d2e73875d5#0",
                "type": "DANOGO_STAKING_ORACLE"
            }
        ],
        "auxiliaryData": {
            "loanOwnerNftMetadata": {
                "name": "Borrower NFT (Fixed Rate Lending)",
                "image": "ipfs://QmWpzeJwioirfFWFwDvxmETjemo2yVbnk16zz74U6a46Gz",
                "description": "An NFT representing the loan principal and interest by Danogo"
            }
        },
        "smartContractVersion": "V3"
    }
}
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
