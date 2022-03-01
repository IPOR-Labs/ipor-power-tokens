/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export interface WhitePaperInterestRateModelInterface extends utils.Interface {
  contractName: "WhitePaperInterestRateModel";
  functions: {
    "baseRate()": FunctionFragment;
    "blocksPerYear()": FunctionFragment;
    "dsrPerBlock()": FunctionFragment;
    "getBorrowRate(uint256,uint256,uint256)": FunctionFragment;
    "getSupplyRate(uint256,uint256,uint256,uint256)": FunctionFragment;
    "multiplier()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "baseRate", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "blocksPerYear",
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

  decodeFunctionResult(functionFragment: "baseRate", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "blocksPerYear",
    data: BytesLike
  ): Result;
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

  events: {};
}

export interface WhitePaperInterestRateModel extends BaseContract {
  contractName: "WhitePaperInterestRateModel";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: WhitePaperInterestRateModelInterface;

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
    baseRate(overrides?: CallOverrides): Promise<[BigNumber]>;

    "baseRate()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    blocksPerYear(overrides?: CallOverrides): Promise<[BigNumber]>;

    "blocksPerYear()"(overrides?: CallOverrides): Promise<[BigNumber]>;

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
      cash: BigNumberish,
      borrows: BigNumberish,
      reserves: BigNumberish,
      reserveFactorMantissa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    "getSupplyRate(uint256,uint256,uint256,uint256)"(
      cash: BigNumberish,
      borrows: BigNumberish,
      reserves: BigNumberish,
      reserveFactorMantissa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    multiplier(overrides?: CallOverrides): Promise<[BigNumber]>;

    "multiplier()"(overrides?: CallOverrides): Promise<[BigNumber]>;
  };

  baseRate(overrides?: CallOverrides): Promise<BigNumber>;

  "baseRate()"(overrides?: CallOverrides): Promise<BigNumber>;

  blocksPerYear(overrides?: CallOverrides): Promise<BigNumber>;

  "blocksPerYear()"(overrides?: CallOverrides): Promise<BigNumber>;

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
    cash: BigNumberish,
    borrows: BigNumberish,
    reserves: BigNumberish,
    reserveFactorMantissa: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "getSupplyRate(uint256,uint256,uint256,uint256)"(
    cash: BigNumberish,
    borrows: BigNumberish,
    reserves: BigNumberish,
    reserveFactorMantissa: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  multiplier(overrides?: CallOverrides): Promise<BigNumber>;

  "multiplier()"(overrides?: CallOverrides): Promise<BigNumber>;

  callStatic: {
    baseRate(overrides?: CallOverrides): Promise<BigNumber>;

    "baseRate()"(overrides?: CallOverrides): Promise<BigNumber>;

    blocksPerYear(overrides?: CallOverrides): Promise<BigNumber>;

    "blocksPerYear()"(overrides?: CallOverrides): Promise<BigNumber>;

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
      cash: BigNumberish,
      borrows: BigNumberish,
      reserves: BigNumberish,
      reserveFactorMantissa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getSupplyRate(uint256,uint256,uint256,uint256)"(
      cash: BigNumberish,
      borrows: BigNumberish,
      reserves: BigNumberish,
      reserveFactorMantissa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    multiplier(overrides?: CallOverrides): Promise<BigNumber>;

    "multiplier()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    baseRate(overrides?: CallOverrides): Promise<BigNumber>;

    "baseRate()"(overrides?: CallOverrides): Promise<BigNumber>;

    blocksPerYear(overrides?: CallOverrides): Promise<BigNumber>;

    "blocksPerYear()"(overrides?: CallOverrides): Promise<BigNumber>;

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
      cash: BigNumberish,
      borrows: BigNumberish,
      reserves: BigNumberish,
      reserveFactorMantissa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getSupplyRate(uint256,uint256,uint256,uint256)"(
      cash: BigNumberish,
      borrows: BigNumberish,
      reserves: BigNumberish,
      reserveFactorMantissa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    multiplier(overrides?: CallOverrides): Promise<BigNumber>;

    "multiplier()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    baseRate(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "baseRate()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    blocksPerYear(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "blocksPerYear()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

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
      cash: BigNumberish,
      borrows: BigNumberish,
      reserves: BigNumberish,
      reserveFactorMantissa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getSupplyRate(uint256,uint256,uint256,uint256)"(
      cash: BigNumberish,
      borrows: BigNumberish,
      reserves: BigNumberish,
      reserveFactorMantissa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    multiplier(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "multiplier()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
