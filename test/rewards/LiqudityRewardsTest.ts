import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityRewards, IporToken, PwIporToken } from "../../types";
import { Tokens, getDeployedTokens } from "../utils/LiquidityRewardsUtils";
import {
    N1__0_18DEC,
    N1__0_6DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
} from "../utils/Constants";
import { zeroOutAddresses } from "hardhat/internal/hardhat-network/stack-traces/library-utils";

chai.use(solidity);
const { expect } = chai;

const randomAddress = "0x0B54FA10558caBBdd0D6df5b8667913C43567Bc5";

type GlobalParams = {
    aggregatePowerUp: BigNumber;
    accruedRewards: BigNumber;
    compositeMultiplierInTheBlock: BigNumber;
    compositeMultiplierCumulativeBeforeBlock: BigNumber;
    blockNumber: number;
    blockRewords: number;
};

type UserParams = {
    powerUp: BigNumber;
    compositeMultiplierCumulative: BigNumber;
    ipTokensBalance: BigNumber;
    delegatedPowerTokenBalance: BigNumber;
};

const extractGlobalParam = (value: any): GlobalParams => {
    const aggregatePowerUp = value[0];
    const accruedRewards = value[1];
    const compositeMultiplierInTheBlock = value[2];
    const compositeMultiplierCumulativeBeforeBlock = value[3];
    const blockNumber = value[4];
    const blockRewords = value[5];

    return {
        aggregatePowerUp,
        accruedRewards,
        compositeMultiplierInTheBlock,
        compositeMultiplierCumulativeBeforeBlock,
        blockNumber,
        blockRewords,
    };
};

const expectGlobalParam = (
    params: GlobalParams,
    aggregatePowerUp: BigNumber,
    accruedRewards: BigNumber,
    compositeMultiplierInTheBlock: BigNumber,
    compositeMultiplierCumulativeBeforeBlock: BigNumber,
    blockNumber: number,
    blockRewords: number
): void => {
    expect(params.aggregatePowerUp).to.be.equal(aggregatePowerUp);
    expect(params.accruedRewards).to.be.equal(accruedRewards);
    expect(params.compositeMultiplierInTheBlock).to.be.equal(compositeMultiplierInTheBlock);
    expect(params.compositeMultiplierCumulativeBeforeBlock).to.be.equal(
        compositeMultiplierCumulativeBeforeBlock
    );
    expect(params.blockNumber).to.be.equal(blockNumber);
    expect(params.blockRewords).to.be.equal(blockRewords);
};

const expectUserParam = (
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

const extractMyParam = (value: any): UserParams => {
    const powerUp = value[0];
    const compositeMultiplierCumulative = value[1];
    const ipTokensBalance = value[2];
    const delegatedPowerTokenBalance = value[3];

    return {
        powerUp,
        compositeMultiplierCumulative,
        ipTokensBalance,
        delegatedPowerTokenBalance,
    };
};

describe("LiquidityRewards Stake and balance", () => {
    let tokens: Tokens;
    let liquidityRewards: LiquidityRewards;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let iporToken: IporToken;
    let pwIporToken: PwIporToken;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const IporToken = await hre.ethers.getContractFactory("IporToken");
        iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await admin.getAddress()
        )) as IporToken;
        const PwIporToken = await hre.ethers.getContractFactory("PwIporToken");
        pwIporToken = (await upgrades.deployProxy(PwIporToken, [iporToken.address])) as PwIporToken;

        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            pwIporToken.address,
        ])) as LiquidityRewards;

        await tokens.ipTokenDai.approve(liquidityRewards.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenDai
            .connect(userOne)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenDai
            .connect(userTwo)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_18_DECIMALS);

        await tokens.ipTokenUsdc.approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdc
            .connect(userOne)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdc
            .connect(userTwo)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);

        await tokens.ipTokenUsdt.approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdt
            .connect(userOne)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdt
            .connect(userTwo)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);

        await iporToken.approve(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await pwIporToken.setLiquidityRewardsAddress(liquidityRewards.address);
    });

    it("Should setup usersParams and global params and returns 100 rewards when 100 blocks was mine", async () => {
        //    given
        const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

        const initGlobalParamResponse = await liquidityRewards.getGlobalParams(
            tokens.ipTokenDai.address
        );
        const initUserParamResponse = await liquidityRewards.getMyParams(tokens.ipTokenDai.address);
        expectGlobalParam(
            extractGlobalParam(initGlobalParamResponse),
            ZERO,
            ZERO,
            ZERO,
            ZERO,
            0,
            100000000
        );
        expectUserParam(extractMyParam(initUserParamResponse), ZERO, ZERO, ZERO, ZERO);

        await pwIporToken.stake(delegatedIporToken);
        await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);

        const afterDelegatePwTokenGPR = await liquidityRewards.getGlobalParams(
            tokens.ipTokenDai.address
        );
        const afterDelegatePwTokenUPR = await liquidityRewards.getMyParams(
            tokens.ipTokenDai.address
        );

        expectGlobalParam(
            extractGlobalParam(afterDelegatePwTokenGPR),
            ZERO,
            ZERO,
            ZERO,
            ZERO,
            0,
            100000000
        );
        expectUserParam(
            extractMyParam(afterDelegatePwTokenUPR),
            ZERO,
            ZERO,
            ZERO,
            delegatedIporToken
        );
        //    when
        await liquidityRewards.stake(tokens.ipTokenDai.address, stakedIpTokens);
        //    then
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const afterStakeIpTokensGPR = await liquidityRewards.getGlobalParams(
            tokens.ipTokenDai.address
        );
        const afterStakeIpTokensUPR = await liquidityRewards.getMyParams(tokens.ipTokenDai.address);

        console.table(extractMyParam(afterStakeIpTokensUPR));
        console.log(extractMyParam(afterStakeIpTokensUPR).powerUp.toString());
        console.log(extractMyParam(afterStakeIpTokensUPR).compositeMultiplierCumulative.toString());
        console.log(extractMyParam(afterStakeIpTokensUPR).ipTokensBalance.toString());
        console.log(extractMyParam(afterStakeIpTokensUPR).delegatedPowerTokenBalance.toString());
        console.table(extractGlobalParam(afterStakeIpTokensGPR));
        console.log(extractGlobalParam(afterStakeIpTokensGPR).aggregatePowerUp.toString());
        console.log(extractGlobalParam(afterStakeIpTokensGPR).accruedRewards.toString());
        console.log(
            extractGlobalParam(afterStakeIpTokensGPR).compositeMultiplierInTheBlock.toString()
        );

        const rewards = await liquidityRewards.calculateUserRewards(tokens.ipTokenDai.address);
        console.log(rewards.toString());
    });
});
