/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { JosephDai, JosephDaiInterface } from "../JosephDai";

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
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "exchangeRate",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "assetValue",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "ipTokenValue",
        type: "uint256",
      },
    ],
    name: "ProvideLiquidity",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "exchangeRate",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "assetValue",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "ipTokenValue",
        type: "uint256",
      },
    ],
    name: "Redeem",
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
    inputs: [],
    name: "asset",
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
    name: "checkVaultReservesRatio",
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
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "assetValue",
        type: "uint256",
      },
    ],
    name: "depositToVault",
    outputs: [],
    stateMutability: "nonpayable",
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
    inputs: [
      {
        internalType: "address",
        name: "assetAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "ipToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "milton",
        type: "address",
      },
      {
        internalType: "address",
        name: "miltonStorage",
        type: "address",
      },
      {
        internalType: "address",
        name: "iporVault",
        type: "address",
      },
    ],
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
    inputs: [
      {
        internalType: "uint256",
        name: "liquidityAmount",
        type: "uint256",
      },
    ],
    name: "provideLiquidity",
    outputs: [],
    stateMutability: "nonpayable",
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
    name: "rebalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ipTokenValue",
        type: "uint256",
      },
    ],
    name: "redeem",
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
  {
    inputs: [
      {
        internalType: "uint256",
        name: "assetValue",
        type: "uint256",
      },
    ],
    name: "withdrawFromVault",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60a06040523060805234801561001457600080fd5b5060805161245d61004c600039600081816106d901528181610719015281816107ed0152818161082d01526108c0015261245d6000f3fe60806040526004361061011f5760003560e01c8063715018a6116100a0578063b046229611610064578063b0462296146102db578063cc29516a146102fb578063db006a7514610310578063eb521a4c14610330578063f2fde38b1461035057600080fd5b8063715018a61461026957806371a6650e1461027e5780637d7c2a1c146102935780638456cb59146102a85780638da5cb5b146102bd57600080fd5b806338d52e0f116100e757806338d52e0f146101cb5780633f4ba83a146102025780634f1ef2861461021757806352d1902d1461022a5780635c975abb1461023f57600080fd5b8063076d0815146101245780630d8e6e2c146101465780631459457a14610169578063313ce567146101895780633659cfe6146101ab575b600080fd5b34801561013057600080fd5b5061014461013f366004611e47565b610370565b005b34801561015257600080fd5b5060015b6040519081526020015b60405180910390f35b34801561017557600080fd5b50610144610184366004611e7c565b610405565b34801561019557600080fd5b5060fb5460405160ff9091168152602001610160565b3480156101b757600080fd5b506101446101c6366004611ee1565b6106ce565b3480156101d757600080fd5b5060fb5461010090046001600160a01b03165b6040516001600160a01b039091168152602001610160565b34801561020e57600080fd5b506101446107ae565b610144610225366004611f43565b6107e2565b34801561023657600080fd5b506101566108b3565b34801561024b57600080fd5b5060c954600160a01b900460ff166040519015158152602001610160565b34801561027557600080fd5b50610144610966565b34801561028a57600080fd5b5061015661099a565b34801561029f57600080fd5b506101446109a9565b3480156102b457600080fd5b50610144610c0e565b3480156102c957600080fd5b506097546001600160a01b03166101ea565b3480156102e757600080fd5b506101446102f6366004611e47565b610c40565b34801561030757600080fd5b50610144610c9b565b34801561031c57600080fd5b5061014461032b366004611e47565b610cfe565b34801561033c57600080fd5b5061014461034b366004611e47565b610d32565b34801561035c57600080fd5b5061014461036b366004611ee1565b610d6e565b6097546001600160a01b031633146103a35760405162461bcd60e51b815260040161039a90611fe9565b60405180910390fd5b60fd5460405163076d081560e01b8152600481018390526001600160a01b039091169063076d0815906024015b600060405180830381600087803b1580156103ea57600080fd5b505af11580156103fe573d6000803e3d6000fd5b5050505050565b600054610100900460ff166104205760005460ff1615610424565b303b155b6104875760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b606482015260840161039a565b600054610100900460ff161580156104a9576000805461ffff19166101011790555b6104b1610e28565b60408051808201909152600781526649504f525f333760c81b60208201526001600160a01b0387166104f65760405162461bcd60e51b815260040161039a919061204a565b5060408051808201909152600781526649504f525f333760c81b60208201526001600160a01b03851661053c5760405162461bcd60e51b815260040161039a919061204a565b5060408051808201909152600781526649504f525f333760c81b60208201526001600160a01b0384166105825760405162461bcd60e51b815260040161039a919061204a565b5060408051808201909152600781526649504f525f333760c81b60208201526001600160a01b0383166105c85760405162461bcd60e51b815260040161039a919061204a565b508560fb60016101000a8154816001600160a01b0302191690836001600160a01b03160217905550856001600160a01b031663313ce5676040518163ffffffff1660e01b815260040160206040518083038186803b15801561062957600080fd5b505afa15801561063d573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610661919061207d565b60fb805460ff191660ff92831617905560fc80546001600160a01b03199081166001600160a01b038981169190911790925560fd8054821688841617905560fe8054821687841617905582541690841617905580156106c6576000805461ff00191690555b505050505050565b306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614156107175760405162461bcd60e51b815260040161039a906120a0565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166107606000805160206123e1833981519152546001600160a01b031690565b6001600160a01b0316146107865760405162461bcd60e51b815260040161039a906120ec565b61078f81610e57565b604080516000808252602082019092526107ab91839190610e81565b50565b6097546001600160a01b031633146107d85760405162461bcd60e51b815260040161039a90611fe9565b6107e0611000565b565b306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016141561082b5760405162461bcd60e51b815260040161039a906120a0565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166108746000805160206123e1833981519152546001600160a01b031690565b6001600160a01b03161461089a5760405162461bcd60e51b815260040161039a906120ec565b6108a382610e57565b6108af82826001610e81565b5050565b6000306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016146109535760405162461bcd60e51b815260206004820152603860248201527f555550535570677261646561626c653a206d757374206e6f742062652063616c60448201527f6c6564207468726f7567682064656c656761746563616c6c0000000000000000606482015260840161039a565b506000805160206123e183398151915290565b6097546001600160a01b031633146109905760405162461bcd60e51b815260040161039a90611fe9565b6107e0600061109d565b60006109a46110ef565b905090565b60fd5460fb546040516370a0823160e01b81526001600160a01b039283166004820181905292600092610100900416906370a082319060240160206040518083038186803b1580156109fa57600080fd5b505afa158015610a0e573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610a329190612138565b60ff54604051630dd59a7360e31b81526001600160a01b03858116600483015292935060009290911690636eacd3989060240160206040518083038186803b158015610a7d57600080fd5b505afa158015610a91573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610ab59190612138565b90506000610add610ace670de0b6b3a764000085612167565b610ad88486612186565b61122a565b905067012dfb0cb5e88000811115610b8d576000610b1e610afe8486612186565b610b109067012dfb0cb5e88000612167565b670de0b6b3a764000061122a565b610b28908561219e565b60fd54604051635823114b60e11b8152600481018390529192506001600160a01b03169063b046229690602401600060405180830381600087803b158015610b6f57600080fd5b505af1158015610b83573d6000803e3d6000fd5b5050505050610c08565b600083610b9d610afe8583612186565b610ba7919061219e565b60fd5460405163076d081560e01b8152600481018390529192506001600160a01b03169063076d081590602401600060405180830381600087803b158015610bee57600080fd5b505af1158015610c02573d6000803e3d6000fd5b50505050505b50505050565b6097546001600160a01b03163314610c385760405162461bcd60e51b815260040161039a90611fe9565b6107e0611253565b6097546001600160a01b03163314610c6a5760405162461bcd60e51b815260040161039a90611fe9565b60fd54604051635823114b60e11b8152600481018390526001600160a01b039091169063b0462296906024016103d0565b60c95460408051808201909152600681526524a827a92f9b60d11b6020820152906001600160a01b03163314610ce45760405162461bcd60e51b815260040161039a919061204a565b5060c980546001600160a01b03191690556107e03361109d565b60c954600160a01b900460ff1615610d285760405162461bcd60e51b815260040161039a906121b5565b6107ab81426112b8565b60c954600160a01b900460ff1615610d5c5760405162461bcd60e51b815260040161039a906121b5565b60fb546107ab90829060ff16426116f0565b6097546001600160a01b03163314610d985760405162461bcd60e51b815260040161039a90611fe9565b60408051808201909152600781526649504f525f333760c81b60208201526001600160a01b038216610ddd5760405162461bcd60e51b815260040161039a919061204a565b5060c980546001600160a01b0319166001600160a01b0383169081179091556040517f3ec7bb1d452f3c36260fa8ef678a597fd97574d8ec42f6dc98ffce3dbc91228f90600090a250565b600054610100900460ff16610e4f5760405162461bcd60e51b815260040161039a906121df565b6107e0611922565b6097546001600160a01b031633146107ab5760405162461bcd60e51b815260040161039a90611fe9565b7f4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd91435460ff1615610eb957610eb483611952565b505050565b826001600160a01b03166352d1902d6040518163ffffffff1660e01b815260040160206040518083038186803b158015610ef257600080fd5b505afa925050508015610f22575060408051601f3d908101601f19168201909252610f1f91810190612138565b60015b610f855760405162461bcd60e51b815260206004820152602e60248201527f45524331393637557067726164653a206e657720696d706c656d656e7461746960448201526d6f6e206973206e6f74205555505360901b606482015260840161039a565b6000805160206123e18339815191528114610ff45760405162461bcd60e51b815260206004820152602960248201527f45524331393637557067726164653a20756e737570706f727465642070726f786044820152681a58589b195555525160ba1b606482015260840161039a565b50610eb48383836119ee565b60c954600160a01b900460ff166110505760405162461bcd60e51b815260206004820152601460248201527314185d5cd8589b194e881b9bdd081c185d5cd95960621b604482015260640161039a565b60c9805460ff60a01b191690557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa335b6040516001600160a01b03909116815260200160405180910390a1565b609780546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b60fd5460fb546040516370a0823160e01b81526001600160a01b039283166004820181905260009390928492610100909104909116906370a082319060240160206040518083038186803b15801561114657600080fd5b505afa15801561115a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061117e9190612138565b60ff54604051630dd59a7360e31b81526001600160a01b03858116600483015292935060009290911690636eacd3989060240160206040518083038186803b1580156111c957600080fd5b505afa1580156111dd573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906112019190612138565b60fb54909150611222906112189060ff1684612167565b610ad88385612186565b935050505090565b60008161123860028261222a565b6112429085612186565b61124c919061222a565b9392505050565b60c954600160a01b900460ff161561127d5760405162461bcd60e51b815260040161039a906121b5565b60c9805460ff60a01b1916600160a01b1790557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a2586110803390565b8115801590611341575060fc546040516370a0823160e01b81523360048201526001600160a01b03909116906370a082319060240160206040518083038186803b15801561130557600080fd5b505afa158015611319573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061133d9190612138565b8211155b6040518060400160405280600781526020016624a827a92f9a1960c91b8152509061137f5760405162461bcd60e51b815260040161039a919061204a565b5060fd54604051630ee1265f60e01b8152600481018390526001600160a01b03909116906000908290630ee1265f9060240160206040518083038186803b1580156113c957600080fd5b505afa1580156113dd573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906114019190612138565b60408051808201909152600781526649504f525f343560c81b6020820152909150816114405760405162461bcd60e51b815260040161039a919061204a565b5060fd54604080516304a5662760e01b815290516000926001600160a01b0316916304a56627916004808301926080929190829003018186803b15801561148657600080fd5b505afa15801561149a573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906114be919061224c565b905060006114cf610b108488612167565b9050808260400151116040518060400160405280600781526020016649504f525f343360c81b815250906115165760405162461bcd60e51b815260040161039a919061204a565b5060fb5460009061152b90839060ff16611a13565b9050600061155184604001518560200151866000015161154b9190612186565b85611a75565b9050670de0b6b3a764000081111560405180604001604052806007815260200166092a09ea4be6a760cb1b8152509061159d5760405162461bcd60e51b815260040161039a919061204a565b5060fc54604051633dae446f60e21b815233600482018190526024820152604481018a90526001600160a01b039091169063f6b911bc90606401600060405180830381600087803b1580156115f157600080fd5b505af1158015611605573d6000803e3d6000fd5b505060fe5460405163596e4fcd60e01b8152600481018790526001600160a01b03909116925063596e4fcd9150602401600060405180830381600087803b15801561164f57600080fd5b505af1158015611663573d6000803e3d6000fd5b505060fd5460fb5461168a935061010090046001600160a01b039081169250163385611a9e565b604080518881526001600160a01b03881660208201523381830152606081018790526080810184905260a081018a905290517f56ca23f7d30eaa3c83282939be03d3612e5b1dcb5ab367bc080e2ed859170c029181900360c00190a15050505050505050565b60fd54604051630ee1265f60e01b8152600481018390526001600160a01b03909116906000908290630ee1265f9060240160206040518083038186803b15801561173957600080fd5b505afa15801561174d573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906117719190612138565b60408051808201909152600781526649504f525f343560c81b6020820152909150816117b05760405162461bcd60e51b815260040161039a919061204a565b5060006117bd8686611af8565b60fe546040516328e32c8560e11b8152600481018390529192506001600160a01b0316906351c6590a90602401600060405180830381600087803b15801561180457600080fd5b505af1158015611818573d6000803e3d6000fd5b505060fb5461183a925061010090046001600160a01b03169050338589611a9e565b6000611857611851670de0b6b3a764000084612167565b8461122a565b60fc546040516340c10f1960e01b8152336004820152602481018390529192506001600160a01b0316906340c10f1990604401600060405180830381600087803b1580156118a457600080fd5b505af11580156118b8573d6000803e3d6000fd5b5050604080518881523360208201526001600160a01b0388168183015260608101879052608081018b905260a0810185905290517f8d05c5433da9043d46c42e0d3879166791511720db6320489f6f612baa3ac32393509081900360c0019150a150505050505050565b600054610100900460ff166119495760405162461bcd60e51b815260040161039a906121df565b6107e03361109d565b6001600160a01b0381163b6119bf5760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201526c1bdd08184818dbdb9d1c9858dd609a1b606482015260840161039a565b6000805160206123e183398151915280546001600160a01b0319166001600160a01b0392909216919091179055565b6119f783611b2d565b600082511180611a045750805b15610eb457610c088383611b6d565b60008160121415611a25575081611a6f565b6012821115611a5557611a3960128361219e565b611a4490600a612396565b611a4e9084612167565b9050611a6f565b611a4e83611a6484601261219e565b610ad890600a612396565b92915050565b6000611a96611a8c670de0b6b3a764000085612167565b610ad8848761219e565b949350505050565b604080516001600160a01b0385811660248301528416604482015260648082018490528251808303909101815260849091019091526020810180516001600160e01b03166323b872dd60e01b179052610c08908590611c61565b60008160121415611b0a575081611a6f565b6012821115611b2257611a4e83611a6460128561219e565b611a3982601261219e565b611b3681611952565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606001600160a01b0383163b611bd55760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f6044820152651b9d1c9858dd60d21b606482015260840161039a565b600080846001600160a01b031684604051611bf091906123a2565b600060405180830381855af49150503d8060008114611c2b576040519150601f19603f3d011682016040523d82523d6000602084013e611c30565b606091505b5091509150611c58828260405180606001604052806027815260200161240160279139611d33565b95945050505050565b6000611cb6826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b0316611d6c9092919063ffffffff16565b805190915015610eb45780806020019051810190611cd491906123be565b610eb45760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b606482015260840161039a565b60608315611d4257508161124c565b825115611d525782518084602001fd5b8160405162461bcd60e51b815260040161039a919061204a565b6060611a968484600085856001600160a01b0385163b611dce5760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604482015260640161039a565b600080866001600160a01b03168587604051611dea91906123a2565b60006040518083038185875af1925050503d8060008114611e27576040519150601f19603f3d011682016040523d82523d6000602084013e611e2c565b606091505b5091509150611e3c828286611d33565b979650505050505050565b600060208284031215611e5957600080fd5b5035919050565b80356001600160a01b0381168114611e7757600080fd5b919050565b600080600080600060a08688031215611e9457600080fd5b611e9d86611e60565b9450611eab60208701611e60565b9350611eb960408701611e60565b9250611ec760608701611e60565b9150611ed560808701611e60565b90509295509295909350565b600060208284031215611ef357600080fd5b61124c82611e60565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f1916810167ffffffffffffffff81118282101715611f3b57611f3b611efc565b604052919050565b60008060408385031215611f5657600080fd5b611f5f83611e60565b915060208084013567ffffffffffffffff80821115611f7d57600080fd5b818601915086601f830112611f9157600080fd5b813581811115611fa357611fa3611efc565b611fb5601f8201601f19168501611f12565b91508082528784828501011115611fcb57600080fd5b80848401858401376000848284010152508093505050509250929050565b6020808252818101527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604082015260600190565b60005b83811015612039578181015183820152602001612021565b83811115610c085750506000910152565b602081526000825180602084015261206981604085016020870161201e565b601f01601f19169190910160400192915050565b60006020828403121561208f57600080fd5b815160ff8116811461124c57600080fd5b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b19195b1959d85d1958d85b1b60a21b606082015260800190565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b6163746976652070726f787960a01b606082015260800190565b60006020828403121561214a57600080fd5b5051919050565b634e487b7160e01b600052601160045260246000fd5b600081600019048311821515161561218157612181612151565b500290565b6000821982111561219957612199612151565b500190565b6000828210156121b0576121b0612151565b500390565b60208082526010908201526f14185d5cd8589b194e881c185d5cd95960821b604082015260600190565b6020808252602b908201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960408201526a6e697469616c697a696e6760a81b606082015260800190565b60008261224757634e487b7160e01b600052601260045260246000fd5b500490565b60006080828403121561225e57600080fd5b6040516080810181811067ffffffffffffffff8211171561228157612281611efc565b8060405250825181526020830151602082015260408301516040820152606083015160608201528091505092915050565b600181815b808511156122ed5781600019048211156122d3576122d3612151565b808516156122e057918102915b93841c93908002906122b7565b509250929050565b60008261230457506001611a6f565b8161231157506000611a6f565b816001811461232757600281146123315761234d565b6001915050611a6f565b60ff84111561234257612342612151565b50506001821b611a6f565b5060208310610133831016604e8410600b8410161715612370575081810a611a6f565b61237a83836122b2565b806000190482111561238e5761238e612151565b029392505050565b600061124c83836122f5565b600082516123b481846020870161201e565b9190910192915050565b6000602082840312156123d057600080fd5b8151801515811461124c57600080fdfe360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a26469706673582212203c61c58a42db6332336744ee7e2d0778ee53f1338c62baf8021a87b8953061cc64736f6c63430008090033";

type JosephDaiConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: JosephDaiConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class JosephDai__factory extends ContractFactory {
  constructor(...args: JosephDaiConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "JosephDai";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<JosephDai> {
    return super.deploy(overrides || {}) as Promise<JosephDai>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): JosephDai {
    return super.attach(address) as JosephDai;
  }
  connect(signer: Signer): JosephDai__factory {
    return super.connect(signer) as JosephDai__factory;
  }
  static readonly contractName: "JosephDai";
  public readonly contractName: "JosephDai";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): JosephDaiInterface {
    return new utils.Interface(_abi) as JosephDaiInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): JosephDai {
    return new Contract(address, _abi, signerOrProvider) as JosephDai;
  }
}
