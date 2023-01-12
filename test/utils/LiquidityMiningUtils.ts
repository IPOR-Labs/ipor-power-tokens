import hre from "hardhat";
import { BigNumber, Signer } from "ethers";
import chai from "chai";

import { MockTokenDai, MockTokenUsdc, MockTokenUsdt, MockLpToken } from "../../types";

import {
    USD_1_000_000,
    TOTAL_SUPPLY_6_DECIMALS,
    TOTAL_SUPPLY_18_DECIMALS,
    N1__0_18DEC,
    N1__0_6DEC,
} from "./Constants";

const { expect } = chai;

export type Tokens = {
    tokenDai: MockTokenDai;
    tokenUsdc: MockTokenUsdc;
    tokenUsdt: MockTokenUsdt;
    lpTokenDai: MockLpToken;
    lpTokenUsdc: MockLpToken;
    lpTokenUsdt: MockLpToken;
};

export type GlobalIndicators = {
    aggregatedPowerUp: BigNumber;
    accruedRewards: BigNumber;
    compositeMultiplierInTheBlock: BigNumber;
    compositeMultiplierCumulativePrevBlock: BigNumber;
    blockNumber: number;
    rewardsPerBlock: number;
};

export type UserParams = {
    powerUp: BigNumber;
    compositeMultiplierCumulativePrevBlock: BigNumber;
    lpTokenBalance: BigNumber;
    delegatedPowerTokenBalance: BigNumber;
};

export const getDeployedTokens = async (accounts: Signer[]): Promise<Tokens> => {
    const [admin, userOne, userTwo, userThree] = accounts;
    const MockTokenUsdt = await hre.ethers.getContractFactory("MockTokenUsdt");
    const MockTokenUsdc = await hre.ethers.getContractFactory("MockTokenUsdc");
    const MockTokenDai = await hre.ethers.getContractFactory("MockTokenDai");
    const MockLpToken = await hre.ethers.getContractFactory("MockLpToken");

    const tokenDai = (await MockTokenDai.deploy(TOTAL_SUPPLY_18_DECIMALS)) as MockTokenDai;
    await tokenDai.deployed();

    const tokenUsdc = (await MockTokenUsdc.deploy(TOTAL_SUPPLY_6_DECIMALS)) as MockTokenUsdc;
    await tokenUsdc.deployed();

    const tokenUsdt = (await MockTokenUsdt.deploy(TOTAL_SUPPLY_6_DECIMALS)) as MockTokenUsdt;
    await tokenUsdt.deployed();

    const lpTokenDai = (await MockLpToken.deploy(
        "IP Dai",
        "ipDAI",
        tokenDai.address
    )) as MockLpToken;
    const lpTokenUsdc = (await MockLpToken.deploy(
        "IP USDC",
        "ipUSDC",
        tokenUsdc.address
    )) as MockLpToken;
    const lpTokenUsdt = (await MockLpToken.deploy(
        "IP USDT",
        "ipUSDT",
        tokenUsdt.address
    )) as MockLpToken;

    await lpTokenDai.setJoseph(await admin.getAddress());
    await lpTokenUsdc.setJoseph(await admin.getAddress());
    await lpTokenUsdt.setJoseph(await admin.getAddress());

    await lpTokenDai.mint(await admin.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await lpTokenUsdc.mint(await admin.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await lpTokenUsdt.mint(await admin.getAddress(), N1__0_18DEC.mul(USD_1_000_000));

    await lpTokenDai.mint(await userOne.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await lpTokenUsdc.mint(await userOne.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await lpTokenUsdt.mint(await userOne.getAddress(), N1__0_18DEC.mul(USD_1_000_000));

    await lpTokenDai.mint(await userTwo.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await lpTokenUsdc.mint(await userTwo.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await lpTokenUsdt.mint(await userTwo.getAddress(), N1__0_18DEC.mul(USD_1_000_000));

    await lpTokenDai.mint(await userThree.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await lpTokenUsdc.mint(await userThree.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await lpTokenUsdt.mint(await userThree.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    return {
        tokenDai,
        tokenUsdc,
        tokenUsdt,
        lpTokenDai,
        lpTokenUsdc,
        lpTokenUsdt,
    };
};

export const extractGlobalIndicators = (value: any): GlobalIndicators => {
    const aggregatedPowerUp = value[0];
    const accruedRewards = value[5];
    const compositeMultiplierInTheBlock = value[1];
    const compositeMultiplierCumulativePrevBlock = value[2];
    const blockNumber = value[3];
    const rewardsPerBlock = value[4];

    return {
        aggregatedPowerUp,
        accruedRewards,
        compositeMultiplierInTheBlock,
        compositeMultiplierCumulativePrevBlock,
        blockNumber,
        rewardsPerBlock,
    };
};

export const expectGlobalIndicators = (
    params: GlobalIndicators,
    aggregatedPowerUp: BigNumber,
    accruedRewards: BigNumber,
    compositeMultiplierInTheBlock: BigNumber,
    compositeMultiplierCumulativePrevBlock: BigNumber,
    blockNumber: number,
    rewardsPerBlock: number
): void => {
    expect(params.aggregatedPowerUp).to.be.equal(aggregatedPowerUp);
    expect(params.accruedRewards).to.be.equal(accruedRewards);
    expect(params.compositeMultiplierInTheBlock).to.be.equal(compositeMultiplierInTheBlock);
    expect(params.compositeMultiplierCumulativePrevBlock).to.be.equal(
        compositeMultiplierCumulativePrevBlock
    );
    if (blockNumber !== -1) {
        expect(params.blockNumber).to.be.equal(blockNumber);
    }
    expect(params.rewardsPerBlock).to.be.equal(rewardsPerBlock);
};

export const expectAccountIndicators = (
    params: UserParams,
    powerUp: BigNumber,
    compositeMultiplierCumulativePrevBlock: BigNumber,
    lpTokenBalance: BigNumber,
    delegatedPowerTokenBalance: BigNumber
): void => {
    expect(params.powerUp).to.be.equal(powerUp);
    expect(params.compositeMultiplierCumulativePrevBlock).to.be.equal(
        compositeMultiplierCumulativePrevBlock
    );
    expect(params.lpTokenBalance).to.be.equal(lpTokenBalance);
    expect(params.delegatedPowerTokenBalance).to.be.equal(delegatedPowerTokenBalance);
};

export const extractAccountIndicators = (value: any): UserParams => {
    const powerUp = value[2];
    const compositeMultiplierCumulativePrevBlock = value[0];
    const lpTokenBalance = value[1];
    const delegatedPowerTokenBalance = value[3];

    return {
        powerUp,
        compositeMultiplierCumulativePrevBlock,
        lpTokenBalance,
        delegatedPowerTokenBalance,
    };
};
