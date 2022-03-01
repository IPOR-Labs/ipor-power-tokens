/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  MockCase8MiltonSpreadModel,
  MockCase8MiltonSpreadModelInterface,
} from "../MockCase8MiltonSpreadModel";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "appointedOwner",
        type: "address",
      },
    ],
    name: "AppointedToTransferOwnership",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "beacon",
        type: "address",
      },
    ],
    name: "BeaconUpgraded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "liquidityPoolBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "payFixedSwapsBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "receiveFixedSwapsBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lambda",
        type: "uint256",
      },
    ],
    name: "calculateAdjustedUtilizationRatePayFixed",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "liquidityPoolBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "payFixedSwapsBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "receiveFixedSwapsBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lambda",
        type: "uint256",
      },
    ],
    name: "calculateAdjustedUtilizationRateRecFixed",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "iporIndexValue",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "exponentialMovingAverage",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "exponentialWeightedMovingVariance",
        type: "uint256",
      },
    ],
    name: "calculateAtParComponentPayFixed",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "iporIndexValue",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "exponentialMovingAverage",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "exponentialWeightedMovingVariance",
        type: "uint256",
      },
    ],
    name: "calculateAtParComponentRecFixed",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "liquidityPoolBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "payFixedSwapsBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "receiveFixedSwapsBalance",
        type: "uint256",
      },
      {
        internalType: "int256",
        name: "soapPayFixed",
        type: "int256",
      },
    ],
    name: "calculateDemandComponentPayFixed",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "liquidityPoolBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "payFixedSwapsBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "receiveFixedSwapsBalance",
        type: "uint256",
      },
      {
        internalType: "int256",
        name: "soapRecFixed",
        type: "int256",
      },
    ],
    name: "calculateDemandComponentRecFixed",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "kHist",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "iporIndexValue",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "exponentialMovingAverage",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxSpreadValue",
        type: "uint256",
      },
    ],
    name: "calculateHistoricalDeviationPayFixed",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "kHist",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "iporIndexValue",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "exponentialMovingAverage",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxSpreadValue",
        type: "uint256",
      },
    ],
    name: "calculateHistoricalDeviationRecFixed",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "soap",
        type: "int256",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "indexValue",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "ibtPrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "exponentialMovingAverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "exponentialWeightedMovingVariance",
            type: "uint256",
          },
        ],
        internalType: "struct DataTypes.AccruedIpor",
        name: "accruedIpor",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "payFixedSwaps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "receiveFixedSwaps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "liquidityPool",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "vault",
            type: "uint256",
          },
        ],
        internalType: "struct DataTypes.MiltonBalanceMemory",
        name: "accruedBalance",
        type: "tuple",
      },
    ],
    name: "calculateQuotePayFixed",
    outputs: [
      {
        internalType: "uint256",
        name: "quoteValue",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "soap",
        type: "int256",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "indexValue",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "ibtPrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "exponentialMovingAverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "exponentialWeightedMovingVariance",
            type: "uint256",
          },
        ],
        internalType: "struct DataTypes.AccruedIpor",
        name: "accruedIpor",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "payFixedSwaps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "receiveFixedSwaps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "liquidityPool",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "vault",
            type: "uint256",
          },
        ],
        internalType: "struct DataTypes.MiltonBalanceMemory",
        name: "accruedBalance",
        type: "tuple",
      },
    ],
    name: "calculateQuoteReceiveFixed",
    outputs: [
      {
        internalType: "uint256",
        name: "quoteValue",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "soap",
        type: "int256",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "indexValue",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "ibtPrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "exponentialMovingAverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "exponentialWeightedMovingVariance",
            type: "uint256",
          },
        ],
        internalType: "struct DataTypes.AccruedIpor",
        name: "accruedIpor",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "payFixedSwaps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "receiveFixedSwaps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "liquidityPool",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "vault",
            type: "uint256",
          },
        ],
        internalType: "struct DataTypes.MiltonBalanceMemory",
        name: "accruedBalance",
        type: "tuple",
      },
    ],
    name: "calculateSpreadPayFixed",
    outputs: [
      {
        internalType: "uint256",
        name: "spreadValue",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "soap",
        type: "int256",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "indexValue",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "ibtPrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "exponentialMovingAverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "exponentialWeightedMovingVariance",
            type: "uint256",
          },
        ],
        internalType: "struct DataTypes.AccruedIpor",
        name: "accruedIpor",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "payFixedSwaps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "receiveFixedSwaps",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "liquidityPool",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "vault",
            type: "uint256",
          },
        ],
        internalType: "struct DataTypes.MiltonBalanceMemory",
        name: "accruedBalance",
        type: "tuple",
      },
    ],
    name: "calculateSpreadRecFixed",
    outputs: [
      {
        internalType: "uint256",
        name: "spreadValue",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "confirmTransferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAtParComponentKHistValue",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "getAtParComponentKVolValue",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "getDCKOmegaValue",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "getDCKfValue",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "getDCLambdaValue",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "getDCMaxLiquidityRedemptionValue",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "getSpreadPremiumsMaxValue",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proxiableUUID",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "utilizationRateLegWithSwap",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "utilizationRateLegWithoutSwap",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lambda",
        type: "uint256",
      },
    ],
    name: "testCalculateAdjustedUtilizationRate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "soap",
        type: "int256",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "indexValue",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "ibtPrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "exponentialMovingAverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "exponentialWeightedMovingVariance",
            type: "uint256",
          },
        ],
        internalType: "struct DataTypes.AccruedIpor",
        name: "accruedIpor",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "liquidityPoolBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "payFixedSwapsBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "receiveFixedSwapsBalance",
        type: "uint256",
      },
    ],
    name: "testCalculateSpreadPremiumsPayFixed",
    outputs: [
      {
        internalType: "uint256",
        name: "spreadValue",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "soap",
        type: "int256",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "indexValue",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "ibtPrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "exponentialMovingAverage",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "exponentialWeightedMovingVariance",
            type: "uint256",
          },
        ],
        internalType: "struct DataTypes.AccruedIpor",
        name: "accruedIpor",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "liquidityPoolBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "payFixedSwapsBalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "receiveFixedSwapsBalance",
        type: "uint256",
      },
    ],
    name: "testCalculateSpreadPremiumsRecFixed",
    outputs: [
      {
        internalType: "uint256",
        name: "spreadValue",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "appointedOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
    ],
    name: "upgradeTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

const _bytecode =
  "0x60a06040523060805234801561001457600080fd5b50608051611bce61004c600039600081816105cd01528181610616015281816106b6015281816106f601526107890152611bce6000f3fe6080604052600436106101cd5760003560e01c8063869ede4e116100f7578063c9da4bad11610095578063e133247b11610064578063e133247b146104d3578063e966dc29146104e7578063f2fde38b14610507578063fcd0ac381461052757600080fd5b8063c9da4bad14610469578063cc29516a14610489578063d718f6401461049e578063db1492e2146104b857600080fd5b80638eed2a0b116100d15780638eed2a0b146103f05780639454e20f14610410578063a0841a7214610429578063b581920e1461044957600080fd5b8063869ede4e146103885780638a9458ba146103a85780638da5cb5b146103c857600080fd5b80634f1ef2861161016f578063623a55a81161013e578063623a55a814610325578063715018a6146103455780638129fc1c1461035a57806385bb0c411461036f57600080fd5b80634f1ef286146102bd57806352d1902d146102d05780635c96693e146102e55780635cdd7ddf1461030557600080fd5b806320563b37116101ab57806320563b371461023b5780632465bb6f1461025b57806333cad3141461027b5780633659cfe61461029b57600080fd5b8063118e90dc146101d257806319234f75146101fb5780631d5fe8061461021b575b600080fd5b3480156101de57600080fd5b50660110d9316ec0005b6040519081526020015b60405180910390f35b34801561020757600080fd5b506101e8610216366004611654565b610541565b34801561022757600080fd5b506101e8610236366004611654565b61055a565b34801561024757600080fd5b506101e8610256366004611686565b610568565b34801561026757600080fd5b506101e8610276366004611654565b61057f565b34801561028757600080fd5b506101e861029636600461175f565b61058d565b3480156102a757600080fd5b506102bb6102b63660046117ba565b6105c2565b005b6102bb6102cb3660046117d5565b6106ab565b3480156102dc57600080fd5b506101e861077c565b3480156102f157600080fd5b506101e8610300366004611686565b61082f565b34801561031157600080fd5b506101e861032036600461175f565b61083c565b34801561033157600080fd5b506101e8610340366004611686565b61085b565b34801561035157600080fd5b506102bb610868565b34801561036657600080fd5b506102bb61089e565b34801561037b57600080fd5b50652d79883d20006101e8565b34801561039457600080fd5b506101e86103a3366004611654565b61095e565b3480156103b457600080fd5b506101e86103c336600461187b565b61096c565b3480156103d457600080fd5b506097546040516001600160a01b0390911681526020016101f2565b3480156103fc57600080fd5b506101e861040b366004611654565b6109a9565b34801561041c57600080fd5b506509184e72a0006101e8565b34801561043557600080fd5b506101e8610444366004611654565b6109b7565b34801561045557600080fd5b506101e861046436600461187b565b6109c5565b34801561047557600080fd5b506101e861048436600461175f565b6109f7565b34801561049557600080fd5b506102bb610a1a565b3480156104aa57600080fd5b50660aa87bee5380006101e8565b3480156104c457600080fd5b50670de0b6b3a76400006101e8565b3480156104df57600080fd5b5060006101e8565b3480156104f357600080fd5b506101e861050236600461175f565b610a7d565b34801561051357600080fd5b506102bb6105223660046117ba565b610aac565b34801561053357600080fd5b50662386f26fc100006101e8565b600061054f85858585610b66565b90505b949350505050565b600061054f85858585610bec565b6000610575848484610cf8565b90505b9392505050565b600061054f85858585610d82565b600080600061059d868686610dbd565b865191935091506105ae82846118d9565b6105b891906118f1565b9695505050505050565b306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614156106145760405162461bcd60e51b815260040161060b90611908565b60405180910390fd5b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031661065d600080516020611b52833981519152546001600160a01b031690565b6001600160a01b0316146106835760405162461bcd60e51b815260040161060b90611954565b61068c81610de9565b604080516000808252602082019092526106a891839190610e13565b50565b306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614156106f45760405162461bcd60e51b815260040161060b90611908565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031661073d600080516020611b52833981519152546001600160a01b031690565b6001600160a01b0316146107635760405162461bcd60e51b815260040161060b90611954565b61076c82610de9565b61077882826001610e13565b5050565b6000306001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000161461081c5760405162461bcd60e51b815260206004820152603860248201527f555550535570677261646561626c653a206d757374206e6f742062652063616c60448201527f6c6564207468726f7567682064656c656761746563616c6c0000000000000000606482015260840161060b565b50600080516020611b5283398151915290565b6000610575848484610f92565b600080600061084c868686610dbd565b90925090506105b882826118d9565b6000610575848484610fef565b6097546001600160a01b031633146108925760405162461bcd60e51b815260040161060b906119a0565b61089c6000611026565b565b600054610100900460ff166108b95760005460ff16156108bd565b303b155b6109205760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b606482015260840161060b565b600054610100900460ff16158015610942576000805461ffff19166101011790555b61094a611078565b80156106a8576000805461ff001916905550565b600061054f858585856110a7565b60008060405180608001604052808581526020018481526020018681526020016000815250905061099e8787836110dd565b979650505050505050565b600061054f85858585611183565b600061054f858585856111c9565b60008060405180608001604052808581526020018481526020018681526020016000815250905061099e8787836111e4565b6000806000610a0786868661125f565b8651919350915081906105ae90846118d9565b60c95460408051808201909152600681526524a827a92f9b60d11b6020820152906001600160a01b03163314610a635760405162461bcd60e51b815260040161060b9190611a01565b5060c980546001600160a01b031916905561089c33611026565b6000806000610a8d86868661125f565b9150915081811115610aa3576105b882826118f1565b50509392505050565b6097546001600160a01b03163314610ad65760405162461bcd60e51b815260040161060b906119a0565b60408051808201909152600781526649504f525f333760c81b60208201526001600160a01b038216610b1b5760405162461bcd60e51b815260040161060b9190611a01565b5060c980546001600160a01b0319166001600160a01b0383169081179091556040517f3ec7bb1d452f3c36260fa8ef678a597fd97574d8ec42f6dc98ffce3dbc91228f90600090a250565b600083831115610b7857506000610552565b6000610b9e610b8686611281565b610b8f86611281565b610b999190611a34565b6112ef565b9050670de0b6b3a76400008110610bb85782915050610552565b610be4610bcd670de0b6b3a764000088611a73565b610bdf83670de0b6b3a76400006118f1565b61130d565b915050610552565b600080610c03868686670429d069189e00006110a7565b610c159067099bef55dff6283a6118f1565b90508015610cea576000831315610cb2576000610c32848761132f565b610c4490670de0b6b3a76400006118f1565b90508015610ca457610c6f610c69670de0b6b3a7640000670429d069189e0000611a73565b8261130d565b610c91610c8b670de0b6b3a764000066038d7ea4c68000611a73565b8461130d565b610c9b91906118d9565b92505050610552565b670429d069189e0000610c9b565b670429d069189e0000610ce0670de0b6b3a764000066038d7ea4c680005b610cda9190611a73565b8361130d565b610be491906118d9565b670429d069189e0000610be4565b6000670429d069189e0000670de0b6b3a76400008310610d19579050610578565b6000610d2e6631bced02db0000878785610d82565b905081811015610d7a5780610d67610d55670de0b6b3a7640000666e2255f4098000611a73565b610bdf87670de0b6b3a76400006118f1565b610d7191906118d9565b92505050610578565b509050610578565b600083831015610d9457506000610552565b6000610da2610b8686611281565b9050670de0b6b3a7640000811415610bb85782915050610552565b600080610dcb8585856110dd565b9150610ddf8460000151856040015161135e565b9050935093915050565b6097546001600160a01b031633146106a85760405162461bcd60e51b815260040161060b906119a0565b7f4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd91435460ff1615610e4b57610e4683611376565b505050565b826001600160a01b03166352d1902d6040518163ffffffff1660e01b815260040160206040518083038186803b158015610e8457600080fd5b505afa925050508015610eb4575060408051601f3d908101601f19168201909252610eb191810190611a92565b60015b610f175760405162461bcd60e51b815260206004820152602e60248201527f45524331393637557067726164653a206e657720696d706c656d656e7461746960448201526d6f6e206973206e6f74205555505360901b606482015260840161060b565b600080516020611b528339815191528114610f865760405162461bcd60e51b815260206004820152602960248201527f45524331393637557067726164653a20756e737570706f727465642070726f786044820152681a58589b195555525160ba1b606482015260840161060b565b50610e46838383611412565b6000828410610fa2575082610578565b6000610fc9610fb186866118f1565b610fbb9085611a73565b670de0b6b3a764000061130d565b905084811115610fdd576000915050610578565b610fe781866118f1565b915050610578565b6000670429d069189e0000670de0b6b3a7640000831415611011579050610578565b6000610d2e6631bced02db0000878785610b66565b609780546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b600054610100900460ff1661109f5760405162461bcd60e51b815260040161060b90611aab565b61089c61143d565b6000806110b4868561146d565b905060006110c2878761146d565b905060006110d1828487610f92565b98975050505050505050565b60008160400151600014156040518060400160405280600781526020016649504f525f343960c81b815250906111265760405162461bcd60e51b815260040161060b9190611a01565b506000611140846000015185604001518660600151610cf8565b61115884604001518560000151866020015189610bec565b61116291906118d9565b9050670429d069189e000080821061117a57806105b8565b50949350505050565b60008061119a868686670429d069189e00006111c9565b6111ac9067099bef55dff6283a6118f1565b90508015610cea576000831315610cb2576000610c32848661132f565b6000806111d6868661146d565b905060006110c2878661146d565b60008160400151600014156040518060400160405280600781526020016649504f525f343960c81b8152509061122d5760405162461bcd60e51b815260040161060b9190611a01565b506000611247846000015185604001518660600151610fef565b61115884604001518560000151866020015189611183565b60008061126d8585856111e4565b9150610ddf84600001518560400151611484565b60006001600160ff1b038211156112eb5760405162461bcd60e51b815260206004820152602860248201527f53616665436173743a2076616c756520646f65736e27742066697420696e2061604482015267371034b73a191a9b60c11b606482015260840161060b565b5090565b60008082126112fe5781611307565b61130782611af6565b92915050565b60008161131b600282611b13565b61132590856118d9565b6105789190611b13565b6000808313156113555761134e670de0b6b3a7640000610cd085611495565b9050611307565b50600092915050565b60008183111561136f575081611307565b5080611307565b6001600160a01b0381163b6113e35760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201526c1bdd08184818dbdb9d1c9858dd609a1b606482015260840161060b565b600080516020611b5283398151915280546001600160a01b0319166001600160a01b0392909216919091179055565b61141b836114e7565b6000825111806114285750805b15610e46576114378383611527565b50505050565b600054610100900460ff166114645760405162461bcd60e51b815260040161060b90611aab565b61089c33611026565b6000610578610c8b670de0b6b3a764000084611a73565b60008183101561136f575081611307565b6000808212156112eb5760405162461bcd60e51b815260206004820181905260248201527f53616665436173743a2076616c7565206d75737420626520706f736974697665604482015260640161060b565b6114f081611376565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606001600160a01b0383163b61158f5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f6044820152651b9d1c9858dd60d21b606482015260840161060b565b600080846001600160a01b0316846040516115aa9190611b35565b600060405180830381855af49150503d80600081146115e5576040519150601f19603f3d011682016040523d82523d6000602084013e6115ea565b606091505b50915091506116128282604051806060016040528060278152602001611b726027913961161b565b95945050505050565b6060831561162a575081610578565b82511561163a5782518084602001fd5b8160405162461bcd60e51b815260040161060b9190611a01565b6000806000806080858703121561166a57600080fd5b5050823594602084013594506040840135936060013592509050565b60008060006060848603121561169b57600080fd5b505081359360208301359350604090920135919050565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f1916810167ffffffffffffffff811182821017156116f1576116f16116b2565b604052919050565b60006080828403121561170b57600080fd5b6040516080810181811067ffffffffffffffff8211171561172e5761172e6116b2565b8060405250809150823581526020830135602082015260408301356040820152606083013560608201525092915050565b6000806000610120848603121561177557600080fd5b8335925061178685602086016116f9565b91506117958560a086016116f9565b90509250925092565b80356001600160a01b03811681146117b557600080fd5b919050565b6000602082840312156117cc57600080fd5b6105788261179e565b600080604083850312156117e857600080fd5b6117f18361179e565b915060208084013567ffffffffffffffff8082111561180f57600080fd5b818601915086601f83011261182357600080fd5b813581811115611835576118356116b2565b611847601f8201601f191685016116c8565b9150808252878482850101111561185d57600080fd5b80848401858401376000848284010152508093505050509250929050565b6000806000806000610100868803121561189457600080fd5b853594506118a587602088016116f9565b949794965050505060a08301359260c08101359260e0909101359150565b634e487b7160e01b600052601160045260246000fd5b600082198211156118ec576118ec6118c3565b500190565b600082821015611903576119036118c3565b500390565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b19195b1959d85d1958d85b1b60a21b606082015260800190565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b6163746976652070726f787960a01b606082015260800190565b6020808252818101527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604082015260600190565b60005b838110156119f05781810151838201526020016119d8565b838111156114375750506000910152565b6020815260008251806020840152611a208160408501602087016119d5565b601f01601f19169190910160400192915050565b60008083128015600160ff1b850184121615611a5257611a526118c3565b6001600160ff1b0384018313811615611a6d57611a6d6118c3565b50500390565b6000816000190483118215151615611a8d57611a8d6118c3565b500290565b600060208284031215611aa457600080fd5b5051919050565b6020808252602b908201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960408201526a6e697469616c697a696e6760a81b606082015260800190565b6000600160ff1b821415611b0c57611b0c6118c3565b5060000390565b600082611b3057634e487b7160e01b600052601260045260246000fd5b500490565b60008251611b478184602087016119d5565b919091019291505056fe360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a26469706673582212201da3070d44ca88385cb2d61c13e96a550cabadd01a3534b4f05c66ddc3b11ba764736f6c63430008090033";

type MockCase8MiltonSpreadModelConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MockCase8MiltonSpreadModelConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MockCase8MiltonSpreadModel__factory extends ContractFactory {
  constructor(...args: MockCase8MiltonSpreadModelConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "MockCase8MiltonSpreadModel";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<MockCase8MiltonSpreadModel> {
    return super.deploy(overrides || {}) as Promise<MockCase8MiltonSpreadModel>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): MockCase8MiltonSpreadModel {
    return super.attach(address) as MockCase8MiltonSpreadModel;
  }
  connect(signer: Signer): MockCase8MiltonSpreadModel__factory {
    return super.connect(signer) as MockCase8MiltonSpreadModel__factory;
  }
  static readonly contractName: "MockCase8MiltonSpreadModel";
  public readonly contractName: "MockCase8MiltonSpreadModel";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MockCase8MiltonSpreadModelInterface {
    return new utils.Interface(_abi) as MockCase8MiltonSpreadModelInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MockCase8MiltonSpreadModel {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as MockCase8MiltonSpreadModel;
  }
}
