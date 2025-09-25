

export const apiResponse: ApiResponse = {
    "code": 0,
    "traceId": "b55029ba0c05622cbb1fea4b737f5d5b",
    "message": "success",
    "data": {
        "inputs": {
            "liqwidInUtxo": null,
            "poolInUtxo": {
                "outRef": "d0985299d30094ba34827dd411598699da960adc5719b986405fd336a1104125#2",
                "address": "addr_test1zralu95guc0lpefd58xt4udn5cquv6m8qfedmd0pjl9rn0g8gkm7g90pw4l5edvw8ny96ykpqyrcy9z5dzqv4es4r2asu0esez",
                "coin": "2228270",
                "multiAssets": [
                    {
                        "policyId": "7b595fd9e70b625caeace2e20ac91f292e4cc7f510a23fb71916b76b",
                        "assets": [
                            {
                                "name": "32c41815d270a4cc8be4bc9d3d171546b44d36cb57aa7b8b05618558",
                                "value": "994120530"
                            }
                        ]
                    },
                    {
                        "policyId": "fbfe1688e61ff0e52da1ccbaf1b3a601c66b670272ddb5e197ca39bd",
                        "assets": [
                            {
                                "name": "7ac65983019a9a463e988cafa1b833fc51b127691e19e812f0a8ba2a",
                                "value": "1"
                            }
                        ]
                    }
                ]
            },
            "floatPoolInUtxo": {
                "outRef": "d0985299d30094ba34827dd411598699da960adc5719b986405fd336a1104125#1",
                "address": "addr_test1wpa4jh7euu9kyh9w4n3wyzkfru5junx875g2y0ahryttw6clekqft",
                "coin": "21455265901",
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
                                "value": "322518612404"
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
                                "value": "894708477"
                            }
                        ]
                    },
                    {
                        "policyId": "fbfe1688e61ff0e52da1ccbaf1b3a601c66b670272ddb5e197ca39bd",
                        "assets": [
                            {
                                "name": "7ac65983019a9a463e988cafa1b833fc51b127691e19e812f0a8ba2a",
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
                    "supplyMaturity": "1758844800000",
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
                                "name": "7ac65983019a9a463e988cafa1b833fc51b127691e19e812f0a8ba2a",
                                "value": "1"
                            }
                        ]
                    }
                ],
                "datum": {
                    "loanAmount": "101696440",
                    "loanMaturity": null,
                    "loanOwnerNft": "e1a6483473a5d6108ed2ed7f452a2d5b3bec5aeabbe333bf5e6b2505.60c037785ac6ac5b60f13389dc7e8af9ef60de53cc38ff2cfd669123f82571fd",
                    "loanProfitFee": "169644"
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
                "coin": "21355265901",
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
                                "value": "322518612404"
                            }
                        ]
                    }
                ],
                "datum": {
                    "totalSupply": "362489357947",
                    "circulatingDToken": "360358111120",
                    "totalBorrow": "1931950702",
                    "borrowRate": 504,
                    "interestIndex": "1006696954087",
                    "interestTime": "1758768290000",
                    "undistributedFee": "412990",
                    "dTokenRateNum": "362589356157",
                    "dTokenRateDen": "360457523173",
                    "alternativeSupplyTokens": [
                        {
                            "token": "7aa4312097def38936c7b69fb380f9e8685dfa17c52c68151781ea03",
                            "latestExchangeRateNum": "268222978039",
                            "latestExchangeRateDen": "255026462635"
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
                                "collateralToken": "919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.74444a4544",
                                "priceNum": "221758",
                                "priceDen": "155667"
                            },
                            {
                                "collateralToken": "7aa4312097def38936c7b69fb380f9e8685dfa17c52c68151781ea03",
                                "priceNum": "268222978039",
                                "priceDen": "255026462635"
                            },
                            {
                                "collateralToken": "7b595fd9e70b625caeace2e20ac91f292e4cc7f510a23fb71916b76b.32c41815d270a4cc8be4bc9d3d171546b44d36cb57aa7b8b05618558",
                                "priceNum": "362489357947",
                                "priceDen": "360358111120"
                            }
                        ]
                    }
                ],
                "borrowRates": [
                    {
                        "yieldToken": "7b595fd9e70b625caeace2e20ac91f292e4cc7f510a23fb71916b76b.32c41815d270a4cc8be4bc9d3d171546b44d36cb57aa7b8b05618558",
                        "borrowRate": "504"
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
                            "value": "-99412053"
                        }
                    ],
                    "redeemerType": "FLOAT"
                },
                {
                    "policyId": "e1a6483473a5d6108ed2ed7f452a2d5b3bec5aeabbe333bf5e6b2505",
                    "assets": [
                        {
                            "name": "60c037785ac6ac5b60f13389dc7e8af9ef60de53cc38ff2cfd669123f82571fd",
                            "value": "1"
                        },
                        {
                            "name": "7ac65983019a9a463e988cafa1b833fc51b127691e19e812f0a8ba2a",
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
                "outRef": "c4af5ec19e3c78295ceee0d65be77132c991bd93350642fbadae3342cd708742#0",
                "type": "FLOAT_POOL_CONFIG"
            },
            {
                "outRef": "cb0cbaf47214ecc9284e204bb593842c48e5c820cf8eb8364fdfec288ffdc012#0",
                "type": "ORACLE_CONFIG"
            },
            {
                "outRef": "8a7b8a548cb04398eaa78e4160046f749e5ba865168489e751a173c3a99266ea#0",
                "type": "FIXED_POOL_SCRIPT"
            },
            {
                "outRef": "4f6f0e15b8bf5020f4c5a8e7a35d5126cc2e352aada88313ce63647976671f09#0",
                "type": "DANOGO_STAKING_SCRIPT"
            },
            {
                "outRef": "c0ff515afd3dc5b5e1ae0242ce6aa1e1ac58bcd93e3672d38be7dc31d256bf26#0",
                "type": "ORACLE_SOURCE_PATH"
            },
            {
                "outRef": "4bd11ee91e4b1e8322f094a3dc9b92eb9a28036580ef35012b4261234df8f321#0",
                "type": "ORACLE_PRICE_SCRIPT"
            },
            {
                "outRef": "ae98a2ad6804b0638cb0589d5390e3fedc515d79d555ac497ee0ec3fdb554824#0",
                "type": "FLOAT_PROTOCOL_CONFIG"
            },
            {
                "outRef": "15c60cb9a9b8783d6310844dbfef11239b33a10e4c30d80f387b5653de80b385#0",
                "type": "FIXED_LOAN_SCRIPT"
            },
            {
                "outRef": "a64d419e6d45e05d7c29fe158bb4528dd145172d52d3ea21bc90362eb42f6d23#0",
                "type": "FIXED_PROTOCOL_CONFIG"
            },
            {
                "outRef": "c2e5a4d2c2b1d5d26a80f2675d53e4a64058f4e9745868c133090aab9952936a#0",
                "type": "FIXED_PROTOCOL_SCRIPT"
            },
            {
                "outRef": "d0985299d30094ba34827dd411598699da960adc5719b986405fd336a1104125#1",
                "type": "DANOGO_FLOAT_POOL"
            },
            {
                "outRef": "fd3406c4a6e51e21178542e0370d37acd996aab26d744d7afef09c73ca123f68#0",
                "type": "DJED_ORACLE"
            },
            {
                "outRef": "d0985299d30094ba34827dd411598699da960adc5719b986405fd336a1104125#0",
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
