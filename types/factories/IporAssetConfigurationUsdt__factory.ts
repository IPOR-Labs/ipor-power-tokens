/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  IporAssetConfigurationUsdt,
  IporAssetConfigurationUsdtInterface,
} from "../IporAssetConfigurationUsdt";

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
        name: "asset",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newAssetManagementVaultAddress",
        type: "address",
      },
    ],
    name: "AssetManagementVaultUpdated",
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
        name: "asset",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newCharlieTreasurer",
        type: "address",
      },
    ],
    name: "CharlieTreasurerUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "newJosephAddress",
        type: "address",
      },
    ],
    name: "JosephAddressUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "newAddress",
        type: "address",
      },
    ],
    name: "MiltonAddressUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "newAddress",
        type: "address",
      },
    ],
    name: "MiltonStorageAddressUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
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
        indexed: true,
        internalType: "address",
        name: "newTreasureTreasurer",
        type: "address",
      },
    ],
    name: "TreasureTreasurerUpdated",
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
    name: "DEFAULT_ADMIN_ROLE",
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
    name: "getAssetManagementVault",
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
    name: "getCharlieTreasurer",
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
    name: "getDecimals",
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
    inputs: [],
    name: "getIpToken",
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
    name: "getJoseph",
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
    name: "getMilton",
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
    name: "getMiltonStorage",
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
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
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
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleMembers",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTreasureTreasurer",
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
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "getUserRoles",
    outputs: [
      {
        internalType: "bytes32[]",
        name: "",
        type: "bytes32[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
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
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "address",
        name: "ipToken",
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
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newAssetManagementVaultAddress",
        type: "address",
      },
    ],
    name: "setAssetManagementVault",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newCharlieTreasurer",
        type: "address",
      },
    ],
    name: "setCharlieTreasurer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "joseph",
        type: "address",
      },
    ],
    name: "setJoseph",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "milton",
        type: "address",
      },
    ],
    name: "setMilton",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "miltonStorage",
        type: "address",
      },
    ],
    name: "setMiltonStorage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newTreasureTreasurer",
        type: "address",
      },
    ],
    name: "setTreasureTreasurer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
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
  "0x60a06040523060805234801561001457600080fd5b5060805161252261004c60003960008181610797015281816107d701528181610a5101528181610a910152610b2001526125226000f3fe60806040526004361061019c5760003560e01c80636ad2e612116100ec578063acdd75671161008a578063d547741f11610064578063d547741f146104b7578063ec9c16e4146104d7578063f0141d84146104f5578063f64de4ed1461051757600080fd5b8063acdd75671461045b578063c5beac4d14610479578063cb577c1f1461049757600080fd5b80639e5e1719116100c65780639e5e1719146103db578063a217fddf146103f9578063a3246ad31461040e578063a9ad627c1461043b57600080fd5b80636ad2e6121461037b5780637a190d251461039b57806391d14854146103bb57600080fd5b806336568abe116101595780634f1ef286116101335780634f1ef2861461031557806352d1902d1461032857806367ae2f591461033d5780636a2a66c41461035b57600080fd5b806336568abe146102b55780633659cfe6146102d5578063485cc955146102f557600080fd5b806301ffc9a7146101a157806306a36aee146101d65780631f8338f214610203578063248a9ca31461023557806329b371d0146102735780632f2ff15d14610295575b600080fd5b3480156101ad57600080fd5b506101c16101bc366004611fc8565b610535565b60405190151581526020015b60405180910390f35b3480156101e257600080fd5b506101f66101f136600461200e565b61056c565b6040516101cd9190612029565b34801561020f57600080fd5b50606c546001600160a01b03165b6040516001600160a01b0390911681526020016101cd565b34801561024157600080fd5b5061026561025036600461206d565b60009081526065602052604090206001015490565b6040519081526020016101cd565b34801561027f57600080fd5b5061029361028e36600461200e565b610604565b005b3480156102a157600080fd5b506102936102b0366004612086565b61067a565b3480156102c157600080fd5b506102936102d0366004612086565b610709565b3480156102e157600080fd5b506102936102f036600461200e565b61078c565b34801561030157600080fd5b506102936103103660046120b2565b61086c565b6102936103233660046120f2565b610a46565b34801561033457600080fd5b50610265610b13565b34801561034957600080fd5b50606b546001600160a01b031661021d565b34801561036757600080fd5b5061029361037636600461200e565b610bc6565b34801561038757600080fd5b5061029361039636600461200e565b610c9a565b3480156103a757600080fd5b506102936103b636600461200e565b610d10565b3480156103c757600080fd5b506101c16103d6366004612086565b610ddc565b3480156103e757600080fd5b50606d546001600160a01b031661021d565b34801561040557600080fd5b50610265600081565b34801561041a57600080fd5b5061042e61042936600461206d565b610e07565b6040516101cd91906121b4565b34801561044757600080fd5b5061029361045636600461200e565b610e9e565b34801561046757600080fd5b50606f546001600160a01b031661021d565b34801561048557600080fd5b50606a546001600160a01b031661021d565b3480156104a357600080fd5b506102936104b236600461200e565b610f14565b3480156104c357600080fd5b506102936104d2366004612086565b610fde565b3480156104e357600080fd5b50606e546001600160a01b031661021d565b34801561050157600080fd5b5060685460405160ff90911681526020016101cd565b34801561052357600080fd5b506069546001600160a01b031661021d565b60006001600160e01b03198216637965db0b60e01b148061056657506301ffc9a760e01b6001600160e01b03198316145b92915050565b60607fc878cde3567a457053651a2406e31db6dbb9207b6d5eedb081ef807beaaf54446105998133611076565b6001600160a01b038316600090815260676020908152604091829020805483518184028101840190945280845290918301828280156105f757602002820191906000526020600020905b8154815260200190600101908083116105e3575b5050505050915050919050565b7fb8f71ab818f476672f61fd76955446cd0045ed8ddb51f595d9e262b68d1157f661062f8133611076565b606b80546001600160a01b0319166001600160a01b0384169081179091556040517f0b5face36801cb1ecdb77f8b02927e49c467557bcb8bb4c269ca863980bf84ca90600090a25050565b6000828152606560205260409020600101546106968133611076565b6106a08383610ddc565b610704576106ae83836110da565b6001600160a01b0382166000818152606760209081526040808320805460018181018355918552838520018890558784526066835290832080549182018155835291200180546001600160a01b03191690911790555b505050565b6001600160a01b038116331461077e5760405162461bcd60e51b815260206004820152602f60248201527f416363657373436f6e74726f6c3a2063616e206f6e6c792072656e6f756e636560448201526e103937b632b9903337b91039b2b63360891b60648201526084015b60405180910390fd5b6107888282611100565b5050565b306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614156107d55760405162461bcd60e51b8152600401610775906121f5565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031661081e600080516020612486833981519152546001600160a01b031690565b6001600160a01b0316146108445760405162461bcd60e51b815260040161077590612241565b61084d81611167565b6040805160008082526020820190925261086991839190611180565b50565b600054610100900460ff166108875760005460ff161561088b565b303b155b6108ee5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b6064820152608401610775565b600054610100900460ff16158015610910576000805461ffff19166101011790555b6109186112fa565b82606860016101000a8154816001600160a01b0302191690836001600160a01b0316021790555081606960006101000a8154816001600160a01b0302191690836001600160a01b031602179055506000836001600160a01b031663313ce5676040518163ffffffff1660e01b815260040160206040518083038186803b1580156109a157600080fd5b505afa1580156109b5573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109d9919061228d565b60408051808201909152600781526624a827a92f9a9960c91b602082015290915060ff8216610a1b5760405162461bcd60e51b815260040161077591906122dc565b506068805460ff191660ff929092169190911790558015610704576000805461ff0019169055505050565b306001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000161415610a8f5760405162461bcd60e51b8152600401610775906121f5565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316610ad8600080516020612486833981519152546001600160a01b031690565b6001600160a01b031614610afe5760405162461bcd60e51b815260040161077590612241565b610b0782611167565b61078882826001611180565b6000306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614610bb35760405162461bcd60e51b815260206004820152603860248201527f555550535570677261646561626c653a206d757374206e6f742062652063616c60448201527f6c6564207468726f7567682064656c656761746563616c6c00000000000000006064820152608401610775565b5060008051602061248683398151915290565b7f21b203ce7b3398e0ad35c938bc2c62a805ef17dc57de85e9d29052eac6d9d6f7610bf18133611076565b60408051808201909152600781526649504f525f333760c81b60208201526001600160a01b038316610c365760405162461bcd60e51b815260040161077591906122dc565b50606e80546001600160a01b0319166001600160a01b038481169182179092556068546040516101009091049092168252907fbe7a60cedd85b6b38d4867360e309b18bdafa8027b9e837b665f3d63c549a56d906020015b60405180910390a25050565b7f57a20741ae1ee76695a182cdfb995538919da5f1f6a92bca097f37a35c4be803610cc58133611076565b606a80546001600160a01b0319166001600160a01b0384169081179091556040517f1194575f98fadb2f4d98359e91f194dc1cb2cdfc2675324deed702288cbfa35d90600090a25050565b7f9cdee4e06275597b667c73a5eb52ed89fe6acbbd36bd9fa38146b1316abfbbc4610d3b8133611076565b60408051808201909152600781526649504f525f333760c81b60208201526001600160a01b038316610d805760405162461bcd60e51b815260040161077591906122dc565b50606f80546001600160a01b0319166001600160a01b038481169182179092556068546040516101009091049092168252907f1e3ac5ddd000df9924340c8fe702cf73c29571a702632896503a81fb3b9d20e690602001610c8e565b60009182526065602090815260408084206001600160a01b0393909316845291905290205460ff1690565b60607fc878cde3567a457053651a2406e31db6dbb9207b6d5eedb081ef807beaaf5444610e348133611076565b600083815260666020908152604091829020805483518184028101840190945280845290918301828280156105f757602002820191906000526020600020905b81546001600160a01b03168152600190910190602001808311610e74575050505050915050919050565b7f2c03e103fc464998235bd7f80967993a1e6052d41cc085d3317ca8e301f51125610ec98133611076565b606c80546001600160a01b0319166001600160a01b0384169081179091556040517fdc628d49b150a45a61d24b28b1cadac96ee19535ee27dc4c767f8bbb945bbddb90600090a25050565b7f2a7b2b7d358f8b11f783d1505af660b492b725a034776176adc7c268915d5bd8610f3f8133611076565b60408051808201909152600781526649504f525f333760c81b60208201526001600160a01b038316610f845760405162461bcd60e51b815260040161077591906122dc565b50606d80546001600160a01b0319166001600160a01b03848116918217909255606854604051919261010090910416907f29e2f7d65034d9be06b60cad80ffb99dbc47f35e1af91eb17279ecde4eecd10d90600090a35050565b600082815260656020526040902060010154610ffa8133611076565b6000805160206124cd83398151915283146110235761101983836116ba565b61070483836116e0565b604080518082019091526007815266049504f525f35360cc1b6020820152336001600160a01b038416141561106b5760405162461bcd60e51b815260040161077591906122dc565b5061101983836116ba565b6110808282610ddc565b61078857611098816001600160a01b031660146116f4565b6110a38360206116f4565b6040516020016110b492919061230f565b60408051601f198184030181529082905262461bcd60e51b8252610775916004016122dc565b6000828152606560205260409020600101546110f68133611076565b6107048383611897565b61110a8282610ddc565b156107885760008281526065602090815260408083206001600160a01b0385168085529252808320805460ff1916905551339285917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a45050565b6000805160206124cd8339815191526107888133611076565b7f4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd91435460ff16156111b3576107048361191d565b826001600160a01b03166352d1902d6040518163ffffffff1660e01b815260040160206040518083038186803b1580156111ec57600080fd5b505afa92505050801561121c575060408051601f3d908101601f1916820190925261121991810190612384565b60015b61127f5760405162461bcd60e51b815260206004820152602e60248201527f45524331393637557067726164653a206e657720696d706c656d656e7461746960448201526d6f6e206973206e6f74205555505360901b6064820152608401610775565b60008051602061248683398151915281146112ee5760405162461bcd60e51b815260206004820152602960248201527f45524331393637557067726164653a20756e737570706f727465642070726f786044820152681a58589b195555525160ba1b6064820152608401610775565b506107048383836119b9565b6113126000805160206124cd833981519152336119e4565b61132a6000805160206124cd83398151915280611a53565b6113627ffb1902cbac4bf447ada58dff398caab7aa9089eba1be77a2833d9e08dbe8664c6000805160206124cd833981519152611a53565b6113ac7fc878cde3567a457053651a2406e31db6dbb9207b6d5eedb081ef807beaaf54447ffb1902cbac4bf447ada58dff398caab7aa9089eba1be77a2833d9e08dbe8664c611a53565b6113e47f1b16f266cfe5113986bbdf79323bd64ba74c9e2631c82de1297c13405226a9526000805160206124cd833981519152611a53565b61142e7f57a20741ae1ee76695a182cdfb995538919da5f1f6a92bca097f37a35c4be8037f1b16f266cfe5113986bbdf79323bd64ba74c9e2631c82de1297c13405226a952611a53565b6114667f61e410eb94acd095b84b0de4a9befc42adb8e88aad1e0c387e8f14c5c05f4cd56000805160206124cd833981519152611a53565b6114b07fb8f71ab818f476672f61fd76955446cd0045ed8ddb51f595d9e262b68d1157f67f61e410eb94acd095b84b0de4a9befc42adb8e88aad1e0c387e8f14c5c05f4cd5611a53565b6114e87f811ff4f923fc903f4390f8acf72873b5d1b288ec77b442fe124d0f95d6a537316000805160206124cd833981519152611a53565b6115327f2c03e103fc464998235bd7f80967993a1e6052d41cc085d3317ca8e301f511257f811ff4f923fc903f4390f8acf72873b5d1b288ec77b442fe124d0f95d6a53731611a53565b61156a7f0a8c46bed2194419383260fcc83e7085079a16a3dce173fb3d66eb1f81c71f6e6000805160206124cd833981519152611a53565b6115b47f21b203ce7b3398e0ad35c938bc2c62a805ef17dc57de85e9d29052eac6d9d6f77f0a8c46bed2194419383260fcc83e7085079a16a3dce173fb3d66eb1f81c71f6e611a53565b6115ec7f1ba824e22ad2e0dc1d7a152742f3b5890d88c5a849ed8e57f4c9d84203d3ea9c6000805160206124cd833981519152611a53565b6116367f9cdee4e06275597b667c73a5eb52ed89fe6acbbd36bd9fa38146b1316abfbbc47f1ba824e22ad2e0dc1d7a152742f3b5890d88c5a849ed8e57f4c9d84203d3ea9c611a53565b61166e7f1d3c5c61c32255cb922b09e735c0e9d76d2aacc424c3f7d9b9b85c478946fa266000805160206124cd833981519152611a53565b6116b87f2a7b2b7d358f8b11f783d1505af660b492b725a034776176adc7c268915d5bd87f1d3c5c61c32255cb922b09e735c0e9d76d2aacc424c3f7d9b9b85c478946fa26611a53565b565b6000828152606560205260409020600101546116d68133611076565b6107048383611100565b6116ea8282611a9e565b6107888282611c2c565b606060006117038360026123b3565b61170e9060026123d2565b67ffffffffffffffff811115611726576117266120dc565b6040519080825280601f01601f191660200182016040528015611750576020820181803683370190505b509050600360fc1b8160008151811061176b5761176b6123ea565b60200101906001600160f81b031916908160001a905350600f60fb1b8160018151811061179a5761179a6123ea565b60200101906001600160f81b031916908160001a90535060006117be8460026123b3565b6117c99060016123d2565b90505b6001811115611841576f181899199a1a9b1b9c1cb0b131b232b360811b85600f16601081106117fd576117fd6123ea565b1a60f81b828281518110611813576118136123ea565b60200101906001600160f81b031916908160001a90535060049490941c9361183a81612400565b90506117cc565b5083156118905760405162461bcd60e51b815260206004820181905260248201527f537472696e67733a20686578206c656e67746820696e73756666696369656e746044820152606401610775565b9392505050565b6118a18282610ddc565b6107885760008281526065602090815260408083206001600160a01b03851684529091529020805460ff191660011790556118d93390565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b6001600160a01b0381163b61198a5760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201526c1bdd08184818dbdb9d1c9858dd609a1b6064820152608401610775565b60008051602061248683398151915280546001600160a01b0319166001600160a01b0392909216919091179055565b6119c283611d9c565b6000825111806119cf5750805b15610704576119de8383611ddc565b50505050565b6119ee8282610ddc565b610788576119fc8282611ed0565b6001600160a01b0316600081815260676020908152604080832080546001808201835591855283852001869055948352606682528220805494850181558252902090910180546001600160a01b0319169091179055565b600082815260656020526040808220600101805490849055905190918391839186917fbd79b86ffe0ab8e8776151514217cd7cacd52c909f66475c3af44e129f0b00ff9190a4505050565b600082815260666020908152604080832080548251818502810185019093528083528493830182828015611afb57602002820191906000526020600020905b81546001600160a01b03168152600190910190602001808311611add575b50505050509050600060018251611b129190612417565b67ffffffffffffffff811115611b2a57611b2a6120dc565b604051908082528060200260200182016040528015611b53578160200160208202803683370190505b50905060005b81518114611c0457828181518110611b7357611b736123ea565b60200260200101516001600160a01b0316856001600160a01b03161415611ba25783611b9e8161242e565b9450505b82611bb060ff8616836123d2565b81518110611bc057611bc06123ea565b6020026020010151828281518110611bda57611bda6123ea565b6001600160a01b039092166020928302919091019091015280611bfc8161244e565b915050611b59565b60008681526066602090815260409091208351611c2392850190611f13565b50505050505050565b6001600160a01b038116600090815260676020908152604080832080548251818502810185019093528083528493830182828015611c8957602002820191906000526020600020905b815481526020019060010190808311611c75575b50505050509050600060018251611ca09190612417565b67ffffffffffffffff811115611cb857611cb86120dc565b604051908082528060200260200182016040528015611ce1578160200160208202803683370190505b50905060005b81518114611d7357828181518110611d0157611d016123ea565b6020026020010151861415611d1e5783611d1a8161242e565b9450505b82611d2c60ff8616836123d2565b81518110611d3c57611d3c6123ea565b6020026020010151828281518110611d5657611d566123ea565b602090810291909101015280611d6b8161244e565b915050611ce7565b6001600160a01b03851660009081526067602090815260409091208351611c2392850190611f78565b611da58161191d565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606001600160a01b0383163b611e445760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f6044820152651b9d1c9858dd60d21b6064820152608401610775565b600080846001600160a01b031684604051611e5f9190612469565b600060405180830381855af49150503d8060008114611e9a576040519150601f19603f3d011682016040523d82523d6000602084013e611e9f565b606091505b5091509150611ec782826040518060600160405280602781526020016124a660279139611eda565b95945050505050565b6107888282611897565b60608315611ee9575081611890565b825115611ef95782518084602001fd5b8160405162461bcd60e51b815260040161077591906122dc565b828054828255906000526020600020908101928215611f68579160200282015b82811115611f6857825182546001600160a01b0319166001600160a01b03909116178255602090920191600190910190611f33565b50611f74929150611fb3565b5090565b828054828255906000526020600020908101928215611f68579160200282015b82811115611f68578251825591602001919060010190611f98565b5b80821115611f745760008155600101611fb4565b600060208284031215611fda57600080fd5b81356001600160e01b03198116811461189057600080fd5b80356001600160a01b038116811461200957600080fd5b919050565b60006020828403121561202057600080fd5b61189082611ff2565b6020808252825182820181905260009190848201906040850190845b8181101561206157835183529284019291840191600101612045565b50909695505050505050565b60006020828403121561207f57600080fd5b5035919050565b6000806040838503121561209957600080fd5b823591506120a960208401611ff2565b90509250929050565b600080604083850312156120c557600080fd5b6120ce83611ff2565b91506120a960208401611ff2565b634e487b7160e01b600052604160045260246000fd5b6000806040838503121561210557600080fd5b61210e83611ff2565b9150602083013567ffffffffffffffff8082111561212b57600080fd5b818501915085601f83011261213f57600080fd5b813581811115612151576121516120dc565b604051601f8201601f19908116603f01168101908382118183101715612179576121796120dc565b8160405282815288602084870101111561219257600080fd5b8260208601602083013760006020848301015280955050505050509250929050565b6020808252825182820181905260009190848201906040850190845b818110156120615783516001600160a01b0316835292840192918401916001016121d0565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b19195b1959d85d1958d85b1b60a21b606082015260800190565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b6163746976652070726f787960a01b606082015260800190565b60006020828403121561229f57600080fd5b815160ff8116811461189057600080fd5b60005b838110156122cb5781810151838201526020016122b3565b838111156119de5750506000910152565b60208152600082518060208401526122fb8160408501602087016122b0565b601f01601f19169190910160400192915050565b7f416363657373436f6e74726f6c3a206163636f756e74200000000000000000008152600083516123478160178501602088016122b0565b7001034b99036b4b9b9b4b733903937b6329607d1b60179184019182015283516123788160288401602088016122b0565b01602801949350505050565b60006020828403121561239657600080fd5b5051919050565b634e487b7160e01b600052601160045260246000fd5b60008160001904831182151516156123cd576123cd61239d565b500290565b600082198211156123e5576123e561239d565b500190565b634e487b7160e01b600052603260045260246000fd5b60008161240f5761240f61239d565b506000190190565b6000828210156124295761242961239d565b500390565b600060ff821660ff8114156124455761244561239d565b60010192915050565b60006000198214156124625761246261239d565b5060010190565b6000825161247b8184602087016122b0565b919091019291505056fe360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775a264697066735822122074f8da3252db0223938309afe0f72f80147be381c0ce0ddb98bd21aa8e9694e164736f6c63430008090033";

type IporAssetConfigurationUsdtConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: IporAssetConfigurationUsdtConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class IporAssetConfigurationUsdt__factory extends ContractFactory {
  constructor(...args: IporAssetConfigurationUsdtConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "IporAssetConfigurationUsdt";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<IporAssetConfigurationUsdt> {
    return super.deploy(overrides || {}) as Promise<IporAssetConfigurationUsdt>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): IporAssetConfigurationUsdt {
    return super.attach(address) as IporAssetConfigurationUsdt;
  }
  connect(signer: Signer): IporAssetConfigurationUsdt__factory {
    return super.connect(signer) as IporAssetConfigurationUsdt__factory;
  }
  static readonly contractName: "IporAssetConfigurationUsdt";
  public readonly contractName: "IporAssetConfigurationUsdt";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): IporAssetConfigurationUsdtInterface {
    return new utils.Interface(_abi) as IporAssetConfigurationUsdtInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IporAssetConfigurationUsdt {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as IporAssetConfigurationUsdt;
  }
}
