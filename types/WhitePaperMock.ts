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
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export interface WhitePaperMockInterface extends utils.Interface {
  contractName: "WhitePaperMock";
  functions: {
    "_setSupplyRate(uint256)": FunctionFragment;
    "baseRate()": FunctionFragment;
    "blocksPerYear()": FunctionFragment;
    "borrowRate()": FunctionFragment;
    "dsrPerBlock()": FunctionFragment;
    "getBorrowRate(uint256,uint256,uint256)": FunctionFragment;
    "getSupplyRate(uint256,uint256,uint256,uint256)": FunctionFragment;
    "multiplier()": FunctionFragment;
    "supplyRate()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "_setSupplyRate",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "baseRate", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "blocksPerYear",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "borrowRate",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "dsrPerBlock",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getBorrowRate",
    values: [BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getSupplyRate",
    values: [BigNumberish, BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "multiplier",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "supplyRate",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "_setSupplyRate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "baseRate", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "blocksPerYear",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "borrowRate", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "dsrPerBlock",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getBorrowRate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getSupplyRate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "multiplier", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "supplyRate", data: BytesLike): Result;

  events: {};
}

export interface WhitePaperMock extends BaseContract {
  contractName: "WhitePaperMock";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: WhitePaperMockInterface;

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
    _setSupplyRate(
      rate: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "_setSupplyRate(uint256)"(
      rate: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    baseRate(overrides?: CallOverrides): Promise<[BigNumber]>;

    "baseRate()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    blocksPerYear(overrides?: CallOverrides): Promise<[BigNumber]>;

    "blocksPerYear()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    borrowRate(overrides?: CallOverrides): Promise<[BigNumber]>;

    "borrowRate()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    dsrPerBlock(overrides?: CallOverrides): Promise<[BigNumber]>;

    "dsrPerBlock()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    getBorrowRate(
      cash: BigNumberish,
      borrows: BigNumberish,
      _reserves: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber]>;

    "getBorrowRate(uint256,uint256,uint256)"(
      cash: BigNumberish,
      borrows: BigNumberish,
      _reserves: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber]>;

    getSupplyRate(
      arg0: BigNumberish,
      arg1: BigNumberish,
      arg2: BigNumberish,
      arg3: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    "getSupplyRate(uint256,uint256,uint256,uint256)"(
      arg0: BigNumberish,
      arg1: BigNumberish,
      arg2: BigNumberish,
      arg3: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    multiplier(overrides?: CallOverrides): Promise<[BigNumber]>;

    "multiplier()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    supplyRate(overrides?: CallOverrides): Promise<[BigNumber]>;

    "supplyRate()"(overrides?: CallOverrides): Promise<[BigNumber]>;
  };

  _setSupplyRate(
    rate: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "_setSupplyRate(uint256)"(
    rate: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  baseRate(overrides?: CallOverrides): Promise<BigNumber>;

  "baseRate()"(overrides?: CallOverrides): Promise<BigNumber>;

  blocksPerYear(overrides?: CallOverrides): Promise<BigNumber>;

  "blocksPerYear()"(overrides?: CallOverrides): Promise<BigNumber>;

  borrowRate(overrides?: CallOverrides): Promise<BigNumber>;

  "borrowRate()"(overrides?: CallOverrides): Promise<BigNumber>;

  dsrPerBlock(overrides?: CallOverrides): Promise<BigNumber>;

  "dsrPerBlock()"(overrides?: CallOverrides): Promise<BigNumber>;

  getBorrowRate(
    cash: BigNumberish,
    borrows: BigNumberish,
    _reserves: BigNumberish,
    overrides?: CallOverrides
  ): Promise<[BigNumber, BigNumber]>;

  "getBorrowRate(uint256,uint256,uint256)"(
    cash: BigNumberish,
    borrows: BigNumberish,
    _reserves: BigNumberish,
    overrides?: CallOverrides
  ): Promise<[BigNumber, BigNumber]>;

  getSupplyRate(
    arg0: BigNumberish,
    arg1: BigNumberish,
    arg2: BigNumberish,
    arg3: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "getSupplyRate(uint256,uint256,uint256,uint256)"(
    arg0: BigNumberish,
    arg1: BigNumberish,
    arg2: BigNumberish,
    arg3: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  multiplier(overrides?: CallOverrides): Promise<BigNumber>;

  "multiplier()"(overrides?: CallOverrides): Promise<BigNumber>;

  supplyRate(overrides?: CallOverrides): Promise<BigNumber>;

  "supplyRate()"(overrides?: CallOverrides): Promise<BigNumber>;

  callStatic: {
    _setSupplyRate(
      rate: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "_setSupplyRate(uint256)"(
      rate: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    baseRate(overrides?: CallOverrides): Promise<BigNumber>;

    "baseRate()"(overrides?: CallOverrides): Promise<BigNumber>;

    blocksPerYear(overrides?: CallOverrides): Promise<BigNumber>;

    "blocksPerYear()"(overrides?: CallOverrides): Promise<BigNumber>;

    borrowRate(overrides?: CallOverrides): Promise<BigNumber>;

    "borrowRate()"(overrides?: CallOverrides): Promise<BigNumber>;

    dsrPerBlock(overrides?: CallOverrides): Promise<BigNumber>;

    "dsrPerBlock()"(overrides?: CallOverrides): Promise<BigNumber>;

    getBorrowRate(
      cash: BigNumberish,
      borrows: BigNumberish,
      _reserves: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber]>;

    "getBorrowRate(uint256,uint256,uint256)"(
      cash: BigNumberish,
      borrows: BigNumberish,
      _reserves: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber]>;

    getSupplyRate(
      arg0: BigNumberish,
      arg1: BigNumberish,
      arg2: BigNumberish,
      arg3: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getSupplyRate(uint256,uint256,uint256,uint256)"(
      arg0: BigNumberish,
      arg1: BigNumberish,
      arg2: BigNumberish,
      arg3: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    multiplier(overrides?: CallOverrides): Promise<BigNumber>;

    "multiplier()"(overrides?: CallOverrides): Promise<BigNumber>;

    supplyRate(overrides?: CallOverrides): Promise<BigNumber>;

    "supplyRate()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    _setSupplyRate(
      rate: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "_setSupplyRate(uint256)"(
      rate: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    baseRate(overrides?: CallOverrides): Promise<BigNumber>;

    "baseRate()"(overrides?: CallOverrides): Promise<BigNumber>;

    blocksPerYear(overrides?: CallOverrides): Promise<BigNumber>;

    "blocksPerYear()"(overrides?: CallOverrides): Promise<BigNumber>;

    borrowRate(overrides?: CallOverrides): Promise<BigNumber>;

    "borrowRate()"(overrides?: CallOverrides): Promise<BigNumber>;

    dsrPerBlock(overrides?: CallOverrides): Promise<BigNumber>;

    "dsrPerBlock()"(overrides?: CallOverrides): Promise<BigNumber>;

    getBorrowRate(
      cash: BigNumberish,
      borrows: BigNumberish,
      _reserves: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getBorrowRate(uint256,uint256,uint256)"(
      cash: BigNumberish,
      borrows: BigNumberish,
      _reserves: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getSupplyRate(
      arg0: BigNumberish,
      arg1: BigNumberish,
      arg2: BigNumberish,
      arg3: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getSupplyRate(uint256,uint256,uint256,uint256)"(
      arg0: BigNumberish,
      arg1: BigNumberish,
      arg2: BigNumberish,
      arg3: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    multiplier(overrides?: CallOverrides): Promise<BigNumber>;

    "multiplier()"(overrides?: CallOverrides): Promise<BigNumber>;

    supplyRate(overrides?: CallOverrides): Promise<BigNumber>;

    "supplyRate()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    _setSupplyRate(
      rate: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "_setSupplyRate(uint256)"(
      rate: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    baseRate(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "baseRate()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    blocksPerYear(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "blocksPerYear()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    borrowRate(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "borrowRate()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    dsrPerBlock(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "dsrPerBlock()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getBorrowRate(
      cash: BigNumberish,
      borrows: BigNumberish,
      _reserves: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getBorrowRate(uint256,uint256,uint256)"(
      cash: BigNumberish,
      borrows: BigNumberish,
      _reserves: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getSupplyRate(
      arg0: BigNumberish,
      arg1: BigNumberish,
      arg2: BigNumberish,
      arg3: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getSupplyRate(uint256,uint256,uint256,uint256)"(
      arg0: BigNumberish,
      arg1: BigNumberish,
      arg2: BigNumberish,
      arg3: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    multiplier(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "multiplier()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    supplyRate(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "supplyRate()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
