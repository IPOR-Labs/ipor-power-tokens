/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export interface StrategyMockInterface extends utils.Interface {
  contractName: "StrategyMock";
  functions: {
    "apy()": FunctionFragment;
    "balance()": FunctionFragment;
    "balanceOf()": FunctionFragment;
    "beforeClaim(address[],uint256)": FunctionFragment;
    "changeOwnership(address)": FunctionFragment;
    "deposit(uint256)": FunctionFragment;
    "doClaim(address,address[])": FunctionFragment;
    "getApy()": FunctionFragment;
    "getUnderlyingToken()": FunctionFragment;
    "owner()": FunctionFragment;
    "setApy(uint256)": FunctionFragment;
    "setBalance(uint256)": FunctionFragment;
    "setShareToken(address)": FunctionFragment;
    "setUnderlyingToken(address)": FunctionFragment;
    "shareToken()": FunctionFragment;
    "shareTokens()": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "underlyingToken()": FunctionFragment;
    "withdraw(uint256)": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "apy", values?: undefined): string;
  encodeFunctionData(functionFragment: "balance", values?: undefined): string;
  encodeFunctionData(functionFragment: "balanceOf", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "beforeClaim",
    values: [string[], BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "changeOwnership",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "deposit",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "doClaim",
    values: [string, string[]]
  ): string;
  encodeFunctionData(functionFragment: "getApy", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "getUnderlyingToken",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "setApy",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setBalance",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setShareToken",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "setUnderlyingToken",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "shareToken",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "shareTokens",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "underlyingToken",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "apy", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "balance", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "beforeClaim",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "changeOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "deposit", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "doClaim", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getApy", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getUnderlyingToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setApy", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setBalance", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setShareToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setUnderlyingToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "shareToken", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "shareTokens",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "underlyingToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;

  events: {};
}

export interface StrategyMock extends BaseContract {
  contractName: "StrategyMock";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: StrategyMockInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    apy(overrides?: CallOverrides): Promise<[BigNumber]>;

    "apy()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    balance(overrides?: CallOverrides): Promise<[BigNumber]>;

    "balance()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    balanceOf(overrides?: CallOverrides): Promise<[BigNumber]>;

    "balanceOf()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    beforeClaim(
      assets: string[],
      _amount: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "beforeClaim(address[],uint256)"(
      assets: string[],
      _amount: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    changeOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "changeOwnership(address)"(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    deposit(
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "deposit(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    doClaim(
      vault: string,
      assets: string[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "doClaim(address,address[])"(
      vault: string,
      assets: string[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getApy(overrides?: CallOverrides): Promise<[BigNumber]>;

    "getApy()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    getUnderlyingToken(overrides?: CallOverrides): Promise<[string]>;

    "getUnderlyingToken()"(overrides?: CallOverrides): Promise<[string]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    "owner()"(overrides?: CallOverrides): Promise<[string]>;

    setApy(
      _apy: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "setApy(uint256)"(
      _apy: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setBalance(
      _balance: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "setBalance(uint256)"(
      _balance: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setShareToken(
      _shareToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "setShareToken(address)"(
      _shareToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setUnderlyingToken(
      _underlyingToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "setUnderlyingToken(address)"(
      _underlyingToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    shareToken(overrides?: CallOverrides): Promise<[string]>;

    "shareToken()"(overrides?: CallOverrides): Promise<[string]>;

    shareTokens(overrides?: CallOverrides): Promise<[string]>;

    "shareTokens()"(overrides?: CallOverrides): Promise<[string]>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "transferOwnership(address)"(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    underlyingToken(overrides?: CallOverrides): Promise<[string]>;

    "underlyingToken()"(overrides?: CallOverrides): Promise<[string]>;

    withdraw(
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "withdraw(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  apy(overrides?: CallOverrides): Promise<BigNumber>;

  "apy()"(overrides?: CallOverrides): Promise<BigNumber>;

  balance(overrides?: CallOverrides): Promise<BigNumber>;

  "balance()"(overrides?: CallOverrides): Promise<BigNumber>;

  balanceOf(overrides?: CallOverrides): Promise<BigNumber>;

  "balanceOf()"(overrides?: CallOverrides): Promise<BigNumber>;

  beforeClaim(
    assets: string[],
    _amount: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "beforeClaim(address[],uint256)"(
    assets: string[],
    _amount: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  changeOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "changeOwnership(address)"(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  deposit(
    amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "deposit(uint256)"(
    amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  doClaim(
    vault: string,
    assets: string[],
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "doClaim(address,address[])"(
    vault: string,
    assets: string[],
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getApy(overrides?: CallOverrides): Promise<BigNumber>;

  "getApy()"(overrides?: CallOverrides): Promise<BigNumber>;

  getUnderlyingToken(overrides?: CallOverrides): Promise<string>;

  "getUnderlyingToken()"(overrides?: CallOverrides): Promise<string>;

  owner(overrides?: CallOverrides): Promise<string>;

  "owner()"(overrides?: CallOverrides): Promise<string>;

  setApy(
    _apy: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "setApy(uint256)"(
    _apy: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setBalance(
    _balance: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "setBalance(uint256)"(
    _balance: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setShareToken(
    _shareToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "setShareToken(address)"(
    _shareToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setUnderlyingToken(
    _underlyingToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "setUnderlyingToken(address)"(
    _underlyingToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  shareToken(overrides?: CallOverrides): Promise<string>;

  "shareToken()"(overrides?: CallOverrides): Promise<string>;

  shareTokens(overrides?: CallOverrides): Promise<string>;

  "shareTokens()"(overrides?: CallOverrides): Promise<string>;

  transferOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "transferOwnership(address)"(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  underlyingToken(overrides?: CallOverrides): Promise<string>;

  "underlyingToken()"(overrides?: CallOverrides): Promise<string>;

  withdraw(
    amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "withdraw(uint256)"(
    amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    apy(overrides?: CallOverrides): Promise<BigNumber>;

    "apy()"(overrides?: CallOverrides): Promise<BigNumber>;

    balance(overrides?: CallOverrides): Promise<BigNumber>;

    "balance()"(overrides?: CallOverrides): Promise<BigNumber>;

    balanceOf(overrides?: CallOverrides): Promise<BigNumber>;

    "balanceOf()"(overrides?: CallOverrides): Promise<BigNumber>;

    beforeClaim(
      assets: string[],
      _amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "beforeClaim(address[],uint256)"(
      assets: string[],
      _amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    changeOwnership(newOwner: string, overrides?: CallOverrides): Promise<void>;

    "changeOwnership(address)"(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;

    deposit(amount: BigNumberish, overrides?: CallOverrides): Promise<void>;

    "deposit(uint256)"(
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    doClaim(
      vault: string,
      assets: string[],
      overrides?: CallOverrides
    ): Promise<void>;

    "doClaim(address,address[])"(
      vault: string,
      assets: string[],
      overrides?: CallOverrides
    ): Promise<void>;

    getApy(overrides?: CallOverrides): Promise<BigNumber>;

    "getApy()"(overrides?: CallOverrides): Promise<BigNumber>;

    getUnderlyingToken(overrides?: CallOverrides): Promise<string>;

    "getUnderlyingToken()"(overrides?: CallOverrides): Promise<string>;

    owner(overrides?: CallOverrides): Promise<string>;

    "owner()"(overrides?: CallOverrides): Promise<string>;

    setApy(_apy: BigNumberish, overrides?: CallOverrides): Promise<void>;

    "setApy(uint256)"(
      _apy: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    setBalance(
      _balance: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "setBalance(uint256)"(
      _balance: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    setShareToken(
      _shareToken: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "setShareToken(address)"(
      _shareToken: string,
      overrides?: CallOverrides
    ): Promise<void>;

    setUnderlyingToken(
      _underlyingToken: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "setUnderlyingToken(address)"(
      _underlyingToken: string,
      overrides?: CallOverrides
    ): Promise<void>;

    shareToken(overrides?: CallOverrides): Promise<string>;

    "shareToken()"(overrides?: CallOverrides): Promise<string>;

    shareTokens(overrides?: CallOverrides): Promise<string>;

    "shareTokens()"(overrides?: CallOverrides): Promise<string>;

    transferOwnership(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "transferOwnership(address)"(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;

    underlyingToken(overrides?: CallOverrides): Promise<string>;

    "underlyingToken()"(overrides?: CallOverrides): Promise<string>;

    withdraw(amount: BigNumberish, overrides?: CallOverrides): Promise<void>;

    "withdraw(uint256)"(
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    apy(overrides?: CallOverrides): Promise<BigNumber>;

    "apy()"(overrides?: CallOverrides): Promise<BigNumber>;

    balance(overrides?: CallOverrides): Promise<BigNumber>;

    "balance()"(overrides?: CallOverrides): Promise<BigNumber>;

    balanceOf(overrides?: CallOverrides): Promise<BigNumber>;

    "balanceOf()"(overrides?: CallOverrides): Promise<BigNumber>;

    beforeClaim(
      assets: string[],
      _amount: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "beforeClaim(address[],uint256)"(
      assets: string[],
      _amount: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    changeOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "changeOwnership(address)"(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    deposit(
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "deposit(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    doClaim(
      vault: string,
      assets: string[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "doClaim(address,address[])"(
      vault: string,
      assets: string[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getApy(overrides?: CallOverrides): Promise<BigNumber>;

    "getApy()"(overrides?: CallOverrides): Promise<BigNumber>;

    getUnderlyingToken(overrides?: CallOverrides): Promise<BigNumber>;

    "getUnderlyingToken()"(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    "owner()"(overrides?: CallOverrides): Promise<BigNumber>;

    setApy(
      _apy: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "setApy(uint256)"(
      _apy: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setBalance(
      _balance: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "setBalance(uint256)"(
      _balance: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setShareToken(
      _shareToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "setShareToken(address)"(
      _shareToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setUnderlyingToken(
      _underlyingToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "setUnderlyingToken(address)"(
      _underlyingToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    shareToken(overrides?: CallOverrides): Promise<BigNumber>;

    "shareToken()"(overrides?: CallOverrides): Promise<BigNumber>;

    shareTokens(overrides?: CallOverrides): Promise<BigNumber>;

    "shareTokens()"(overrides?: CallOverrides): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "transferOwnership(address)"(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    underlyingToken(overrides?: CallOverrides): Promise<BigNumber>;

    "underlyingToken()"(overrides?: CallOverrides): Promise<BigNumber>;

    withdraw(
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "withdraw(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    apy(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "apy()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    balance(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "balance()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    balanceOf(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "balanceOf()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    beforeClaim(
      assets: string[],
      _amount: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "beforeClaim(address[],uint256)"(
      assets: string[],
      _amount: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    changeOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "changeOwnership(address)"(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    deposit(
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "deposit(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    doClaim(
      vault: string,
      assets: string[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "doClaim(address,address[])"(
      vault: string,
      assets: string[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getApy(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "getApy()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getUnderlyingToken(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getUnderlyingToken()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "owner()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    setApy(
      _apy: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "setApy(uint256)"(
      _apy: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setBalance(
      _balance: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "setBalance(uint256)"(
      _balance: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setShareToken(
      _shareToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "setShareToken(address)"(
      _shareToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setUnderlyingToken(
      _underlyingToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "setUnderlyingToken(address)"(
      _underlyingToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    shareToken(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "shareToken()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    shareTokens(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "shareTokens()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "transferOwnership(address)"(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    underlyingToken(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "underlyingToken()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    withdraw(
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "withdraw(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
