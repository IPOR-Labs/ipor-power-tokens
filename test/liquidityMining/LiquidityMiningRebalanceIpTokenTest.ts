import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockIporToken, PowerIpor } from "../../types";
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
    let iporToken: MockIporToken;
    let powerIpor: PowerIpor;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();
        adminAddress = await admin.getAddress();
        userOneAddress = await userOne.getAddress();
        userTwoAddress = await userTwo.getAddress();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const IporToken = await hre.ethers.getContractFactory("MockIporToken");
        iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await admin.getAddress()
        )) as MockIporToken;
        const PowerIpor = await hre.ethers.getContractFactory("PowerIpor");
        powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;

        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
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

        await iporToken.approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.connect(userOne).approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);

        await iporToken.connect(userTwo).approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.transfer(
            await userOne.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await iporToken.transfer(
            await userTwo.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await iporToken.transfer(liquidityMining.address, N1__0_18DEC.mul(BigNumber.from("10000")));
        await powerIpor.setLiquidityMining(liquidityMining.address);
    });

    describe("Rebalance on stake iToken", () => {
        it("Should setup usersParams and global params and returns 100 rewards when 100 blocks was mine", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

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

            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedIporToken]
            );

            const afterDelegatePwIporGPR = await liquidityMining.getGlobalIndicators(
                tokens.lpTokenDai.address
            );
            const afterDelegatePwIporUPR = await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            );

            expectGlobalIndicators(
                extractGlobalIndicators(afterDelegatePwIporGPR),
                ZERO,
                ZERO,
                ZERO,
                ZERO,
                -1,
                100000000
            );
            expectAccountIndicators(
                extractAccountIndicators(afterDelegatePwIporUPR),
                ZERO,
                ZERO,
                ZERO,
                delegatedIporToken
            );
            //    when
            await liquidityMining.stake(tokens.lpTokenDai.address, stakedLpTokens);
            //    then

            const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

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
                BigNumber.from("198496250072115618100"),
                ZERO,
                BigNumber.from("5037878547512561444528052"),
                ZERO,
                -1,
                100000000
            );

            expectAccountIndicators(
                extractAccountIndicators(afterStakeLpTokensUPR),
                BigNumber.from("1984962500721156181"),
                ZERO,
                stakedLpTokens,
                delegatedIporToken
            );

            const rewards = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.lpTokenDai.address
            );
            expect(rewards).to.be.equal(BigNumber.from("100000000000000000000"));

            expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
                liquidityMiningIpDaiBalanceBefore.add(stakedLpTokens)
            );
            expect(powerIporIporTokenBalanceAfter).to.be.equal(
                powerIporIporTokenBalanceBefore.add(delegatedIporToken)
            );
        });

        it("Should sum of rewards for 3 users should be equal all rewards when all users staked lpTokens and pwIpor tokens ", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

            //    when
            // Admin
            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedIporToken]
            );
            await liquidityMining.stake(tokens.lpTokenDai.address, stakedLpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserOne
            await powerIpor.connect(userOne).stake(delegatedIporToken);
            await powerIpor
                .connect(userOne)
                .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedIporToken]);
            await liquidityMining.connect(userOne).stake(tokens.lpTokenDai.address, stakedLpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserTwo
            await powerIpor.connect(userTwo).stake(delegatedIporToken);
            await powerIpor
                .connect(userTwo)
                .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedIporToken]);
            await liquidityMining.connect(userTwo).stake(tokens.lpTokenDai.address, stakedLpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            //    then

            const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

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
            expect(powerIporIporTokenBalanceAfter).to.be.equal(
                powerIporIporTokenBalanceBefore
                    .add(delegatedIporToken)
                    .add(delegatedIporToken)
                    .add(delegatedIporToken)
            );
        });

        it("Should count proper rewards when one user stake lpTokens twice", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

            //    when
            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedIporToken]
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
            const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
            expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(rewardsAfterSecondStake).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
                liquidityMiningIpDaiBalanceBefore.add(stakedLpTokens).add(stakedLpTokens)
            );
            expect(powerIporIporTokenBalanceAfter).to.be.equal(
                powerIporIporTokenBalanceBefore
                    .add(delegatedIporToken) // first stake + 100 block
                    .add(delegatedIporToken) // first stake + 100 block
                    .add(N1__0_18DEC) // block with stake second time
            );
        });

        it("should not be able to set new block reward when asset not active", async () => {
            //    given
            //    when
            await expect(
                liquidityMining.setRewardsPerBlock(randomAddress, ZERO)
            ).to.be.revertedWith("IPOR_701");
        });

        it("Should recalculate global params when block rewards changed ", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));
            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedIporToken]
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
                BigNumber.from("198496250072115618100"),
                ZERO,
                BigNumber.from("5037878547512561444528052"),
                ZERO,
                -1,
                100000000
            );
            expectGlobalIndicators(
                globalIndicatorsAfter,
                BigNumber.from("198496250072115618100"),
                BigNumber.from("101000000000000000000"),
                ZERO,
                BigNumber.from("508825733298768705897333252"),
                -1,
                0
            );
        });

        it("Should propre calculate reward when block rewards increase", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));
            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedIporToken]
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
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));
            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatedIporToken]
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
