import hre from "hardhat";
import { BigNumber, Signer } from "ethers";
import chai from "chai";

import { DaiMockedToken, UsdcMockedToken, UsdtMockedToken, IpToken } from "../../types";

import {
    USD_1_000_000,
    TOTAL_SUPPLY_6_DECIMALS,
    TOTAL_SUPPLY_18_DECIMALS,
    N1__0_18DEC,
    N1__0_6DEC,
} from "./Constants";

const { expect } = chai;

export type Tokens = {
    tokenDai: DaiMockedToken;
    tokenUsdc: UsdcMockedToken;
    tokenUsdt: UsdtMockedToken;
    ipTokenDai: IpToken;
    ipTokenUsdc: IpToken;
    ipTokenUsdt: IpToken;
};

export type GlobalParams = {
    aggregatePowerUp: BigNumber;
    accruedRewards: BigNumber;
    compositeMultiplierInTheBlock: BigNumber;
    compositeMultiplierCumulativeBeforeBlock: BigNumber;
    blockNumber: number;
    blockRewards: number;
};

export type UserParams = {
    powerUp: BigNumber;
    compositeMultiplierCumulative: BigNumber;
    ipTokensBalance: BigNumber;
    delegatedPowerTokenBalance: BigNumber;
};

export const getDeployedTokens = async (accounts: Signer[]): Promise<Tokens> => {
    const [admin, userOne, userTwo, userThree] = accounts;
    const UsdtMockedToken = await hre.ethers.getContractFactory("UsdtMockedToken");
    const UsdcMockedToken = await hre.ethers.getContractFactory("UsdcMockedToken");
    const DaiMockedToken = await hre.ethers.getContractFactory("DaiMockedToken");
    const IpToken = await hre.ethers.getContractFactory("IpToken");

    const tokenDai = (await DaiMockedToken.deploy(TOTAL_SUPPLY_18_DECIMALS, 18)) as DaiMockedToken;
    await tokenDai.deployed();

    const tokenUsdc = (await UsdcMockedToken.deploy(TOTAL_SUPPLY_6_DECIMALS, 6)) as UsdcMockedToken;
    await tokenUsdc.deployed();

    const tokenUsdt = (await UsdtMockedToken.deploy(TOTAL_SUPPLY_6_DECIMALS, 6)) as UsdtMockedToken;
    await tokenUsdt.deployed();

    const ipTokenDai = (await IpToken.deploy("IP Dai", "ipDAI", tokenDai.address)) as IpToken;
    const ipTokenUsdc = (await IpToken.deploy("IP USDC", "ipUSDC", tokenUsdc.address)) as IpToken;
    const ipTokenUsdt = (await IpToken.deploy("IP USDT", "ipUSDT", tokenUsdt.address)) as IpToken;

    await ipTokenDai.setJoseph(await admin.getAddress());
    await ipTokenUsdc.setJoseph(await admin.getAddress());
    await ipTokenUsdt.setJoseph(await admin.getAddress());

    await ipTokenDai.mint(await admin.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await ipTokenUsdc.mint(await admin.getAddress(), N1__0_6DEC.mul(USD_1_000_000));
    await ipTokenUsdt.mint(await admin.getAddress(), N1__0_6DEC.mul(USD_1_000_000));

    await ipTokenDai.mint(await userOne.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await ipTokenUsdc.mint(await userOne.getAddress(), N1__0_6DEC.mul(USD_1_000_000));
    await ipTokenUsdt.mint(await userOne.getAddress(), N1__0_6DEC.mul(USD_1_000_000));

    await ipTokenDai.mint(await userTwo.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await ipTokenUsdc.mint(await userTwo.getAddress(), N1__0_6DEC.mul(USD_1_000_000));
    await ipTokenUsdt.mint(await userTwo.getAddress(), N1__0_6DEC.mul(USD_1_000_000));

    await ipTokenDai.mint(await userThree.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await ipTokenUsdc.mint(await userThree.getAddress(), N1__0_6DEC.mul(USD_1_000_000));
    await ipTokenUsdt.mint(await userThree.getAddress(), N1__0_6DEC.mul(USD_1_000_000));
    return {
        tokenDai,
        tokenUsdc,
        tokenUsdt,
        ipTokenDai,
        ipTokenUsdc,
        ipTokenUsdt,
    };
};

export const extractGlobalParam = (value: any): GlobalParams => {
    const aggregatePowerUp = value[0];
    const accruedRewards = value[5];
    const compositeMultiplierInTheBlock = value[1];
    const compositeMultiplierCumulativeBeforeBlock = value[2];
    const blockNumber = value[3];
    const blockRewards = value[4];

    return {
        aggregatePowerUp,
        accruedRewards,
        compositeMultiplierInTheBlock,
        compositeMultiplierCumulativeBeforeBlock,
        blockNumber,
        blockRewards,
    };
};

export const expectGlobalParam = (
    params: GlobalParams,
    aggregatePowerUp: BigNumber,
    accruedRewards: BigNumber,
    compositeMultiplierInTheBlock: BigNumber,
    compositeMultiplierCumulativeBeforeBlock: BigNumber,
    blockNumber: number,
    blockRewards: number
): void => {
    expect(params.aggregatePowerUp).to.be.equal(aggregatePowerUp);
    expect(params.accruedRewards).to.be.equal(accruedRewards);
    expect(params.compositeMultiplierInTheBlock).to.be.equal(compositeMultiplierInTheBlock);
    expect(params.compositeMultiplierCumulativeBeforeBlock).to.be.equal(
        compositeMultiplierCumulativeBeforeBlock
    );
    if (blockNumber !== -1) {
        expect(params.blockNumber).to.be.equal(blockNumber);
    }
    expect(params.blockRewards).to.be.equal(blockRewards);
};

export const expectUserParam = (
    params: UserParams,
    powerUp: BigNumber,
    compositeMultiplierCumulative: BigNumber,
    ipTokensBalance: BigNumber,
    delegatedPowerTokenBalance: BigNumber
): void => {
    expect(params.powerUp).to.be.equal(powerUp);
    expect(params.compositeMultiplierCumulative).to.be.equal(compositeMultiplierCumulative);
    expect(params.ipTokensBalance).to.be.equal(ipTokensBalance);
    expect(params.delegatedPowerTokenBalance).to.be.equal(delegatedPowerTokenBalance);
};

export const extractMyParam = (value: any): UserParams => {
    const powerUp = value[2];
    const compositeMultiplierCumulative = value[0];
    const ipTokensBalance = value[1];
    const delegatedPowerTokenBalance = value[3];

    return {
        powerUp,
        compositeMultiplierCumulative,
        ipTokensBalance,
        delegatedPowerTokenBalance,
    };
};
