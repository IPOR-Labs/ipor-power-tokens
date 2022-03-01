/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export interface AaveStableDebtTokenMockInterface extends utils.Interface {
  contractName: "AaveStableDebtTokenMock";
  functions: {
    "avgStableRate()": FunctionFragment;
    "getTotalSupplyAndAvgRate()": FunctionFragment;
    "totalStableDebt()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "avgStableRate",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getTotalSupplyAndAvgRate",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "totalStableDebt",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "avgStableRate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getTotalSupplyAndAvgRate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "totalStableDebt",
    data: BytesLike
  ): Result;

  events: {};
}

export interface AaveStableDebtTokenMock extends BaseContract {
  contractName: "AaveStableDebtTokenMock";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: AaveStableDebtTokenMockInterface;

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
    avgStableRate(overrides?: CallOverrides): Promise<[BigNumber]>;

    "avgStableRate()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    getTotalSupplyAndAvgRate(
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber]>;

    "getTotalSupplyAndAvgRate()"(
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber]>;

    totalStableDebt(overrides?: CallOverrides): Promise<[BigNumber]>;

    "totalStableDebt()"(overrides?: CallOverrides): Promise<[BigNumber]>;
  };

  avgStableRate(overrides?: CallOverrides): Promise<BigNumber>;

  "avgStableRate()"(overrides?: CallOverrides): Promise<BigNumber>;

  getTotalSupplyAndAvgRate(
    overrides?: CallOverrides
  ): Promise<[BigNumber, BigNumber]>;

  "getTotalSupplyAndAvgRate()"(
    overrides?: CallOverrides
  ): Promise<[BigNumber, BigNumber]>;

  totalStableDebt(overrides?: CallOverrides): Promise<BigNumber>;

  "totalStableDebt()"(overrides?: CallOverrides): Promise<BigNumber>;

  callStatic: {
    avgStableRate(overrides?: CallOverrides): Promise<BigNumber>;

    "avgStableRate()"(overrides?: CallOverrides): Promise<BigNumber>;

    getTotalSupplyAndAvgRate(
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber]>;

    "getTotalSupplyAndAvgRate()"(
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber]>;

    totalStableDebt(overrides?: CallOverrides): Promise<BigNumber>;

    "totalStableDebt()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    avgStableRate(overrides?: CallOverrides): Promise<BigNumber>;

    "avgStableRate()"(overrides?: CallOverrides): Promise<BigNumber>;

    getTotalSupplyAndAvgRate(overrides?: CallOverrides): Promise<BigNumber>;

    "getTotalSupplyAndAvgRate()"(overrides?: CallOverrides): Promise<BigNumber>;

    totalStableDebt(overrides?: CallOverrides): Promise<BigNumber>;

    "totalStableDebt()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    avgStableRate(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "avgStableRate()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getTotalSupplyAndAvgRate(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getTotalSupplyAndAvgRate()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    totalStableDebt(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "totalStableDebt()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
