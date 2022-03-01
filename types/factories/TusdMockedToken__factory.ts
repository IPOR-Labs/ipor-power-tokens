/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  Overrides,
  BigNumberish,
} from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  TusdMockedToken,
  TusdMockedTokenInterface,
} from "../TusdMockedToken";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "initialSupply",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "decimals",
        type: "uint8",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
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
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
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
    name: "balanceOf",
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
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
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
      {
        internalType: "uint256",
        name: "initialAmount",
        type: "uint256",
      },
    ],
    name: "setupInitialAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
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
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b5060405162000e7a38038062000e7a83398101604081905262000034916200025f565b6040518060400160405280600b81526020016a135bd8dad95908151554d160aa1b81525060405180604001604052806004815260200163151554d160e21b81525083838383816003908051906020019062000091929190620001b9565b508051620000a7906004906020840190620001b9565b50506005805460ff191660ff841617905550620000c53383620000d1565b505050505050620002fb565b6001600160a01b0382166200012c5760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640160405180910390fd5b806002600082825462000140919062000297565b90915550506001600160a01b038216600090815260208190526040812080548392906200016f90849062000297565b90915550506040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b828054620001c790620002be565b90600052602060002090601f016020900481019282620001eb576000855562000236565b82601f106200020657805160ff191683800117855562000236565b8280016001018555821562000236579182015b828111156200023657825182559160200191906001019062000219565b506200024492915062000248565b5090565b5b8082111562000244576000815560010162000249565b600080604083850312156200027357600080fd5b82519150602083015160ff811681146200028c57600080fd5b809150509250929050565b60008219821115620002b957634e487b7160e01b600052601160045260246000fd5b500190565b600181811c90821680620002d357607f821691505b60208210811415620002f557634e487b7160e01b600052602260045260246000fd5b50919050565b610b6f806200030b6000396000f3fe608060405234801561001057600080fd5b50600436106100b45760003560e01c806370a082311161007157806370a082311461014757806395d89b4114610170578063a457c2d714610178578063a9059cbb1461018b578063b0811bbf1461019e578063dd62ed3e146101b357600080fd5b806306fdde03146100b9578063095ea7b3146100d757806318160ddd146100fa57806323b872dd1461010c578063313ce5671461011f5780633950935114610134575b600080fd5b6100c16101ec565b6040516100ce919061098d565b60405180910390f35b6100ea6100e53660046109fe565b61027e565b60405190151581526020016100ce565b6002545b6040519081526020016100ce565b6100ea61011a366004610a28565b610296565b60055460405160ff90911681526020016100ce565b6100ea6101423660046109fe565b6102ba565b6100fe610155366004610a64565b6001600160a01b031660009081526020819052604090205490565b6100c16102f9565b6100ea6101863660046109fe565b610308565b6100ea6101993660046109fe565b61039f565b6101b16101ac3660046109fe565b6103ad565b005b6100fe6101c1366004610a86565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6060600380546101fb90610ab9565b80601f016020809104026020016040519081016040528092919081815260200182805461022790610ab9565b80156102745780601f1061024957610100808354040283529160200191610274565b820191906000526020600020905b81548152906001019060200180831161025757829003601f168201915b5050505050905090565b60003361028c8185856103e3565b5060019392505050565b6000336102a4858285610508565b6102af85858561059a565b506001949350505050565b3360008181526001602090815260408083206001600160a01b038716845290915281205490919061028c90829086906102f4908790610b0a565b6103e3565b6060600480546101fb90610ab9565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909190838110156103925760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b60648201526084015b60405180910390fd5b6102af82868684036103e3565b60003361028c81858561059a565b6103d5826103d0846001600160a01b031660009081526020819052604090205490565b610768565b6103df82826108ae565b5050565b6001600160a01b0383166104455760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b6064820152608401610389565b6001600160a01b0382166104a65760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b6064820152608401610389565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92591015b60405180910390a3505050565b6001600160a01b03838116600090815260016020908152604080832093861683529290522054600019811461059457818110156105875760405162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e63650000006044820152606401610389565b61059484848484036103e3565b50505050565b6001600160a01b0383166105fe5760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b6064820152608401610389565b6001600160a01b0382166106605760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b6064820152608401610389565b6001600160a01b038316600090815260208190526040902054818110156106d85760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b6064820152608401610389565b6001600160a01b0380851660009081526020819052604080822085850390559185168152908120805484929061070f908490610b0a565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161075b91815260200190565b60405180910390a3610594565b6001600160a01b0382166107c85760405162461bcd60e51b815260206004820152602160248201527f45524332303a206275726e2066726f6d20746865207a65726f206164647265736044820152607360f81b6064820152608401610389565b6001600160a01b0382166000908152602081905260409020548181101561083c5760405162461bcd60e51b815260206004820152602260248201527f45524332303a206275726e20616d6f756e7420657863656564732062616c616e604482015261636560f01b6064820152608401610389565b6001600160a01b038316600090815260208190526040812083830390556002805484929061086b908490610b22565b90915550506040518281526000906001600160a01b038516907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906020016104fb565b6001600160a01b0382166109045760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f2061646472657373006044820152606401610389565b80600260008282546109169190610b0a565b90915550506001600160a01b03821660009081526020819052604081208054839290610943908490610b0a565b90915550506040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b600060208083528351808285015260005b818110156109ba5785810183015185820160400152820161099e565b818111156109cc576000604083870101525b50601f01601f1916929092016040019392505050565b80356001600160a01b03811681146109f957600080fd5b919050565b60008060408385031215610a1157600080fd5b610a1a836109e2565b946020939093013593505050565b600080600060608486031215610a3d57600080fd5b610a46846109e2565b9250610a54602085016109e2565b9150604084013590509250925092565b600060208284031215610a7657600080fd5b610a7f826109e2565b9392505050565b60008060408385031215610a9957600080fd5b610aa2836109e2565b9150610ab0602084016109e2565b90509250929050565b600181811c90821680610acd57607f821691505b60208210811415610aee57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b60008219821115610b1d57610b1d610af4565b500190565b600082821015610b3457610b34610af4565b50039056fea26469706673582212208227aaae888deaa289e442a4729980ba61f99e0c8708fcc509c7dc627b9512f864736f6c63430008090033";

type TusdMockedTokenConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: TusdMockedTokenConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class TusdMockedToken__factory extends ContractFactory {
  constructor(...args: TusdMockedTokenConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "TusdMockedToken";
  }

  deploy(
    initialSupply: BigNumberish,
    decimals: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<TusdMockedToken> {
    return super.deploy(
      initialSupply,
      decimals,
      overrides || {}
    ) as Promise<TusdMockedToken>;
  }
  getDeployTransaction(
    initialSupply: BigNumberish,
    decimals: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(initialSupply, decimals, overrides || {});
  }
  attach(address: string): TusdMockedToken {
    return super.attach(address) as TusdMockedToken;
  }
  connect(signer: Signer): TusdMockedToken__factory {
    return super.connect(signer) as TusdMockedToken__factory;
  }
  static readonly contractName: "TusdMockedToken";
  public readonly contractName: "TusdMockedToken";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): TusdMockedTokenInterface {
    return new utils.Interface(_abi) as TusdMockedTokenInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): TusdMockedToken {
    return new Contract(address, _abi, signerOrProvider) as TusdMockedToken;
  }
}
