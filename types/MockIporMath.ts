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

export interface MockIporMathInterface extends utils.Interface {
  contractName: "MockIporMath";
  functions: {
    "absoluteValue(int256)": FunctionFragment;
    "convertToWad(uint256,uint256)": FunctionFragment;
    "convertWadToAssetDecimals(uint256,uint256)": FunctionFragment;
    "division(uint256,uint256)": FunctionFragment;
    "divisionInt(int256,int256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "absoluteValue",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "convertToWad",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "convertWadToAssetDecimals",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "division",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "divisionInt",
    values: [BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "absoluteValue",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "convertToWad",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "convertWadToAssetDecimals",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "division", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "divisionInt",
    data: BytesLike
  ): Result;

  events: {};
}

export interface MockIporMath extends BaseContract {
  contractName: "MockIporMath";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: MockIporMathInterface;

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
    absoluteValue(
      value: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    "absoluteValue(int256)"(
      value: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    convertToWad(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    "convertToWad(uint256,uint256)"(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    convertWadToAssetDecimals(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    "convertWadToAssetDecimals(uint256,uint256)"(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    division(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { z: BigNumber }>;

    "division(uint256,uint256)"(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { z: BigNumber }>;

    divisionInt(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { z: BigNumber }>;

    "divisionInt(int256,int256)"(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { z: BigNumber }>;
  };

  absoluteValue(
    value: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "absoluteValue(int256)"(
    value: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  convertToWad(
    value: BigNumberish,
    assetDecimals: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "convertToWad(uint256,uint256)"(
    value: BigNumberish,
    assetDecimals: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  convertWadToAssetDecimals(
    value: BigNumberish,
    assetDecimals: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "convertWadToAssetDecimals(uint256,uint256)"(
    value: BigNumberish,
    assetDecimals: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  division(
    x: BigNumberish,
    y: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "division(uint256,uint256)"(
    x: BigNumberish,
    y: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  divisionInt(
    x: BigNumberish,
    y: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "divisionInt(int256,int256)"(
    x: BigNumberish,
    y: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  callStatic: {
    absoluteValue(
      value: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "absoluteValue(int256)"(
      value: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    convertToWad(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "convertToWad(uint256,uint256)"(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    convertWadToAssetDecimals(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "convertWadToAssetDecimals(uint256,uint256)"(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    division(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "division(uint256,uint256)"(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    divisionInt(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "divisionInt(int256,int256)"(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    absoluteValue(
      value: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "absoluteValue(int256)"(
      value: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    convertToWad(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "convertToWad(uint256,uint256)"(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    convertWadToAssetDecimals(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "convertWadToAssetDecimals(uint256,uint256)"(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    division(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "division(uint256,uint256)"(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    divisionInt(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "divisionInt(int256,int256)"(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    absoluteValue(
      value: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "absoluteValue(int256)"(
      value: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    convertToWad(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "convertToWad(uint256,uint256)"(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    convertWadToAssetDecimals(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "convertWadToAssetDecimals(uint256,uint256)"(
      value: BigNumberish,
      assetDecimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    division(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "division(uint256,uint256)"(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    divisionInt(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "divisionInt(int256,int256)"(
      x: BigNumberish,
      y: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
