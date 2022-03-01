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

export interface AaveInterestRateStrategyInterface extends utils.Interface {
  contractName: "AaveInterestRateStrategy";
  functions: {
    "calculateInterestRates(address,uint256,uint256,uint256,uint256)": FunctionFragment;
    "getBaseVariableBorrowRate()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "calculateInterestRates",
    values: [string, BigNumberish, BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getBaseVariableBorrowRate",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "calculateInterestRates",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getBaseVariableBorrowRate",
    data: BytesLike
  ): Result;

  events: {};
}

export interface AaveInterestRateStrategy extends BaseContract {
  contractName: "AaveInterestRateStrategy";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: AaveInterestRateStrategyInterface;

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
    calculateInterestRates(
      _reserve: string,
      _utilizationRate: BigNumberish,
      _totalBorrowsStable: BigNumberish,
      _totalBorrowsVariable: BigNumberish,
      _averageStableBorrowRate: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        liquidityRate: BigNumber;
        stableBorrowRate: BigNumber;
        variableBorrowRate: BigNumber;
      }
    >;

    "calculateInterestRates(address,uint256,uint256,uint256,uint256)"(
      _reserve: string,
      _utilizationRate: BigNumberish,
      _totalBorrowsStable: BigNumberish,
      _totalBorrowsVariable: BigNumberish,
      _averageStableBorrowRate: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        liquidityRate: BigNumber;
        stableBorrowRate: BigNumber;
        variableBorrowRate: BigNumber;
      }
    >;

    getBaseVariableBorrowRate(overrides?: CallOverrides): Promise<[BigNumber]>;

    "getBaseVariableBorrowRate()"(
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;
  };

  calculateInterestRates(
    _reserve: string,
    _utilizationRate: BigNumberish,
    _totalBorrowsStable: BigNumberish,
    _totalBorrowsVariable: BigNumberish,
    _averageStableBorrowRate: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, BigNumber] & {
      liquidityRate: BigNumber;
      stableBorrowRate: BigNumber;
      variableBorrowRate: BigNumber;
    }
  >;

  "calculateInterestRates(address,uint256,uint256,uint256,uint256)"(
    _reserve: string,
    _utilizationRate: BigNumberish,
    _totalBorrowsStable: BigNumberish,
    _totalBorrowsVariable: BigNumberish,
    _averageStableBorrowRate: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, BigNumber] & {
      liquidityRate: BigNumber;
      stableBorrowRate: BigNumber;
      variableBorrowRate: BigNumber;
    }
  >;

  getBaseVariableBorrowRate(overrides?: CallOverrides): Promise<BigNumber>;

  "getBaseVariableBorrowRate()"(overrides?: CallOverrides): Promise<BigNumber>;

  callStatic: {
    calculateInterestRates(
      _reserve: string,
      _utilizationRate: BigNumberish,
      _totalBorrowsStable: BigNumberish,
      _totalBorrowsVariable: BigNumberish,
      _averageStableBorrowRate: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        liquidityRate: BigNumber;
        stableBorrowRate: BigNumber;
        variableBorrowRate: BigNumber;
      }
    >;

    "calculateInterestRates(address,uint256,uint256,uint256,uint256)"(
      _reserve: string,
      _utilizationRate: BigNumberish,
      _totalBorrowsStable: BigNumberish,
      _totalBorrowsVariable: BigNumberish,
      _averageStableBorrowRate: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        liquidityRate: BigNumber;
        stableBorrowRate: BigNumber;
        variableBorrowRate: BigNumber;
      }
    >;

    getBaseVariableBorrowRate(overrides?: CallOverrides): Promise<BigNumber>;

    "getBaseVariableBorrowRate()"(
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    calculateInterestRates(
      _reserve: string,
      _utilizationRate: BigNumberish,
      _totalBorrowsStable: BigNumberish,
      _totalBorrowsVariable: BigNumberish,
      _averageStableBorrowRate: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "calculateInterestRates(address,uint256,uint256,uint256,uint256)"(
      _reserve: string,
      _utilizationRate: BigNumberish,
      _totalBorrowsStable: BigNumberish,
      _totalBorrowsVariable: BigNumberish,
      _averageStableBorrowRate: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getBaseVariableBorrowRate(overrides?: CallOverrides): Promise<BigNumber>;

    "getBaseVariableBorrowRate()"(
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    calculateInterestRates(
      _reserve: string,
      _utilizationRate: BigNumberish,
      _totalBorrowsStable: BigNumberish,
      _totalBorrowsVariable: BigNumberish,
      _averageStableBorrowRate: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "calculateInterestRates(address,uint256,uint256,uint256,uint256)"(
      _reserve: string,
      _utilizationRate: BigNumberish,
      _totalBorrowsStable: BigNumberish,
      _totalBorrowsVariable: BigNumberish,
      _averageStableBorrowRate: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getBaseVariableBorrowRate(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getBaseVariableBorrowRate()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
