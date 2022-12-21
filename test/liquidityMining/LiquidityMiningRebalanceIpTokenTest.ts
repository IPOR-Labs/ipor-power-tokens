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
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;

        await liquidityMining.setRewardsPerBlock(tokens.ipTokenDai.address, N1__0_8DEC);
        await liquidityMining.setRewardsPerBlock(tokens.ipTokenUsdc.address, N1__0_8DEC);
        await liquidityMining.setRewardsPerBlock(tokens.ipTokenUsdt.address, N1__0_8DEC);

        await tokens.ipTokenDai.approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenDai
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenDai
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);

        await tokens.ipTokenUsdc.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdc
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdc
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);

        await tokens.ipTokenUsdt.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdt
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdt
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
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const liquidityMiningIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

            const initGlobalParamResponse = await liquidityMining.getGlobalIndicators(
                tokens.ipTokenDai.address
            );
            const initUserParamResponse = await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
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
                [tokens.ipTokenDai.address],
                [delegatedIporToken]
            );

            const afterDelegatePwIporGPR = await liquidityMining.getGlobalIndicators(
                tokens.ipTokenDai.address
            );
            const afterDelegatePwIporUPR = await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
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
            await liquidityMining.stake(tokens.ipTokenDai.address, stakedIpTokens);
            //    then

            const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const afterStakeIpTokensGPR = await liquidityMining.getGlobalIndicators(
                tokens.ipTokenDai.address
            );
            const afterStakeIpTokensUPR = await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );

            expectGlobalIndicators(
                extractGlobalIndicators(afterStakeIpTokensGPR),
                BigNumber.from("198496250072115618100"),
                ZERO,
                BigNumber.from("5037878547512561444528052"),
                ZERO,
                -1,
                100000000
            );

            expectAccountIndicators(
                extractAccountIndicators(afterStakeIpTokensUPR),
                BigNumber.from("1984962500721156181"),
                ZERO,
                stakedIpTokens,
                delegatedIporToken
            );

            const rewards = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );
            expect(rewards).to.be.equal(BigNumber.from("100000000000000000000"));

            expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
                liquidityMiningIpDaiBalanceBefore.add(stakedIpTokens)
            );
            expect(powerIporIporTokenBalanceAfter).to.be.equal(
                powerIporIporTokenBalanceBefore.add(delegatedIporToken)
            );
        });

        it("Should sum of rewards for 3 users should be equal all rewards when all users staked ipTokens and pwIpor tokens ", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const liquidityMiningIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

            //    when
            // Admin
            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToLiquidityMining(
                [tokens.ipTokenDai.address],
                [delegatedIporToken]
            );
            await liquidityMining.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserOne
            await powerIpor.connect(userOne).stake(delegatedIporToken);
            await powerIpor
                .connect(userOne)
                .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedIporToken]);
            await liquidityMining.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserTwo
            await powerIpor.connect(userTwo).stake(delegatedIporToken);
            await powerIpor
                .connect(userTwo)
                .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedIporToken]);
            await liquidityMining.connect(userTwo).stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            //    then

            const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

            const rewardsAdmin = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );
            const rewardsUserOne = await liquidityMining.calculateAccountRewards(
                userOneAddress,
                tokens.ipTokenDai.address
            );
            const rewardsUserTwo = await liquidityMining.calculateAccountRewards(
                userTwoAddress,
                tokens.ipTokenDai.address
            );
            expect(rewardsAdmin.add(rewardsUserOne).add(rewardsUserTwo)).to.be.equal(
                BigNumber.from("305999999999999999999")
            );

            expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
                liquidityMiningIpDaiBalanceBefore
                    .add(stakedIpTokens)
                    .add(stakedIpTokens)
                    .add(stakedIpTokens)
            );
            expect(powerIporIporTokenBalanceAfter).to.be.equal(
                powerIporIporTokenBalanceBefore
                    .add(delegatedIporToken)
                    .add(delegatedIporToken)
                    .add(delegatedIporToken)
            );
        });

        it("Should count proper rewards when one user stake ipTokens twice", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const liquidityMiningIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

            //    when
            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToLiquidityMining(
                [tokens.ipTokenDai.address],
                [delegatedIporToken]
            );
            await liquidityMining.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterFirstStake = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );

            await liquidityMining.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterSecondStake = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );
            //    then
            const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
            expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(rewardsAfterSecondStake).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
                liquidityMiningIpDaiBalanceBefore.add(stakedIpTokens).add(stakedIpTokens)
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
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));
            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToLiquidityMining(
                [tokens.ipTokenDai.address],
                [delegatedIporToken]
            );
            await liquidityMining.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const globalIndicatorsBefore = await liquidityMining.getGlobalIndicators(
                tokens.ipTokenDai.address
            );

            //    when
            await liquidityMining.setRewardsPerBlock(tokens.ipTokenDai.address, ZERO);

            // then
            const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(
                tokens.ipTokenDai.address
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
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));
            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToLiquidityMining(
                [tokens.ipTokenDai.address],
                [delegatedIporToken]
            );
            await liquidityMining.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(
                tokens.ipTokenDai.address
            );
            const accountRewardsBefore = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );

            //    when
            await liquidityMining.setRewardsPerBlock(
                tokens.ipTokenDai.address,
                BigNumber.from("200000000")
            );
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // then
            const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(
                tokens.ipTokenDai.address
            );
            const accountRewardsAfter = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );

            expect(accruedRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(accountRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(accountRewardsAfter).to.be.equal(BigNumber.from("301000000000000000000"));
            expect(accruedRewardsAfter).to.be.equal(BigNumber.from("301000000000000000000"));
        });

        it("Should propre calculate reward when block rewards decrease", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));
            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToLiquidityMining(
                [tokens.ipTokenDai.address],
                [delegatedIporToken]
            );
            await liquidityMining.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(
                tokens.ipTokenDai.address
            );
            const accountRewardsBefore = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );

            //    when
            await liquidityMining.setRewardsPerBlock(
                tokens.ipTokenDai.address,
                BigNumber.from("50000000")
            );
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // then
            const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(
                tokens.ipTokenDai.address
            );
            const accountRewardsAfter = await liquidityMining.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );

            expect(accruedRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(accountRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(accountRewardsAfter).to.be.equal(BigNumber.from("151000000000000000000"));
            expect(accruedRewardsAfter).to.be.equal(BigNumber.from("151000000000000000000"));
        });
    });
});
