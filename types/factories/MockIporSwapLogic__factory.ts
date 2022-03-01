/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  MockIporSwapLogic,
  MockIporSwapLogicInterface,
} from "../MockIporSwapLogic";

const _abi = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "state",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "buyer",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "startingTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "endingTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "idsIndex",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "collateral",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "liquidationDepositAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "notionalAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "fixedInterestRate",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "ibtQuantity",
            type: "uint256",
          },
        ],
        internalType: "struct DataTypes.IporSwapMemory",
        name: "swap",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "closingTimestamp",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "mdIbtPrice",
        type: "uint256",
      },
    ],
    name: "calculateInterestForSwapPayFixed",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "quasiInterestFixed",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "quasiInterestFloating",
            type: "uint256",
          },
          {
            internalType: "int256",
            name: "positionValue",
            type: "int256",
          },
        ],
        internalType: "struct DataTypes.IporSwapInterest",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "state",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "buyer",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "startingTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "endingTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "idsIndex",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "collateral",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "liquidationDepositAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "notionalAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "fixedInterestRate",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "ibtQuantity",
            type: "uint256",
          },
        ],
        internalType: "struct DataTypes.IporSwapMemory",
        name: "swap",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "closingTimestamp",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "mdIbtPrice",
        type: "uint256",
      },
    ],
    name: "calculateInterestForSwapReceiveFixed",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "quasiInterestFixed",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "quasiInterestFloating",
            type: "uint256",
          },
          {
            internalType: "int256",
            name: "positionValue",
            type: "int256",
          },
        ],
        internalType: "struct DataTypes.IporSwapInterest",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "notionalAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "swapFixedInterestRate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "swapPeriodInSeconds",
        type: "uint256",
      },
    ],
    name: "calculateQuasiInterestFixed",
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
        name: "ibtQuantity",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "ibtCurrentPrice",
        type: "uint256",
      },
    ],
    name: "calculateQuasiInterestFloating",
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
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610764806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c806325cc93ed14610051578063e307fa6214610077578063e5e83f0e146100ac578063f96d0570146100bf575b600080fd5b61006461005f36600461045e565b6100d2565b6040519081526020015b60405180910390f35b61008a6100853660046104d4565b6100e5565b604080518251815260208084015190820152918101519082015260600161006e565b6100646100ba36600461058d565b61011c565b61008a6100cd3660046104d4565b610129565b60006100de8383610158565b9392505050565b61010960405180606001604052806000815260200160008152602001600081525090565b610114848484610173565b949350505050565b60006101148484846102ac565b61014d60405180606001604052806000815260200160008152602001600081525090565b6101148484846102ed565b60006301e1338061016983856105cf565b6100de91906105cf565b61019760405180606001604052806000815260200160008152602001600081525090565b6040808501518151808301909252600782526649504f525f323560c81b60208301528410156101e25760405162461bcd60e51b81526004016101d991906105ee565b60405180910390fd5b506000846060015184111561020c57846040015185606001516102059190610643565b905061021e565b604085015161021b9085610643565b90505b6000610235866101000151876101200151846102ac565b9050600061024887610140015186610158565b90506000610286610258846103ce565b610261846103ce565b61026b919061065a565b6102816301e13380670de0b6b3a76400006105cf565b61043c565b604080516060810182529485526020850193909352918301919091525095945050505050565b6000816102b984866105cf565b6102c391906105cf565b6102d96301e13380670de0b6b3a76400006105cf565b6102e390866105cf565b6101149190610699565b61031160405180606001604052806000815260200160008152602001600081525090565b6040808501518151808301909252600782526649504f525f323560c81b60208301528410156103535760405162461bcd60e51b81526004016101d991906105ee565b506000846060015184111561037d57846040015185606001516103769190610643565b905061038f565b604085015161038c9085610643565b90505b60006103a6866101000151876101200151846102ac565b905060006103b987610140015186610158565b905060006102866103c9836103ce565b610261855b60006001600160ff1b038211156104385760405162461bcd60e51b815260206004820152602860248201527f53616665436173743a2076616c756520646f65736e27742066697420696e2061604482015267371034b73a191a9b60c11b60648201526084016101d9565b5090565b60008161044a6002826106b1565b61045490856106ed565b6100de91906106b1565b6000806040838503121561047157600080fd5b50508035926020909101359150565b604051610160810167ffffffffffffffff811182821017156104b257634e487b7160e01b600052604160045260246000fd5b60405290565b80356001600160a01b03811681146104cf57600080fd5b919050565b60008060008385036101a08112156104eb57600080fd5b610160808212156104fb57600080fd5b610503610480565b915085358252610515602087016104b8565b602083015260408681013590830152606080870135908301526080808701359083015260a0808701359083015260c0808701359083015260e080870135908301526101008087013590830152610120808701359083015261014080870135908301529096908501359550610180909401359392505050565b6000806000606084860312156105a257600080fd5b505081359360208301359350604090920135919050565b634e487b7160e01b600052601160045260246000fd5b60008160001904831182151516156105e9576105e96105b9565b500290565b600060208083528351808285015260005b8181101561061b578581018301518582016040015282016105ff565b8181111561062d576000604083870101525b50601f01601f1916929092016040019392505050565b600082821015610655576106556105b9565b500390565b60008083128015600160ff1b850184121615610678576106786105b9565b6001600160ff1b0384018313811615610693576106936105b9565b50500390565b600082198211156106ac576106ac6105b9565b500190565b6000826106ce57634e487b7160e01b600052601260045260246000fd5b600160ff1b8214600019841416156106e8576106e86105b9565b500590565b600080821280156001600160ff1b038490038513161561070f5761070f6105b9565b600160ff1b8390038412811615610728576107286105b9565b5050019056fea264697066735822122080dec665d8feb547ca11c70d64a3b2bce584fbd19c0d48a476e89c65acc2f13164736f6c63430008090033";

type MockIporSwapLogicConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MockIporSwapLogicConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MockIporSwapLogic__factory extends ContractFactory {
  constructor(...args: MockIporSwapLogicConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "MockIporSwapLogic";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<MockIporSwapLogic> {
    return super.deploy(overrides || {}) as Promise<MockIporSwapLogic>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): MockIporSwapLogic {
    return super.attach(address) as MockIporSwapLogic;
  }
  connect(signer: Signer): MockIporSwapLogic__factory {
    return super.connect(signer) as MockIporSwapLogic__factory;
  }
  static readonly contractName: "MockIporSwapLogic";
  public readonly contractName: "MockIporSwapLogic";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MockIporSwapLogicInterface {
    return new utils.Interface(_abi) as MockIporSwapLogicInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MockIporSwapLogic {
    return new Contract(address, _abi, signerOrProvider) as MockIporSwapLogic;
  }
}
