/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { AmMathMock, AmMathMockInterface } from "../AmMathMock";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "x",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "y",
        type: "uint256",
      },
    ],
    name: "division",
    outputs: [
      {
        internalType: "uint256",
        name: "z",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610118806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c8063e006805214602d575b600080fd5b603c6038366004607b565b604e565b60405190815260200160405180910390f35b600060588383605f565b9392505050565b600081606b600282609c565b6073908560bd565b60589190609c565b60008060408385031215608d57600080fd5b50508035926020909101359150565b60008260b857634e487b7160e01b600052601260045260246000fd5b500490565b6000821982111560dd57634e487b7160e01b600052601160045260246000fd5b50019056fea2646970667358221220d546a21ad01a3ea4db032b68bc14897f77654071552fc0395a5fb2c05c15674364736f6c63430008090033";

type AmMathMockConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: AmMathMockConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class AmMathMock__factory extends ContractFactory {
  constructor(...args: AmMathMockConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "AmMathMock";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<AmMathMock> {
    return super.deploy(overrides || {}) as Promise<AmMathMock>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): AmMathMock {
    return super.attach(address) as AmMathMock;
  }
  connect(signer: Signer): AmMathMock__factory {
    return super.connect(signer) as AmMathMock__factory;
  }
  static readonly contractName: "AmMathMock";
  public readonly contractName: "AmMathMock";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): AmMathMockInterface {
    return new utils.Interface(_abi) as AmMathMockInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): AmMathMock {
    return new Contract(address, _abi, signerOrProvider) as AmMathMock;
  }
}
