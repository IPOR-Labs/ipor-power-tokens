/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { ItfWarren, ItfWarrenInterface } from "../ItfWarren";

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
        indexed: false,
        internalType: "address",
        name: "newAsset",
        type: "address",
      },
    ],
    name: "IporIndexAddAsset",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "updater",
        type: "address",
      },
    ],
    name: "IporIndexAddUpdater",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "newAsset",
        type: "address",
      },
    ],
    name: "IporIndexRemoveAsset",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "updater",
        type: "address",
      },
    ],
    name: "IporIndexRemoveUpdater",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "indexValue",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "quasiIbtPrice",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "exponentialMovingAverage",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newExponentialWeightedMovingVariance",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "date",
        type: "uint256",
      },
    ],
    name: "IporIndexUpdate",
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
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
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
        internalType: "address",
        name: "asset",
        type: "address",
      },
    ],
    name: "addAsset",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "updater",
        type: "address",
      },
    ],
    name: "addUpdater",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "calculateTimestamp",
        type: "uint256",
      },
    ],
    name: "calculateAccruedIbtPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
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
    inputs: [
      {
        internalType: "uint256",
        name: "calculateTimestamp",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
    ],
    name: "getAccruedIndex",
    outputs: [
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
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
    ],
    name: "getIndex",
    outputs: [
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
      {
        internalType: "uint256",
        name: "blockTimestamp",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getVersion",
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
    inputs: [
      {
        internalType: "address",
        name: "updater",
        type: "address",
      },
    ],
    name: "isUpdater",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "itfGetDecayFactorValue",
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
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "indexValue",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "updateTimestamp",
        type: "uint256",
      },
    ],
    name: "itfUpdateIndex",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "assets",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "indexValues",
        type: "uint256[]",
      },
      {
        internalType: "uint256",
        name: "updateTimestamp",
        type: "uint256",
      },
    ],
    name: "itfUpdateIndexes",
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
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
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
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
    ],
    name: "removeAsset",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "updater",
        type: "address",
      },
    ],
    name: "removeUpdater",
    outputs: [],
    stateMutability: "nonpayable",
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
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "indexValue",
        type: "uint256",
      },
    ],
    name: "updateIndex",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "assets",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "indexValues",
        type: "uint256[]",
      },
    ],
    name: "updateIndexes",
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
  "0x60a06040523060805234801561001457600080fd5b506080516127a561004c600039600081816107a7015281816107e701528181610ae801528181610b280152610bbb01526127a56000f3fe6080604052600436106101665760003560e01c80635491ab6f116100d15780638456cb591161008a578063b31610db11610064578063b31610db14610422578063cc29516a1461046a578063f2fde38b1461047f578063f8d1cacd1461049f57600080fd5b80638456cb59146103c55780638da5cb5b146103da5780639c88d36b1461040257600080fd5b80635491ab6f146102de5780635c975abb1461033157806360946b421461035b57806365833d5b1461037b578063715018a61461039b5780638129fc1c146103b057600080fd5b80633f4ba83a116101235780633f4ba83a1461022b57806343d24a5e146102405780634a5e42b1146102605780634f1ef286146102805780634fdfb0861461029357806352d1902d146102c957600080fd5b806304b07a5e1461016b5780630d8e6e2c1461018d5780630e5c7129146101b057806315412360146101d0578063298410e5146101eb5780633659cfe61461020b575b600080fd5b34801561017757600080fd5b5061018b610186366004612148565b6104bf565b005b34801561019957600080fd5b5060015b6040519081526020015b60405180910390f35b3480156101bc57600080fd5b5061019d6101cb366004612163565b61056f565b3480156101dc57600080fd5b506706f05b59d3b2000061019d565b3480156101f757600080fd5b5061018b610206366004612148565b610582565b34801561021757600080fd5b5061018b610226366004612148565b61079c565b34801561023757600080fd5b5061018b61087c565b34801561024c57600080fd5b5061018b61025b366004612148565b6108b0565b34801561026c57600080fd5b5061018b61027b366004612148565b610951565b61018b61028e3660046121d4565b610add565b34801561029f57600080fd5b5061019d6102ae366004612148565b6001600160a01b0316600090815260fb602052604090205490565b3480156102d557600080fd5b5061019d610bae565b3480156102ea57600080fd5b506102fe6102f936600461227a565b610c61565b6040516101a791908151815260208083015190820152604080830151908201526060918201519181019190915260800190565b34801561033d57600080fd5b5060c954600160a01b900460ff1660405190151581526020016101a7565b34801561036757600080fd5b5061018b610376366004612163565b610dbc565b34801561038757600080fd5b5061018b610396366004612397565b610ee2565b3480156103a757600080fd5b5061018b610f44565b3480156103bc57600080fd5b5061018b610f78565b3480156103d157600080fd5b5061018b611038565b3480156103e657600080fd5b506097546040516001600160a01b0390911681526020016101a7565b34801561040e57600080fd5b5061018b61041d366004612404565b61106a565b34801561042e57600080fd5b5061044261043d366004612148565b611167565b604080519586526020860194909452928401919091526060830152608082015260a0016101a7565b34801561047657600080fd5b5061018b6112a2565b34801561048b57600080fd5b5061018b61049a366004612148565b611305565b3480156104ab57600080fd5b5061018b6104ba366004612437565b6113bf565b6097546001600160a01b031633146104f25760405162461bcd60e51b81526004016104e99061249b565b60405180910390fd5b60c954600160a01b900460ff161561051c5760405162461bcd60e51b81526004016104e9906124d0565b6001600160a01b038116600081815260fb602090815260408083209290925590519182527face0c1dfbe0f5fb980b099aa633e6dee1baae9627ac4cedc0d38e7b8eb8592ac91015b60405180910390a150565b600061057b8284611446565b9392505050565b6097546001600160a01b031633146105ac5760405162461bcd60e51b81526004016104e99061249b565b60c954600160a01b900460ff16156105d65760405162461bcd60e51b81526004016104e9906124d0565b60408051808201909152600781526649504f525f333760c81b60208201526001600160a01b03821661061b5760405162461bcd60e51b81526004016104e99190612526565b506106326301e13380670de0b6b3a764000061256f565b6001600160a01b038216600090815260fc60209081526040918290206001015482518084019093526007835266092a09ea4be66760cb1b9183019190915290916001600160801b039091161061069b5760405162461bcd60e51b81526004016104e99190612526565b506040805160a081018252600080825260208201529081016106d16106cc6301e13380670de0b6b3a764000061256f565b6114d6565b6001600160801b0390811682526000602080840182905260409384018290526001600160a01b03861680835260fc82529184902085518154878401518616640100000000026001600160a01b031990911663ffffffff909216919091171781558585015160608701518516600160801b0290851617600182015560809095015160029095018054959093166001600160801b03199095169490941790915590519081527fcb80097dccaf3e538880782de147f3af837b0c53fbccc140fd941c9a4ce751dc9101610564565b306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614156107e55760405162461bcd60e51b81526004016104e99061258e565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031661082e600080516020612729833981519152546001600160a01b031690565b6001600160a01b0316146108545760405162461bcd60e51b81526004016104e9906125da565b61085d81611543565b604080516000808252602082019092526108799183919061156d565b50565b6097546001600160a01b031633146108a65760405162461bcd60e51b81526004016104e99061249b565b6108ae6116e7565b565b6097546001600160a01b031633146108da5760405162461bcd60e51b81526004016104e99061249b565b60c954600160a01b900460ff16156109045760405162461bcd60e51b81526004016104e9906124d0565b6001600160a01b038116600081815260fb60209081526040918290206001905590519182527f50508517ce3dc4098e3968b25c425dccf3d35fe36cfd753815429610c91d7c9e9101610564565b6097546001600160a01b0316331461097b5760405162461bcd60e51b81526004016104e99061249b565b60c954600160a01b900460ff16156109a55760405162461bcd60e51b81526004016104e9906124d0565b60408051808201909152600781526649504f525f333760c81b60208201526001600160a01b0382166109ea5760405162461bcd60e51b81526004016104e99190612526565b50610a016301e13380670de0b6b3a764000061256f565b6001600160a01b038216600090815260fc6020908152604091829020600101548251808401909352600783526649504f525f333960c81b9183019190915290916001600160801b039091161015610a6b5760405162461bcd60e51b81526004016104e99190612526565b506001600160a01b038116600081815260fc6020908152604080832080546001600160a01b03191681556001810193909355600290920180546001600160801b031916905590519182527f11525b9d4febf0b85675ba77e15f3ca60160ead25d1540127fddaa62c5cd23639101610564565b306001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000161415610b265760405162461bcd60e51b81526004016104e99061258e565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316610b6f600080516020612729833981519152546001600160a01b031690565b6001600160a01b031614610b955760405162461bcd60e51b81526004016104e9906125da565b610b9e82611543565b610baa8282600161156d565b5050565b6000306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614610c4e5760405162461bcd60e51b815260206004820152603860248201527f555550535570677261646561626c653a206d757374206e6f742062652063616c60448201527f6c6564207468726f7567682064656c656761746563616c6c000000000000000060648201526084016104e9565b5060008051602061272983398151915290565b610c8c6040518060800160405280600081526020016000815260200160008152602001600081525090565b6001600160a01b038216600090815260fc6020908152604091829020825160a081018452815463ffffffff811682526001600160801b03640100000000909104811693820193909352600182015480841694820194909452600160801b9093048216606084015260020154166080820152610d136301e13380670de0b6b3a764000061256f565b81604001516001600160801b031610156040518060400160405280600781526020016649504f525f333960c81b81525090610d615760405162461bcd60e51b81526004016104e99190612526565b50604051806080016040528082602001516001600160801b03168152602001610d8a8686611446565b815260200182606001516001600160801b0316815260200182608001516001600160801b031681525091505092915050565b33600090815260fb6020908152604091829020548251808401909352600683526524a827a92f9960d11b91830191909152600114610e0d5760405162461bcd60e51b81526004016104e99190612526565b5060c954600160a01b900460ff1615610e385760405162461bcd60e51b81526004016104e9906124d0565b604080516001808252818301909252600091602080830190803683370190505090508181600081518110610e6e57610e6e612626565b60209081029190910101526040805160018082528183019092526000918160200160208202803683370190505090508381600081518110610eb157610eb1612626565b60200260200101906001600160a01b031690816001600160a01b031681525050610edc818342611784565b50505050565b33600090815260fb6020908152604091829020548251808401909352600683526524a827a92f9960d11b91830191909152600114610f335760405162461bcd60e51b81526004016104e99190612526565b50610f3f838383611784565b505050565b6097546001600160a01b03163314610f6e5760405162461bcd60e51b81526004016104e99061249b565b6108ae6000611874565b600054610100900460ff16610f935760005460ff1615610f97565b303b155b610ffa5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b60648201526084016104e9565b600054610100900460ff1615801561101c576000805461ffff19166101011790555b6110246118c6565b8015610879576000805461ff001916905550565b6097546001600160a01b031633146110625760405162461bcd60e51b81526004016104e99061249b565b6108ae6118f5565b33600090815260fb6020908152604091829020548251808401909352600683526524a827a92f9960d11b918301919091526001146110bb5760405162461bcd60e51b81526004016104e99190612526565b506040805160018082528183019092526000916020808301908036833701905050905082816000815181106110f2576110f2612626565b6020908102919091010152604080516001808252818301909252600091816020016020820280368337019050509050848160008151811061113557611135612626565b60200260200101906001600160a01b031690816001600160a01b031681525050611160818385611784565b5050505050565b6001600160a01b038116600090815260fc60209081526040808320815160a081018352815463ffffffff811682526001600160801b03640100000000909104811694820194909452600182015480851693820193909352600160801b9092048316606083015260020154909116608082015281908190819081906111f76301e13380670de0b6b3a764000061256f565b81604001516001600160801b031610156040518060400160405280600781526020016649504f525f333960c81b815250906112455760405162461bcd60e51b81526004016104e99190612526565b5080602001516001600160801b031695508561127282604001516001600160801b03166301e1338061195a565b606083015160808401519351929a9199506001600160801b039081169850909216955063ffffffff169350915050565b60c95460408051808201909152600681526524a827a92f9b60d11b6020820152906001600160a01b031633146112eb5760405162461bcd60e51b81526004016104e99190612526565b5060c980546001600160a01b03191690556108ae33611874565b6097546001600160a01b0316331461132f5760405162461bcd60e51b81526004016104e99061249b565b60408051808201909152600781526649504f525f333760c81b60208201526001600160a01b0382166113745760405162461bcd60e51b81526004016104e99190612526565b5060c980546001600160a01b0319166001600160a01b0383169081179091556040517f3ec7bb1d452f3c36260fa8ef678a597fd97574d8ec42f6dc98ffce3dbc91228f90600090a250565b33600090815260fb6020908152604091829020548251808401909352600683526524a827a92f9960d11b918301919091526001146114105760405162461bcd60e51b81526004016104e99190612526565b5060c954600160a01b900460ff161561143b5760405162461bcd60e51b81526004016104e9906124d0565b610baa828242611784565b6001600160a01b038116600090815260fc60209081526040808320815160a081018352815463ffffffff80821683526001600160801b03640100000000909204821695830195909552600183015480821694830194909452600160801b90930483166060820152600290910154909116608082015261057b916114cc9190869061197c16565b6301e1338061195a565b60006001600160801b0382111561153f5760405162461bcd60e51b815260206004820152602760248201527f53616665436173743a2076616c756520646f65736e27742066697420696e20316044820152663238206269747360c81b60648201526084016104e9565b5090565b6097546001600160a01b031633146108795760405162461bcd60e51b81526004016104e99061249b565b7f4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd91435460ff16156115a057610f3f836119ae565b826001600160a01b03166352d1902d6040518163ffffffff1660e01b815260040160206040518083038186803b1580156115d957600080fd5b505afa925050508015611609575060408051601f3d908101601f191682019092526116069181019061263c565b60015b61166c5760405162461bcd60e51b815260206004820152602e60248201527f45524331393637557067726164653a206e657720696d706c656d656e7461746960448201526d6f6e206973206e6f74205555505360901b60648201526084016104e9565b60008051602061272983398151915281146116db5760405162461bcd60e51b815260206004820152602960248201527f45524331393637557067726164653a20756e737570706f727465642070726f786044820152681a58589b195555525160ba1b60648201526084016104e9565b50610f3f838383611a4a565b60c954600160a01b900460ff166117375760405162461bcd60e51b815260206004820152601460248201527314185d5cd8589b194e881b9bdd081c185d5cd95960621b60448201526064016104e9565b60c9805460ff60a01b191690557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa335b6040516001600160a01b03909116815260200160405180910390a1565b33600090815260fb6020908152604091829020548251808401909352600683526524a827a92f9960d11b918301919091526001146117d55760405162461bcd60e51b81526004016104e99190612526565b50815183511460405180604001604052806007815260200166092a09ea4be62760cb1b815250906118195760405162461bcd60e51b81526004016104e99190612526565b5060005b83518114610edc5761186284828151811061183a5761183a612626565b602002602001015184838151811061185457611854612626565b602002602001015184611a6f565b8061186c81612655565b91505061181d565b609780546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b600054610100900460ff166118ed5760405162461bcd60e51b81526004016104e990612670565b6108ae611d2f565b60c954600160a01b900460ff161561191f5760405162461bcd60e51b81526004016104e9906124d0565b60c9805460ff60a01b1916600160a01b1790557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a2586117673390565b6000816119686002826126bb565b61197290856126dd565b61057b91906126bb565b600061057b83602001516001600160801b031684604001516001600160801b0316856000015163ffffffff1685611d5f565b6001600160a01b0381163b611a1b5760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201526c1bdd08184818dbdb9d1c9858dd609a1b60648201526084016104e9565b60008051602061272983398151915280546001600160a01b0319166001600160a01b0392909216919091179055565b611a5383611dcb565b600082511180611a605750805b15610f3f57610edc8383611e0b565b6001600160a01b038316600090815260fc6020908152604091829020825160a081018452815463ffffffff811682526001600160801b03640100000000909104811693820193909352600182015480841694820194909452600160801b9093048216606084015260020154166080820152611af66301e13380670de0b6b3a764000061256f565b81604001516001600160801b031610156040518060400160405280600781526020016649504f525f333960c81b81525090611b445760405162461bcd60e51b81526004016104e99190612526565b50600080600083602001516001600160801b031660001415611b8057611b766301e13380670de0b6b3a764000061256f565b9250859150611bd2565b611b8a848661197c565b9250611bac84606001516001600160801b0316876706f05b59d3b20000611ef6565b9150611bcf84608001516001600160801b031683886706f05b59d3b20000611f41565b90505b6040518060a00160405280611be68761208e565b63ffffffff168152602001611bfa886114d6565b6001600160801b03168152602001611c11856114d6565b6001600160801b03168152602001611c28846114d6565b6001600160801b03168152602001611c3f836114d6565b6001600160801b039081169091526001600160a01b038916600081815260fc602090815260409182902085518154878401518716640100000000026001600160a01b031990911663ffffffff90921691909117178155858301516060808801518716600160801b0291871691909117600183015560809687015160029092018054929096166001600160801b031990921691909117909455815192835282018a9052810186905290810184905290810182905260a081018690527f91357060dd7ce921ac472b510c89c6a913d3f5ee44d74d7e3d5bdee132a6e81d9060c00160405180910390a150505050505050565b600054610100900460ff16611d565760405162461bcd60e51b81526004016104e990612670565b6108ae33611874565b6000828210156040518060400160405280600781526020016649504f525f323760c81b81525090611da35760405162461bcd60e51b81526004016104e99190612526565b50611dae83836126f5565b611db8908661256f565b611dc290856126dd565b95945050505050565b611dd4816119ae565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606001600160a01b0383163b611e735760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f6044820152651b9d1c9858dd60d21b60648201526084016104e9565b600080846001600160a01b031684604051611e8e919061270c565b600060405180830381855af49150503d8060008114611ec9576040519150601f19603f3d011682016040523d82523d6000602084013e611ece565b606091505b5091509150611dc28282604051806060016040528060278152602001612749602791396120f3565b6000611f39611f05838561256f565b611f1784670de0b6b3a76400006126f5565b611f21908761256f565b611f2b91906126dd565b670de0b6b3a764000061195a565b949350505050565b6000670de0b6b3a76400008211156040518060400160405280600781526020016649504f525f353560c81b81525090611f8d5760405162461bcd60e51b81526004016104e99190612526565b50838311156120245761201d611fa385856126f5565b611fad86866126f5565b611fbf85670de0b6b3a76400006126f5565b611fc9919061256f565b611fd3919061256f565b611fec6ec097ce7bc90715b34b9f10000000008861256f565b611ff691906126dd565b612000908461256f565b760a70c3c40a64e6c51999090b65f67d924000000000000061195a565b905061203e565b61203b61203184866126f5565b611fad85876126f5565b90505b604080518082019091526007815266125413d497cd4d60ca1b6020820152670de0b6b3a76400008211156120855760405162461bcd60e51b81526004016104e99190612526565b50949350505050565b600063ffffffff82111561153f5760405162461bcd60e51b815260206004820152602660248201527f53616665436173743a2076616c756520646f65736e27742066697420696e203360448201526532206269747360d01b60648201526084016104e9565b6060831561210257508161057b565b8251156121125782518084602001fd5b8160405162461bcd60e51b81526004016104e99190612526565b80356001600160a01b038116811461214357600080fd5b919050565b60006020828403121561215a57600080fd5b61057b8261212c565b6000806040838503121561217657600080fd5b61217f8361212c565b946020939093013593505050565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f1916810167ffffffffffffffff811182821017156121cc576121cc61218d565b604052919050565b600080604083850312156121e757600080fd5b6121f08361212c565b915060208084013567ffffffffffffffff8082111561220e57600080fd5b818601915086601f83011261222257600080fd5b8135818111156122345761223461218d565b612246601f8201601f191685016121a3565b9150808252878482850101111561225c57600080fd5b80848401858401376000848284010152508093505050509250929050565b6000806040838503121561228d57600080fd5b8235915061229d6020840161212c565b90509250929050565b600067ffffffffffffffff8211156122c0576122c061218d565b5060051b60200190565b600082601f8301126122db57600080fd5b813560206122f06122eb836122a6565b6121a3565b82815260059290921b8401810191818101908684111561230f57600080fd5b8286015b84811015612331576123248161212c565b8352918301918301612313565b509695505050505050565b600082601f83011261234d57600080fd5b8135602061235d6122eb836122a6565b82815260059290921b8401810191818101908684111561237c57600080fd5b8286015b848110156123315780358352918301918301612380565b6000806000606084860312156123ac57600080fd5b833567ffffffffffffffff808211156123c457600080fd5b6123d0878388016122ca565b945060208601359150808211156123e657600080fd5b506123f38682870161233c565b925050604084013590509250925092565b60008060006060848603121561241957600080fd5b6124228461212c565b95602085013595506040909401359392505050565b6000806040838503121561244a57600080fd5b823567ffffffffffffffff8082111561246257600080fd5b61246e868387016122ca565b9350602085013591508082111561248457600080fd5b506124918582860161233c565b9150509250929050565b6020808252818101527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604082015260600190565b60208082526010908201526f14185d5cd8589b194e881c185d5cd95960821b604082015260600190565b60005b838110156125155781810151838201526020016124fd565b83811115610edc5750506000910152565b60208152600082518060208401526125458160408501602087016124fa565b601f01601f19169190910160400192915050565b634e487b7160e01b600052601160045260246000fd5b600081600019048311821515161561258957612589612559565b500290565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b19195b1959d85d1958d85b1b60a21b606082015260800190565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b6163746976652070726f787960a01b606082015260800190565b634e487b7160e01b600052603260045260246000fd5b60006020828403121561264e57600080fd5b5051919050565b600060001982141561266957612669612559565b5060010190565b6020808252602b908201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960408201526a6e697469616c697a696e6760a81b606082015260800190565b6000826126d857634e487b7160e01b600052601260045260246000fd5b500490565b600082198211156126f0576126f0612559565b500190565b60008282101561270757612707612559565b500390565b6000825161271e8184602087016124fa565b919091019291505056fe360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a2646970667358221220308899e151e7916bf0785c173586f57bc794cb740f193339b431ae835680925564736f6c63430008090033";

type ItfWarrenConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ItfWarrenConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ItfWarren__factory extends ContractFactory {
  constructor(...args: ItfWarrenConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "ItfWarren";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ItfWarren> {
    return super.deploy(overrides || {}) as Promise<ItfWarren>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): ItfWarren {
    return super.attach(address) as ItfWarren;
  }
  connect(signer: Signer): ItfWarren__factory {
    return super.connect(signer) as ItfWarren__factory;
  }
  static readonly contractName: "ItfWarren";
  public readonly contractName: "ItfWarren";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ItfWarrenInterface {
    return new utils.Interface(_abi) as ItfWarrenInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ItfWarren {
    return new Contract(address, _abi, signerOrProvider) as ItfWarren;
  }
}
