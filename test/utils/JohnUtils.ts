import hre from "hardhat";
import { BigNumber, Signer } from "ethers";
import chai from "chai";

import { MockTestnetTokenDai, MockTestnetTokenUsdc, MockTestnetTokenUsdt, IpToken } from "../../types";

import {
    USD_1_000_000,
    TOTAL_SUPPLY_6_DECIMALS,
    TOTAL_SUPPLY_18_DECIMALS,
    N1__0_18DEC,
    N1__0_6DEC,
} from "./Constants";

const { expect } = chai;

export type Tokens = {
    tokenDai: MockTestnetTokenDai;
    tokenUsdc: MockTestnetTokenUsdc;
    tokenUsdt: MockTestnetTokenUsdt;
    ipTokenDai: IpToken;
    ipTokenUsdc: IpToken;
    ipTokenUsdt: IpToken;
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
    ipTokenBalance: BigNumber;
    delegatedPowerTokenBalance: BigNumber;
};

export const getDeployedTokens = async (accounts: Signer[]): Promise<Tokens> => {
    const [admin, userOne, userTwo, userThree] = accounts;
    const MockTestnetTokenUsdt = await hre.ethers.getContractFactory("MockTestnetTokenUsdt");
    const MockTestnetTokenUsdc = await hre.ethers.getContractFactory("MockTestnetTokenUsdc");
    const MockTestnetTokenDai = await hre.ethers.getContractFactory("MockTestnetTokenDai");
    const IpToken = await hre.ethers.getContractFactory("MockIpToken");

    const tokenDai = (await MockTestnetTokenDai.deploy(TOTAL_SUPPLY_18_DECIMALS)) as MockTestnetTokenDai;
    await tokenDai.deployed();

    const tokenUsdc = (await MockTestnetTokenUsdc.deploy(TOTAL_SUPPLY_6_DECIMALS)) as MockTestnetTokenUsdc;
    await tokenUsdc.deployed();

    const tokenUsdt = (await MockTestnetTokenUsdt.deploy(TOTAL_SUPPLY_6_DECIMALS)) as MockTestnetTokenUsdt;
    await tokenUsdt.deployed();

    const ipTokenDai = (await IpToken.deploy("IP Dai", "ipDAI", tokenDai.address)) as IpToken;
    const ipTokenUsdc = (await IpToken.deploy("IP USDC", "ipUSDC", tokenUsdc.address)) as IpToken;
    const ipTokenUsdt = (await IpToken.deploy("IP USDT", "ipUSDT", tokenUsdt.address)) as IpToken;

    await ipTokenDai.setJoseph(await admin.getAddress());
    await ipTokenUsdc.setJoseph(await admin.getAddress());
    await ipTokenUsdt.setJoseph(await admin.getAddress());

    await ipTokenDai.mint(await admin.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await ipTokenUsdc.mint(await admin.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await ipTokenUsdt.mint(await admin.getAddress(), N1__0_18DEC.mul(USD_1_000_000));

    await ipTokenDai.mint(await userOne.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await ipTokenUsdc.mint(await userOne.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await ipTokenUsdt.mint(await userOne.getAddress(), N1__0_18DEC.mul(USD_1_000_000));

    await ipTokenDai.mint(await userTwo.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await ipTokenUsdc.mint(await userTwo.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await ipTokenUsdt.mint(await userTwo.getAddress(), N1__0_18DEC.mul(USD_1_000_000));

    await ipTokenDai.mint(await userThree.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await ipTokenUsdc.mint(await userThree.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await ipTokenUsdt.mint(await userThree.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    return {
        tokenDai,
        tokenUsdc,
        tokenUsdt,
        ipTokenDai,
        ipTokenUsdc,
        ipTokenUsdt,
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
    ipTokenBalance: BigNumber,
    delegatedPowerTokenBalance: BigNumber
): void => {
    expect(params.powerUp).to.be.equal(powerUp);
    expect(params.compositeMultiplierCumulativePrevBlock).to.be.equal(
        compositeMultiplierCumulativePrevBlock
    );
    expect(params.ipTokenBalance).to.be.equal(ipTokenBalance);
    expect(params.delegatedPowerTokenBalance).to.be.equal(delegatedPowerTokenBalance);
};

export const extractAccountIndicators = (value: any): UserParams => {
    const powerUp = value[2];
    const compositeMultiplierCumulativePrevBlock = value[0];
    const ipTokenBalance = value[1];
    const delegatedPowerTokenBalance = value[3];

    return {
        powerUp,
        compositeMultiplierCumulativePrevBlock,
        ipTokenBalance,
        delegatedPowerTokenBalance,
    };
};
