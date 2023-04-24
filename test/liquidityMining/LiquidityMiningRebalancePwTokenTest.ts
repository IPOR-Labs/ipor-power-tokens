import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockStakedToken, PowerToken } from "../../types";
import {
    Tokens,
    getDeployedTokens,
    extractGlobalIndicators,
    expectAccountIndicators,
    expectGlobalIndicators,
    extractAccountIndicators,
} from "../utils/LiquidityMiningUtils";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
    N1__0_8DEC,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

describe("LiquidityMining - Rebalance on delegate pwToken", () => {
    let tokens: Tokens;
    let liquidityMining: LiquidityMining;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let stakedToken: MockStakedToken;
    let powerToken: PowerToken;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const StakedToken = await hre.ethers.getContractFactory("MockStakedToken");
        stakedToken = (await StakedToken.deploy(
            "IPOR Token",
            "IPOR",
            await admin.getAddress()
        )) as MockStakedToken;
        const PowerToken = await hre.ethers.getContractFactory("PowerToken");
        powerToken = (await upgrades.deployProxy(PowerToken, [stakedToken.address])) as PowerToken;

        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        await liquidityMining.setRewardsPerBlock(tokens.lpTokenDai.address, N1__0_8DEC);
        await liquidityMining.setRewardsPerBlock(tokens.lpTokenUsdc.address, N1__0_8DEC);
        await liquidityMining.setRewardsPerBlock(tokens.lpTokenUsdt.address, N1__0_8DEC);

        await tokens.lpTokenDai.approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.lpTokenDai
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.lpTokenDai
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);

        await tokens.lpTokenUsdc.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdc
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdc
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);

        await tokens.lpTokenUsdt.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdt
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdt
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);

        await stakedToken.approve(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await stakedToken.connect(userOne).approve(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await stakedToken.connect(userTwo).approve(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await stakedToken.transfer(
            await userOne.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await stakedToken.transfer(
            await userTwo.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await stakedToken.transfer(
            liquidityMining.address,
            N1__0_18DEC.mul(BigNumber.from("100000"))
        );
        await powerToken.setLiquidityMining(liquidityMining.address);
    });

    describe("Rebalance on stake Power Token", () => {
        it("Should setup accountIndicators and globalIndicators and returns 100 rewards when 100 blocks was mine", async () => {
            //    given
            const delegatedStakedToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(
                powerToken.address
            );

            const initGlobalIndicatorsResponse = await liquidityMining.getGlobalIndicators(
                tokens.lpTokenDai.address
            );
            const initUserIndicatorsResponse = await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            );

            await powerToken.stake(delegatedStakedToken);
            await liquidityMining.stake(tokens.lpTokenDai.address, stakedLpTokens);

            const afterDelegatePwTokenGPR = await liquidityMining.getGlobalIndicators(
                tokens.lpTokenDai.address
            );
            const afterDelegatePwTokenUPR = await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            );

            //    when
            await powerToken.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedStakedToken]
            );

            //    then
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const afterStakeLpTokensGPR = await liquidityMining.getGlobalIndicators(
                tokens.lpTokenDai.address
            );
            const afterStakeLpTokensUPR = await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            );

            const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(
                powerToken.address
            );

            expectGlobalIndicators(
                extractGlobalIndicators(initGlobalIndicatorsResponse),
                ZERO,
                ZERO,
                ZERO,
                ZERO,
                -1,
                100000000
            );
            expectAccountIndicators(
                extractAccountIndicators(initUserIndicatorsResponse),
                ZERO,
                ZERO,
                ZERO,
                ZERO
            );

            expectGlobalIndicators(
                extractGlobalIndicators(afterDelegatePwTokenGPR),
                BigNumber.from("20000000000000000000"),
                ZERO,
                BigNumber.from("50000000000000000000000000"),
                ZERO,
                -1,
                100000000
            );
            expectAccountIndicators(
                extractAccountIndicators(afterDelegatePwTokenUPR),
                BigNumber.from("200000000000000000"), // 20 * 10^18
                ZERO,
                stakedLpTokens,
                ZERO
            );

            expectGlobalIndicators(
                extractGlobalIndicators(afterStakeLpTokensGPR),
                BigNumber.from("272192809488736234700"),
                BigNumber.from("1000000000000000000"),
                BigNumber.from("3673866337168548782569648"),
                BigNumber.from("50000000000000000000000000"),
                -1,
                100000000
            );

            expectAccountIndicators(
                extractAccountIndicators(afterStakeLpTokensUPR),
                BigNumber.from("2721928094887362347"),
                BigNumber.from("50000000000000000000000000"),
                stakedLpTokens,
                delegatedStakedToken
            );

            const rewards = await liquidityMining.calculateAccountRewards(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            );
            expect(rewards).to.be.equal(BigNumber.from("100000000000000000000"));

            expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
                liquidityMiningIpDaiBalanceBefore.add(stakedLpTokens)
            );
            expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
                powerTokenStakedTokenBalanceBefore.add(delegatedStakedToken).add(N1__0_18DEC)
            );
        });

        it("Should sum of rewards for 3 account should be equal all rewards when all accounts staked lpTokens and Power Tokens ", async () => {
            //    given
            const delegatedStakedToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(
                powerToken.address
            );

            //    when
            // Admin
            await powerToken.stake(delegatedStakedToken);
            await liquidityMining.stake(tokens.lpTokenDai.address, stakedLpTokens);
            await powerToken.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedStakedToken]
            );
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserOne
            await powerToken.connect(userOne).stake(delegatedStakedToken);
            await liquidityMining.connect(userOne).stake(tokens.lpTokenDai.address, stakedLpTokens);
            await powerToken
                .connect(userOne)
                .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedStakedToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserTwo
            await powerToken.connect(userTwo).stake(delegatedStakedToken);
            await liquidityMining.connect(userTwo).stake(tokens.lpTokenDai.address, stakedLpTokens);
            await powerToken
                .connect(userTwo)
                .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedStakedToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            //    then

            const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(
                powerToken.address
            );

            const rewardsAdmin = await liquidityMining.calculateAccountRewards(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            );
            const rewardsUserOne = await liquidityMining.calculateAccountRewards(
                await userOne.getAddress(),
                tokens.lpTokenDai.address
            );
            const rewardsUserTwo = await liquidityMining.calculateAccountRewards(
                await userTwo.getAddress(),
                tokens.lpTokenDai.address
            );
            expect(rewardsAdmin.add(rewardsUserOne).add(rewardsUserTwo)).to.be.equal(
                BigNumber.from("305896115281914761667")
            );
            expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
                liquidityMiningIpDaiBalanceBefore
                    .add(stakedLpTokens)
                    .add(stakedLpTokens)
                    .add(stakedLpTokens)
            );
            expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
                powerTokenStakedTokenBalanceBefore
                    .add(delegatedStakedToken)
                    .add(delegatedStakedToken)
                    .add(delegatedStakedToken)
                    .add(BigNumber.from("1103884718085238333"))
            );
        });

        it("Should count proper rewards when one account stake pwToken tokens twice", async () => {
            //    given
            const delegatedStakedToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            //    when
            await powerToken.stake(delegatedStakedToken.mul(BigNumber.from("2")));
            await liquidityMining.stake(tokens.lpTokenDai.address, stakedLpTokens);
            await powerToken.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedStakedToken]
            );
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterFirstStake = await liquidityMining.calculateAccountRewards(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            );

            await powerToken.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedStakedToken]
            );

            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterSecondStake = await liquidityMining.calculateAccountRewards(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            );
            //    then
            expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(rewardsAfterSecondStake).to.be.equal(BigNumber.from("100000000000000000000"));
        });

        it("Should recalculate global params when block rewards changed ", async () => {
            //    given
            const delegatedStakedToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            await powerToken.stake(delegatedStakedToken.mul(BigNumber.from("2")));
            await liquidityMining.stake(tokens.lpTokenDai.address, stakedLpTokens);
            await powerToken.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedStakedToken]
            );
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const globalIndicatorsBefore = await liquidityMining.getGlobalIndicators(
                tokens.lpTokenDai.address
            );

            //    when
            await liquidityMining.setRewardsPerBlock(tokens.lpTokenDai.address, ZERO);

            // then
            const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(
                tokens.lpTokenDai.address
            );

            expectGlobalIndicators(
                globalIndicatorsBefore,
                BigNumber.from("272192809488736234700"),
                BigNumber.from("1000000000000000000"),
                BigNumber.from("3673866337168548782569648"),
                BigNumber.from("50000000000000000000000000"),
                -1,
                100000000
            );
            expectGlobalIndicators(
                globalIndicatorsAfter,
                BigNumber.from("272192809488736234700"),
                BigNumber.from("102000000000000000000"),
                ZERO,
                BigNumber.from("421060500054023427039534448"),
                -1,
                0
            );
        });
    });
});
