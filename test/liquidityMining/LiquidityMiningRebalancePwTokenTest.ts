import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockIporToken, PowerIpor } from "../../types";
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

describe("LiquidityMining - Rebalance on delegate pwIpor", () => {
    let tokens: Tokens;
    let liquidityMining: LiquidityMining;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let iporToken: MockIporToken;
    let powerIpor: PowerIpor;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();

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
        await iporToken.transfer(
            liquidityMining.address,
            N1__0_18DEC.mul(BigNumber.from("100000"))
        );
        await powerIpor.setLiquidityMining(liquidityMining.address);
    });

    describe("Rebalance on stake Power Ipor Token", () => {
        it("Should setup accountIndicators and globalIndicators and returns 100 rewards when 100 blocks was mine", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const liquidityMiningIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

            const initGlobalIndicatorsResponse = await liquidityMining.getGlobalIndicators(
                tokens.ipTokenDai.address
            );
            const initUserIndicatorsResponse = await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );

            await powerIpor.stake(delegatedIporToken);
            await liquidityMining.stake(tokens.ipTokenDai.address, stakedIpTokens);

            const afterDelegatePwIporGPR = await liquidityMining.getGlobalIndicators(
                tokens.ipTokenDai.address
            );
            const afterDelegatePwIporUPR = await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );

            //    when
            await powerIpor.delegateToLiquidityMining(
                [tokens.ipTokenDai.address],
                [delegatedIporToken]
            );

            //    then
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const afterStakeIpTokensGPR = await liquidityMining.getGlobalIndicators(
                tokens.ipTokenDai.address
            );
            const afterStakeIpTokensUPR = await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );

            const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

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
                extractGlobalIndicators(afterDelegatePwIporGPR),
                BigNumber.from("39999999999999999900"),
                ZERO,
                BigNumber.from("25000000000000000062500000"),
                ZERO,
                -1,
                100000000
            );
            expectAccountIndicators(
                extractAccountIndicators(afterDelegatePwIporUPR),
                BigNumber.from("399999999999999999"),
                ZERO,
                stakedIpTokens,
                ZERO
            );

            expectGlobalIndicators(
                extractGlobalIndicators(afterStakeIpTokensGPR),
                BigNumber.from("198496250072115618100"),
                BigNumber.from("1000000000000000000"),
                BigNumber.from("5037878547512561444528052"),
                BigNumber.from("25000000000000000062500000"),
                -1,
                100000000
            );

            expectAccountIndicators(
                extractAccountIndicators(afterStakeIpTokensUPR),
                BigNumber.from("1984962500721156181"),
                BigNumber.from("25000000000000000062500000"),
                stakedIpTokens,
                delegatedIporToken
            );

            const rewards = await liquidityMining.calculateAccountRewards(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );
            expect(rewards).to.be.equal(BigNumber.from("100000000000000000000"));

            expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
                liquidityMiningIpDaiBalanceBefore.add(stakedIpTokens)
            );
            expect(powerIporIporTokenBalanceAfter).to.be.equal(
                powerIporIporTokenBalanceBefore.add(delegatedIporToken).add(N1__0_18DEC)
            );
        });

        it("Should sum of rewards for 3 account should be equal all rewards when all accounts staked ipTokens and Power Ipor Tokens ", async () => {
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
            await liquidityMining.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await powerIpor.delegateToLiquidityMining(
                [tokens.ipTokenDai.address],
                [delegatedIporToken]
            );
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserOne
            await powerIpor.connect(userOne).stake(delegatedIporToken);
            await liquidityMining.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);
            await powerIpor
                .connect(userOne)
                .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserTwo
            await powerIpor.connect(userTwo).stake(delegatedIporToken);
            await liquidityMining.connect(userTwo).stake(tokens.ipTokenDai.address, stakedIpTokens);
            await powerIpor
                .connect(userTwo)
                .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            //    then

            const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

            const rewardsAdmin = await liquidityMining.calculateAccountRewards(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );
            const rewardsUserOne = await liquidityMining.calculateAccountRewards(
                await userOne.getAddress(),
                tokens.ipTokenDai.address
            );
            const rewardsUserTwo = await liquidityMining.calculateAccountRewards(
                await userTwo.getAddress(),
                tokens.ipTokenDai.address
            );
            expect(rewardsAdmin.add(rewardsUserOne).add(rewardsUserTwo)).to.be.equal(
                BigNumber.from("305740747726576365693")
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
                    .add(BigNumber.from("1259252273423634307"))
            );
        });

        it("Should count proper rewards when one account stake pwIpor tokens twice", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            //    when
            await powerIpor.stake(delegatedIporToken.mul(BigNumber.from("2")));
            await liquidityMining.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await powerIpor.delegateToLiquidityMining(
                [tokens.ipTokenDai.address],
                [delegatedIporToken]
            );
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterFirstStake = await liquidityMining.calculateAccountRewards(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );

            await powerIpor.delegateToLiquidityMining(
                [tokens.ipTokenDai.address],
                [delegatedIporToken]
            );

            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterSecondStake = await liquidityMining.calculateAccountRewards(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );
            //    then
            expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(rewardsAfterSecondStake).to.be.equal(BigNumber.from("100000000000000000000"));
        });

        it("Should recalculate global params when block rewards changed ", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            await powerIpor.stake(delegatedIporToken.mul(BigNumber.from("2")));
            await liquidityMining.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await powerIpor.delegateToLiquidityMining(
                [tokens.ipTokenDai.address],
                [delegatedIporToken]
            );
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
                BigNumber.from("1000000000000000000"),
                BigNumber.from("5037878547512561444528052"),
                BigNumber.from("25000000000000000062500000"),
                -1,
                100000000
            );
            expectGlobalIndicators(
                globalIndicatorsAfter,
                BigNumber.from("198496250072115618100"),
                BigNumber.from("102000000000000000000"),
                ZERO,
                BigNumber.from("533825733298768705959833252"),
                -1,
                0
            );
        });
    });
});
