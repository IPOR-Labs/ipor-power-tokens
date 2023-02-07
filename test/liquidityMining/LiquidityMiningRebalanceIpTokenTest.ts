import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockStakedToken, PowerToken } from "../../types";
import {
    Tokens,
    getDeployedTokens,
    extractGlobalIndicators,
    expectGlobalIndicators,
    expectAccountIndicators,
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

const randomAddress = "0x0B54FA10558caBBdd0D6df5b8667913C43567Bc5";

describe("LiquidityMining Stake and balance", () => {
    let tokens: Tokens;
    let liquidityMining: LiquidityMining;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let adminAddress: string, userOneAddress: string, userTwoAddress: string;
    let stakedToken: MockStakedToken;
    let powerToken: PowerToken;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();
        adminAddress = await admin.getAddress();
        userOneAddress = await userOne.getAddress();
        userTwoAddress = await userTwo.getAddress();

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
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await powerToken.setLiquidityMining(liquidityMining.address);
    });

    describe("Rebalance on stake iToken", () => {
        it("Should setup usersParams and global params and returns 100 rewards when 100 blocks was mine", async () => {
            //    given
            const delegatedStakedToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(
                powerToken.address
            );

            const initGlobalParamResponse = await liquidityMining.getGlobalIndicators(
                tokens.lpTokenDai.address
            );
            const initUserParamResponse = await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            );
            expectGlobalIndicators(
                extractGlobalIndicators(initGlobalParamResponse),
                ZERO,
                ZERO,
                ZERO,
                ZERO,
                -1,
                100000000
            );
            expectAccountIndicators(
                extractAccountIndicators(initUserParamResponse),
                ZERO,
                ZERO,
                ZERO,
                ZERO
            );

            await powerToken.stake(delegatedStakedToken);
            await powerToken.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedStakedToken]
            );

            const afterDelegatePwTokenGPR = await liquidityMining.getGlobalIndicators(
                tokens.lpTokenDai.address
            );
            const afterDelegatePwTokenUPR = await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            );

            expectGlobalIndicators(
                extractGlobalIndicators(afterDelegatePwTokenGPR),
                ZERO,
                ZERO,
                ZERO,
                ZERO,
                -1,
                100000000
            );
            expectAccountIndicators(
                extractAccountIndicators(afterDelegatePwTokenUPR),
                ZERO,
                ZERO,
                ZERO,
                delegatedStakedToken
            );
            //    when
            await liquidityMining.stake(tokens.lpTokenDai.address, stakedLpTokens);
            //    then

            const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(
                powerToken.address
            );

            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const afterStakeLpTokensGPR = await liquidityMining.getGlobalIndicators(
                tokens.lpTokenDai.address
            );
            const afterStakeLpTokensUPR = await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            );

            expectGlobalIndicators(
                extractGlobalIndicators(afterStakeLpTokensGPR),
                BigNumber.from("272192809488736234700"),
                ZERO,
                BigNumber.from("3673866337168548782569648"),
                ZERO,
                -1,
                100000000
            );

            expectAccountIndicators(
                extractAccountIndicators(afterStakeLpTokensUPR),
                BigNumber.from("2721928094887362347"),
                ZERO,
                stakedLpTokens,
                delegatedStakedToken
            );

            const rewards = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.lpTokenDai.address
            );
            expect(rewards).to.be.equal(BigNumber.from("100000000000000000000"));

            expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
                liquidityMiningIpDaiBalanceBefore.add(stakedLpTokens)
            );
            expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
                powerTokenStakedTokenBalanceBefore.add(delegatedStakedToken)
            );
        });

        it("Should sum of rewards for 3 users should be equal all rewards when all users staked lpTokens and pwToken tokens ", async () => {
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
            await powerToken.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedStakedToken]
            );
            await liquidityMining.stake(tokens.lpTokenDai.address, stakedLpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserOne
            await powerToken.connect(userOne).stake(delegatedStakedToken);
            await powerToken
                .connect(userOne)
                .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedStakedToken]);
            await liquidityMining.connect(userOne).stake(tokens.lpTokenDai.address, stakedLpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserTwo
            await powerToken.connect(userTwo).stake(delegatedStakedToken);
            await powerToken
                .connect(userTwo)
                .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedStakedToken]);
            await liquidityMining.connect(userTwo).stake(tokens.lpTokenDai.address, stakedLpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            //    then

            const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(
                powerToken.address
            );

            const rewardsAdmin = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.lpTokenDai.address
            );
            const rewardsUserOne = await liquidityMining.calculateAccountRewards(
                userOneAddress,
                tokens.lpTokenDai.address
            );
            const rewardsUserTwo = await liquidityMining.calculateAccountRewards(
                userTwoAddress,
                tokens.lpTokenDai.address
            );
            expect(rewardsAdmin.add(rewardsUserOne).add(rewardsUserTwo)).to.be.equal(
                BigNumber.from("305999999999999999999")
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
            );
        });

        it("Should count proper rewards when one user stake lpTokens twice", async () => {
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
            await powerToken.stake(delegatedStakedToken);
            await powerToken.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedStakedToken]
            );
            await liquidityMining.stake(tokens.lpTokenDai.address, stakedLpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterFirstStake = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.lpTokenDai.address
            );

            await liquidityMining.stake(tokens.lpTokenDai.address, stakedLpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterSecondStake = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.lpTokenDai.address
            );
            //    then
            const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(
                powerToken.address
            );
            expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(rewardsAfterSecondStake).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
                liquidityMiningIpDaiBalanceBefore.add(stakedLpTokens).add(stakedLpTokens)
            );
            expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
                powerTokenStakedTokenBalanceBefore
                    .add(delegatedStakedToken) // first stake + 100 block
                    .add(delegatedStakedToken) // first stake + 100 block
                    .add(N1__0_18DEC) // block with stake second time
            );
        });

        it("should not be able to set new block reward when asset not active", async () => {
            //    given
            //    when
            await expect(
                liquidityMining.setRewardsPerBlock(randomAddress, ZERO)
            ).to.be.revertedWith("PT_701");
        });

        it("Should recalculate global params when block rewards changed ", async () => {
            //    given
            const delegatedStakedToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));
            await powerToken.stake(delegatedStakedToken);
            await powerToken.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedStakedToken]
            );
            await liquidityMining.stake(tokens.lpTokenDai.address, stakedLpTokens);
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
                ZERO,
                BigNumber.from("3673866337168548782569648"),
                ZERO,
                -1,
                100000000
            );
            expectGlobalIndicators(
                globalIndicatorsAfter,
                BigNumber.from("272192809488736234700"),
                BigNumber.from("101000000000000000000"),
                ZERO,
                BigNumber.from("371060500054023427039534448"),
                -1,
                0
            );
        });

        it("Should propre calculate reward when block rewards increase", async () => {
            //    given
            const delegatedStakedToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));
            await powerToken.stake(delegatedStakedToken);
            await powerToken.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedStakedToken]
            );
            await liquidityMining.stake(tokens.lpTokenDai.address, stakedLpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(
                tokens.lpTokenDai.address
            );
            const accountRewardsBefore = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.lpTokenDai.address
            );

            //    when
            await liquidityMining.setRewardsPerBlock(
                tokens.lpTokenDai.address,
                BigNumber.from("200000000")
            );
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // then
            const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(
                tokens.lpTokenDai.address
            );
            const accountRewardsAfter = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.lpTokenDai.address
            );

            expect(accruedRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(accountRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(accountRewardsAfter).to.be.equal(BigNumber.from("301000000000000000000"));
            expect(accruedRewardsAfter).to.be.equal(BigNumber.from("301000000000000000000"));
        });

        it("Should propre calculate reward when block rewards decrease", async () => {
            //    given
            const delegatedStakedToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));
            await powerToken.stake(delegatedStakedToken);
            await powerToken.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedStakedToken]
            );
            await liquidityMining.stake(tokens.lpTokenDai.address, stakedLpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(
                tokens.lpTokenDai.address
            );
            const accountRewardsBefore = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.lpTokenDai.address
            );

            //    when
            await liquidityMining.setRewardsPerBlock(
                tokens.lpTokenDai.address,
                BigNumber.from("50000000")
            );
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // then
            const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(
                tokens.lpTokenDai.address
            );
            const accountRewardsAfter = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.lpTokenDai.address
            );

            expect(accruedRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(accountRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(accountRewardsAfter).to.be.equal(BigNumber.from("151000000000000000000"));
            expect(accruedRewardsAfter).to.be.equal(BigNumber.from("151000000000000000000"));
        });
    });
});
