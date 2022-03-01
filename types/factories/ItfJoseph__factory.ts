/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { ItfJoseph, ItfJosephInterface } from "../ItfJoseph";

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
    name: "getRedeemLpMaxUtilizationPercentage",
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
    inputs: [
      {
        internalType: "uint256",
        name: "liquidityAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "itfProvideLiquidity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ipTokenVolume",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "itfRedeem",
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
  "0x60a06040523060805234801561001457600080fd5b5060805161251761004c600039600081816107550152818161079501528181610869015281816108a9015261093c01526125176000f3fe6080604052600436106101405760003560e01c806371a6650e116100b6578063b04622961161006f578063b046229614610337578063b28a44ef14610357578063cc29516a14610377578063db006a751461038c578063eb521a4c146103ac578063f2fde38b146103cc57600080fd5b806371a6650e1461029f5780637d7c2a1c146102b45780638456cb59146102c95780638b83a083146102de5780638da5cb5b146102f957806392dcf4571461031757600080fd5b806338d52e0f1161010857806338d52e0f146101ec5780633f4ba83a146102235780634f1ef2861461023857806352d1902d1461024b5780635c975abb14610260578063715018a61461028a57600080fd5b8063076d0815146101455780630d8e6e2c146101675780631459457a1461018a578063313ce567146101aa5780633659cfe6146101cc575b600080fd5b34801561015157600080fd5b50610165610160366004611edf565b6103ec565b005b34801561017357600080fd5b5060015b6040519081526020015b60405180910390f35b34801561019657600080fd5b506101656101a5366004611f14565b610481565b3480156101b657600080fd5b5060fb5460405160ff9091168152602001610181565b3480156101d857600080fd5b506101656101e7366004611f79565b61074a565b3480156101f857600080fd5b5060fb5461010090046001600160a01b03165b6040516001600160a01b039091168152602001610181565b34801561022f57600080fd5b5061016561082a565b610165610246366004611fdb565b61085e565b34801561025757600080fd5b5061017761092f565b34801561026c57600080fd5b5060c954600160a01b900460ff166040519015158152602001610181565b34801561029657600080fd5b506101656109e2565b3480156102ab57600080fd5b50610177610a16565b3480156102c057600080fd5b50610165610a25565b3480156102d557600080fd5b50610165610c8a565b3480156102ea57600080fd5b50670de0b6b3a7640000610177565b34801561030557600080fd5b506097546001600160a01b031661020b565b34801561032357600080fd5b50610165610332366004612081565b610cbc565b34801561034357600080fd5b50610165610352366004611edf565b610cce565b34801561036357600080fd5b50610165610372366004612081565b610d29565b34801561038357600080fd5b50610165610d33565b34801561039857600080fd5b506101656103a7366004611edf565b610d96565b3480156103b857600080fd5b506101656103c7366004611edf565b610dca565b3480156103d857600080fd5b506101656103e7366004611f79565b610e06565b6097546001600160a01b0316331461041f5760405162461bcd60e51b8152600401610416906120a3565b60405180910390fd5b60fd5460405163076d081560e01b8152600481018390526001600160a01b039091169063076d0815906024015b600060405180830381600087803b15801561046657600080fd5b505af115801561047a573d6000803e3d6000fd5b5050505050565b600054610100900460ff1661049c5760005460ff16156104a0565b303b155b6105035760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b6064820152608401610416565b600054610100900460ff16158015610525576000805461ffff19166101011790555b61052d610ec0565b60408051808201909152600781526649504f525f333760c81b60208201526001600160a01b0387166105725760405162461bcd60e51b81526004016104169190612104565b5060408051808201909152600781526649504f525f333760c81b60208201526001600160a01b0385166105b85760405162461bcd60e51b81526004016104169190612104565b5060408051808201909152600781526649504f525f333760c81b60208201526001600160a01b0384166105fe5760405162461bcd60e51b81526004016104169190612104565b5060408051808201909152600781526649504f525f333760c81b60208201526001600160a01b0383166106445760405162461bcd60e51b81526004016104169190612104565b508560fb60016101000a8154816001600160a01b0302191690836001600160a01b03160217905550856001600160a01b031663313ce5676040518163ffffffff1660e01b815260040160206040518083038186803b1580156106a557600080fd5b505afa1580156106b9573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106dd9190612137565b60fb805460ff191660ff92831617905560fc80546001600160a01b03199081166001600160a01b038981169190911790925560fd8054821688841617905560fe805482168784161790558254169084161790558015610742576000805461ff00191690555b505050505050565b306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614156107935760405162461bcd60e51b81526004016104169061215a565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166107dc60008051602061249b833981519152546001600160a01b031690565b6001600160a01b0316146108025760405162461bcd60e51b8152600401610416906121a6565b61080b81610eef565b6040805160008082526020820190925261082791839190610f19565b50565b6097546001600160a01b031633146108545760405162461bcd60e51b8152600401610416906120a3565b61085c611098565b565b306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614156108a75760405162461bcd60e51b81526004016104169061215a565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166108f060008051602061249b833981519152546001600160a01b031690565b6001600160a01b0316146109165760405162461bcd60e51b8152600401610416906121a6565b61091f82610eef565b61092b82826001610f19565b5050565b6000306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016146109cf5760405162461bcd60e51b815260206004820152603860248201527f555550535570677261646561626c653a206d757374206e6f742062652063616c60448201527f6c6564207468726f7567682064656c656761746563616c6c00000000000000006064820152608401610416565b5060008051602061249b83398151915290565b6097546001600160a01b03163314610a0c5760405162461bcd60e51b8152600401610416906120a3565b61085c6000611135565b6000610a20611187565b905090565b60fd5460fb546040516370a0823160e01b81526001600160a01b039283166004820181905292600092610100900416906370a082319060240160206040518083038186803b158015610a7657600080fd5b505afa158015610a8a573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610aae91906121f2565b60ff54604051630dd59a7360e31b81526001600160a01b03858116600483015292935060009290911690636eacd3989060240160206040518083038186803b158015610af957600080fd5b505afa158015610b0d573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610b3191906121f2565b90506000610b59610b4a670de0b6b3a764000085612221565b610b548486612240565b6112c2565b905067012dfb0cb5e88000811115610c09576000610b9a610b7a8486612240565b610b8c9067012dfb0cb5e88000612221565b670de0b6b3a76400006112c2565b610ba49085612258565b60fd54604051635823114b60e11b8152600481018390529192506001600160a01b03169063b046229690602401600060405180830381600087803b158015610beb57600080fd5b505af1158015610bff573d6000803e3d6000fd5b5050505050610c84565b600083610c19610b7a8583612240565b610c239190612258565b60fd5460405163076d081560e01b8152600481018390529192506001600160a01b03169063076d081590602401600060405180830381600087803b158015610c6a57600080fd5b505af1158015610c7e573d6000803e3d6000fd5b50505050505b50505050565b6097546001600160a01b03163314610cb45760405162461bcd60e51b8152600401610416906120a3565b61085c6112eb565b60fb5461092b90839060ff1683611350565b6097546001600160a01b03163314610cf85760405162461bcd60e51b8152600401610416906120a3565b60fd54604051635823114b60e11b8152600481018390526001600160a01b039091169063b04622969060240161044c565b61092b8282611582565b60c95460408051808201909152600681526524a827a92f9b60d11b6020820152906001600160a01b03163314610d7c5760405162461bcd60e51b81526004016104169190612104565b5060c980546001600160a01b031916905561085c33611135565b60c954600160a01b900460ff1615610dc05760405162461bcd60e51b81526004016104169061226f565b6108278142611582565b60c954600160a01b900460ff1615610df45760405162461bcd60e51b81526004016104169061226f565b60fb5461082790829060ff1642611350565b6097546001600160a01b03163314610e305760405162461bcd60e51b8152600401610416906120a3565b60408051808201909152600781526649504f525f333760c81b60208201526001600160a01b038216610e755760405162461bcd60e51b81526004016104169190612104565b5060c980546001600160a01b0319166001600160a01b0383169081179091556040517f3ec7bb1d452f3c36260fa8ef678a597fd97574d8ec42f6dc98ffce3dbc91228f90600090a250565b600054610100900460ff16610ee75760405162461bcd60e51b815260040161041690612299565b61085c6119ba565b6097546001600160a01b031633146108275760405162461bcd60e51b8152600401610416906120a3565b7f4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd91435460ff1615610f5157610f4c836119ea565b505050565b826001600160a01b03166352d1902d6040518163ffffffff1660e01b815260040160206040518083038186803b158015610f8a57600080fd5b505afa925050508015610fba575060408051601f3d908101601f19168201909252610fb7918101906121f2565b60015b61101d5760405162461bcd60e51b815260206004820152602e60248201527f45524331393637557067726164653a206e657720696d706c656d656e7461746960448201526d6f6e206973206e6f74205555505360901b6064820152608401610416565b60008051602061249b833981519152811461108c5760405162461bcd60e51b815260206004820152602960248201527f45524331393637557067726164653a20756e737570706f727465642070726f786044820152681a58589b195555525160ba1b6064820152608401610416565b50610f4c838383611a86565b60c954600160a01b900460ff166110e85760405162461bcd60e51b815260206004820152601460248201527314185d5cd8589b194e881b9bdd081c185d5cd95960621b6044820152606401610416565b60c9805460ff60a01b191690557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa335b6040516001600160a01b03909116815260200160405180910390a1565b609780546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b60fd5460fb546040516370a0823160e01b81526001600160a01b039283166004820181905260009390928492610100909104909116906370a082319060240160206040518083038186803b1580156111de57600080fd5b505afa1580156111f2573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061121691906121f2565b60ff54604051630dd59a7360e31b81526001600160a01b03858116600483015292935060009290911690636eacd3989060240160206040518083038186803b15801561126157600080fd5b505afa158015611275573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061129991906121f2565b60fb549091506112ba906112b09060ff1684612221565b610b548385612240565b935050505090565b6000816112d06002826122e4565b6112da9085612240565b6112e491906122e4565b9392505050565b60c954600160a01b900460ff16156113155760405162461bcd60e51b81526004016104169061226f565b60c9805460ff60a01b1916600160a01b1790557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a2586111183390565b60fd54604051630ee1265f60e01b8152600481018390526001600160a01b03909116906000908290630ee1265f9060240160206040518083038186803b15801561139957600080fd5b505afa1580156113ad573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906113d191906121f2565b60408051808201909152600781526649504f525f343560c81b6020820152909150816114105760405162461bcd60e51b81526004016104169190612104565b50600061141d8686611aab565b60fe546040516328e32c8560e11b8152600481018390529192506001600160a01b0316906351c6590a90602401600060405180830381600087803b15801561146457600080fd5b505af1158015611478573d6000803e3d6000fd5b505060fb5461149a925061010090046001600160a01b03169050338589611b0d565b60006114b76114b1670de0b6b3a764000084612221565b846112c2565b60fc546040516340c10f1960e01b8152336004820152602481018390529192506001600160a01b0316906340c10f1990604401600060405180830381600087803b15801561150457600080fd5b505af1158015611518573d6000803e3d6000fd5b5050604080518881523360208201526001600160a01b0388168183015260608101879052608081018b905260a0810185905290517f8d05c5433da9043d46c42e0d3879166791511720db6320489f6f612baa3ac32393509081900360c0019150a150505050505050565b811580159061160b575060fc546040516370a0823160e01b81523360048201526001600160a01b03909116906370a082319060240160206040518083038186803b1580156115cf57600080fd5b505afa1580156115e3573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061160791906121f2565b8211155b6040518060400160405280600781526020016624a827a92f9a1960c91b815250906116495760405162461bcd60e51b81526004016104169190612104565b5060fd54604051630ee1265f60e01b8152600481018390526001600160a01b03909116906000908290630ee1265f9060240160206040518083038186803b15801561169357600080fd5b505afa1580156116a7573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906116cb91906121f2565b60408051808201909152600781526649504f525f343560c81b60208201529091508161170a5760405162461bcd60e51b81526004016104169190612104565b5060fd54604080516304a5662760e01b815290516000926001600160a01b0316916304a56627916004808301926080929190829003018186803b15801561175057600080fd5b505afa158015611764573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906117889190612306565b90506000611799610b8c8488612221565b9050808260400151116040518060400160405280600781526020016649504f525f343360c81b815250906117e05760405162461bcd60e51b81526004016104169190612104565b5060fb546000906117f590839060ff16611b67565b9050600061181b8460400151856020015186600001516118159190612240565b85611b9c565b9050670de0b6b3a764000081111560405180604001604052806007815260200166092a09ea4be6a760cb1b815250906118675760405162461bcd60e51b81526004016104169190612104565b5060fc54604051633dae446f60e21b815233600482018190526024820152604481018a90526001600160a01b039091169063f6b911bc90606401600060405180830381600087803b1580156118bb57600080fd5b505af11580156118cf573d6000803e3d6000fd5b505060fe5460405163596e4fcd60e01b8152600481018790526001600160a01b03909116925063596e4fcd9150602401600060405180830381600087803b15801561191957600080fd5b505af115801561192d573d6000803e3d6000fd5b505060fd5460fb54611954935061010090046001600160a01b039081169250163385611b0d565b604080518881526001600160a01b03881660208201523381830152606081018790526080810184905260a081018a905290517f56ca23f7d30eaa3c83282939be03d3612e5b1dcb5ab367bc080e2ed859170c029181900360c00190a15050505050505050565b600054610100900460ff166119e15760405162461bcd60e51b815260040161041690612299565b61085c33611135565b6001600160a01b0381163b611a575760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201526c1bdd08184818dbdb9d1c9858dd609a1b6064820152608401610416565b60008051602061249b83398151915280546001600160a01b0319166001600160a01b0392909216919091179055565b611a8f83611bc5565b600082511180611a9c5750805b15610f4c57610c848383611c05565b60008160121415611abd575081611b07565b6012821115611ae757611ae083611ad5601285612258565b610b5490600a612450565b9050611b07565b611af2826012612258565b611afd90600a612450565b611ae09084612221565b92915050565b604080516001600160a01b0385811660248301528416604482015260648082018490528251808303909101815260849091019091526020810180516001600160e01b03166323b872dd60e01b179052610c84908590611cf9565b60008160121415611b79575081611b07565b6012821115611b8d57611af2601283612258565b611ae083611ad5846012612258565b6000611bbd611bb3670de0b6b3a764000085612221565b610b548487612258565b949350505050565b611bce816119ea565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606001600160a01b0383163b611c6d5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f6044820152651b9d1c9858dd60d21b6064820152608401610416565b600080846001600160a01b031684604051611c88919061245c565b600060405180830381855af49150503d8060008114611cc3576040519150601f19603f3d011682016040523d82523d6000602084013e611cc8565b606091505b5091509150611cf082826040518060600160405280602781526020016124bb60279139611dcb565b95945050505050565b6000611d4e826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b0316611e049092919063ffffffff16565b805190915015610f4c5780806020019051810190611d6c9190612478565b610f4c5760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b6064820152608401610416565b60608315611dda5750816112e4565b825115611dea5782518084602001fd5b8160405162461bcd60e51b81526004016104169190612104565b6060611bbd8484600085856001600160a01b0385163b611e665760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e74726163740000006044820152606401610416565b600080866001600160a01b03168587604051611e82919061245c565b60006040518083038185875af1925050503d8060008114611ebf576040519150601f19603f3d011682016040523d82523d6000602084013e611ec4565b606091505b5091509150611ed4828286611dcb565b979650505050505050565b600060208284031215611ef157600080fd5b5035919050565b80356001600160a01b0381168114611f0f57600080fd5b919050565b600080600080600060a08688031215611f2c57600080fd5b611f3586611ef8565b9450611f4360208701611ef8565b9350611f5160408701611ef8565b9250611f5f60608701611ef8565b9150611f6d60808701611ef8565b90509295509295909350565b600060208284031215611f8b57600080fd5b6112e482611ef8565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f1916810167ffffffffffffffff81118282101715611fd357611fd3611f94565b604052919050565b60008060408385031215611fee57600080fd5b611ff783611ef8565b915060208084013567ffffffffffffffff8082111561201557600080fd5b818601915086601f83011261202957600080fd5b81358181111561203b5761203b611f94565b61204d601f8201601f19168501611faa565b9150808252878482850101111561206357600080fd5b80848401858401376000848284010152508093505050509250929050565b6000806040838503121561209457600080fd5b50508035926020909101359150565b6020808252818101527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604082015260600190565b60005b838110156120f35781810151838201526020016120db565b83811115610c845750506000910152565b60208152600082518060208401526121238160408501602087016120d8565b601f01601f19169190910160400192915050565b60006020828403121561214957600080fd5b815160ff811681146112e457600080fd5b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b19195b1959d85d1958d85b1b60a21b606082015260800190565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b6163746976652070726f787960a01b606082015260800190565b60006020828403121561220457600080fd5b5051919050565b634e487b7160e01b600052601160045260246000fd5b600081600019048311821515161561223b5761223b61220b565b500290565b600082198211156122535761225361220b565b500190565b60008282101561226a5761226a61220b565b500390565b60208082526010908201526f14185d5cd8589b194e881c185d5cd95960821b604082015260600190565b6020808252602b908201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960408201526a6e697469616c697a696e6760a81b606082015260800190565b60008261230157634e487b7160e01b600052601260045260246000fd5b500490565b60006080828403121561231857600080fd5b6040516080810181811067ffffffffffffffff8211171561233b5761233b611f94565b8060405250825181526020830151602082015260408301516040820152606083015160608201528091505092915050565b600181815b808511156123a757816000190482111561238d5761238d61220b565b8085161561239a57918102915b93841c9390800290612371565b509250929050565b6000826123be57506001611b07565b816123cb57506000611b07565b81600181146123e157600281146123eb57612407565b6001915050611b07565b60ff8411156123fc576123fc61220b565b50506001821b611b07565b5060208310610133831016604e8410600b841016171561242a575081810a611b07565b612434838361236c565b80600019048211156124485761244861220b565b029392505050565b60006112e483836123af565b6000825161246e8184602087016120d8565b9190910192915050565b60006020828403121561248a57600080fd5b815180151581146112e457600080fdfe360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a264697066735822122065aea4cc42a97b5314b189b78b2ee57c28ca5c69d9f35e8dbbb874f736f65b5a64736f6c63430008090033";

type ItfJosephConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ItfJosephConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ItfJoseph__factory extends ContractFactory {
  constructor(...args: ItfJosephConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "ItfJoseph";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ItfJoseph> {
    return super.deploy(overrides || {}) as Promise<ItfJoseph>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): ItfJoseph {
    return super.attach(address) as ItfJoseph;
  }
  connect(signer: Signer): ItfJoseph__factory {
    return super.connect(signer) as ItfJoseph__factory;
  }
  static readonly contractName: "ItfJoseph";
  public readonly contractName: "ItfJoseph";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ItfJosephInterface {
    return new utils.Interface(_abi) as ItfJosephInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ItfJoseph {
    return new Contract(address, _abi, signerOrProvider) as ItfJoseph;
  }
}
