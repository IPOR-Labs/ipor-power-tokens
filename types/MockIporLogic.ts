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

export declare namespace DataTypes {
  export type IPORStruct = {
    blockTimestamp: BigNumberish;
    indexValue: BigNumberish;
    quasiIbtPrice: BigNumberish;
    exponentialMovingAverage: BigNumberish;
    exponentialWeightedMovingVariance: BigNumberish;
  };

  export type IPORStructOutput = [
    number,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber
  ] & {
    blockTimestamp: number;
    indexValue: BigNumber;
    quasiIbtPrice: BigNumber;
    exponentialMovingAverage: BigNumber;
    exponentialWeightedMovingVariance: BigNumber;
  };
}

export interface MockIporLogicInterface extends utils.Interface {
  contractName: "MockIporLogic";
  functions: {
    "accrueQuasiIbtPrice((uint32,uint128,uint128,uint128,uint128),uint256)": FunctionFragment;
    "calculateExponentialMovingAverage(uint256,uint256,uint256)": FunctionFragment;
    "calculateExponentialWeightedMovingVariance(uint256,uint256,uint256,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "accrueQuasiIbtPrice",
    values: [DataTypes.IPORStruct, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "calculateExponentialMovingAverage",
    values: [BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "calculateExponentialWeightedMovingVariance",
    values: [BigNumberish, BigNumberish, BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "accrueQuasiIbtPrice",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "calculateExponentialMovingAverage",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "calculateExponentialWeightedMovingVariance",
    data: BytesLike
  ): Result;

  events: {};
}

export interface MockIporLogic extends BaseContract {
  contractName: "MockIporLogic";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: MockIporLogicInterface;

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
    accrueQuasiIbtPrice(
      ipor: DataTypes.IPORStruct,
      accrueTimestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    "accrueQuasiIbtPrice((uint32,uint128,uint128,uint128,uint128),uint256)"(
      ipor: DataTypes.IPORStruct,
      accrueTimestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    calculateExponentialMovingAverage(
      lastExponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      decayFactor: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    "calculateExponentialMovingAverage(uint256,uint256,uint256)"(
      lastExponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      decayFactor: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    calculateExponentialWeightedMovingVariance(
      lastExponentialWeightedMovingVariance: BigNumberish,
      exponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      alfa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    "calculateExponentialWeightedMovingVariance(uint256,uint256,uint256,uint256)"(
      lastExponentialWeightedMovingVariance: BigNumberish,
      exponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      alfa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;
  };

  accrueQuasiIbtPrice(
    ipor: DataTypes.IPORStruct,
    accrueTimestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "accrueQuasiIbtPrice((uint32,uint128,uint128,uint128,uint128),uint256)"(
    ipor: DataTypes.IPORStruct,
    accrueTimestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  calculateExponentialMovingAverage(
    lastExponentialMovingAverage: BigNumberish,
    indexValue: BigNumberish,
    decayFactor: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "calculateExponentialMovingAverage(uint256,uint256,uint256)"(
    lastExponentialMovingAverage: BigNumberish,
    indexValue: BigNumberish,
    decayFactor: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  calculateExponentialWeightedMovingVariance(
    lastExponentialWeightedMovingVariance: BigNumberish,
    exponentialMovingAverage: BigNumberish,
    indexValue: BigNumberish,
    alfa: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "calculateExponentialWeightedMovingVariance(uint256,uint256,uint256,uint256)"(
    lastExponentialWeightedMovingVariance: BigNumberish,
    exponentialMovingAverage: BigNumberish,
    indexValue: BigNumberish,
    alfa: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  callStatic: {
    accrueQuasiIbtPrice(
      ipor: DataTypes.IPORStruct,
      accrueTimestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "accrueQuasiIbtPrice((uint32,uint128,uint128,uint128,uint128),uint256)"(
      ipor: DataTypes.IPORStruct,
      accrueTimestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    calculateExponentialMovingAverage(
      lastExponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      decayFactor: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "calculateExponentialMovingAverage(uint256,uint256,uint256)"(
      lastExponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      decayFactor: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    calculateExponentialWeightedMovingVariance(
      lastExponentialWeightedMovingVariance: BigNumberish,
      exponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      alfa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "calculateExponentialWeightedMovingVariance(uint256,uint256,uint256,uint256)"(
      lastExponentialWeightedMovingVariance: BigNumberish,
      exponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      alfa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    accrueQuasiIbtPrice(
      ipor: DataTypes.IPORStruct,
      accrueTimestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "accrueQuasiIbtPrice((uint32,uint128,uint128,uint128,uint128),uint256)"(
      ipor: DataTypes.IPORStruct,
      accrueTimestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    calculateExponentialMovingAverage(
      lastExponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      decayFactor: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "calculateExponentialMovingAverage(uint256,uint256,uint256)"(
      lastExponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      decayFactor: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    calculateExponentialWeightedMovingVariance(
      lastExponentialWeightedMovingVariance: BigNumberish,
      exponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      alfa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "calculateExponentialWeightedMovingVariance(uint256,uint256,uint256,uint256)"(
      lastExponentialWeightedMovingVariance: BigNumberish,
      exponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      alfa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    accrueQuasiIbtPrice(
      ipor: DataTypes.IPORStruct,
      accrueTimestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "accrueQuasiIbtPrice((uint32,uint128,uint128,uint128,uint128),uint256)"(
      ipor: DataTypes.IPORStruct,
      accrueTimestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    calculateExponentialMovingAverage(
      lastExponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      decayFactor: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "calculateExponentialMovingAverage(uint256,uint256,uint256)"(
      lastExponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      decayFactor: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    calculateExponentialWeightedMovingVariance(
      lastExponentialWeightedMovingVariance: BigNumberish,
      exponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      alfa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "calculateExponentialWeightedMovingVariance(uint256,uint256,uint256,uint256)"(
      lastExponentialWeightedMovingVariance: BigNumberish,
      exponentialMovingAverage: BigNumberish,
      indexValue: BigNumberish,
      alfa: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
