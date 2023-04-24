import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockStakedToken, PowerToken } from "../../types";
import { Tokens, getDeployedTokens } from "../utils/LiquidityMiningUtils";
import {
    N1__0_18DEC,
    N1__0_8DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
    N0__1_18DEC,
    N2__0_18DEC,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

describe("LiquidityMining rebalance", () => {
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

    it("Should rebalance indicators(one pool) and pay out rewards when 100 blocks were mint", async () => {
        //    given
        const delegatedPwTokenAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakeAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedLpTokensAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const expectedRewards = BigNumber.from("101000000000000000000");

        const userOneStakedTokenBalanceBefore = await stakedToken.balanceOf(
            await userOne.getAddress()
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        await powerToken.connect(userOne).stake(stakeAmount);

        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedPwTokenAmount]);

        const powerTokenBalanceBefore = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await liquidityMining
            .connect(userOne)
            .stake(tokens.lpTokenDai.address, stakedLpTokensAmount);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const exchangeRateBefore = await powerToken.calculateExchangeRate();

        //when
        await expect(
            liquidityMining.updateIndicators(userOne.getAddress(), [tokens.lpTokenDai.address])
        )
            .to.emit(liquidityMining, "IndicatorsUpdated")
            .withArgs(await userOne.getAddress(), tokens.lpTokenDai.address);

        //then
        const exchangeRateAfter = await powerToken.calculateExchangeRate();
        const powerTokenBalanceAfter = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());
        const userOneStakedTokenBalanceAfter = await stakedToken.balanceOf(
            await userOne.getAddress()
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );

        expect(powerTokenBalanceBefore).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(powerTokenBalanceAfter).to.be.equal(powerTokenBalanceBefore.add(expectedRewards));
        expect(userOneStakedTokenBalanceAfter).to.be.equal(
            userOneStakedTokenBalanceBefore.sub(stakeAmount)
        );
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(stakeAmount).add(expectedRewards)
        );
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(stakedLpTokensAmount)
        );
        expect(exchangeRateBefore).to.be.equal(exchangeRateAfter);
    });

    it("Should rebalance indicators(three pool) and pay out rewards when 100 blocks were mint", async () => {
        //    given
        const delegatedPwTokenAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakeAmount = N1__0_18DEC.mul(BigNumber.from("300"));
        const stakedLpTokensAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const expectedRewards = BigNumber.from("306000000000000000000");

        const userOneStakedTokenBalanceBefore = await stakedToken.balanceOf(
            await userOne.getAddress()
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        await powerToken.connect(userOne).stake(stakeAmount);

        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining(
                [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
                [delegatedPwTokenAmount, delegatedPwTokenAmount, delegatedPwTokenAmount]
            );

        const powerTokenBalanceBefore = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await liquidityMining
            .connect(userOne)
            .stake(tokens.lpTokenDai.address, stakedLpTokensAmount);
        await liquidityMining
            .connect(userOne)
            .stake(tokens.lpTokenUsdc.address, stakedLpTokensAmount);
        await liquidityMining
            .connect(userOne)
            .stake(tokens.lpTokenUsdt.address, stakedLpTokensAmount);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const exchangeRateBefore = await powerToken.calculateExchangeRate();

        //when
        await expect(
            liquidityMining.updateIndicators(userOne.getAddress(), [
                tokens.lpTokenDai.address,
                tokens.lpTokenUsdc.address,
                tokens.lpTokenUsdt.address,
            ])
        )
            .to.emit(liquidityMining, "IndicatorsUpdated")
            .withArgs(await userOne.getAddress(), tokens.lpTokenDai.address)
            .to.emit(liquidityMining, "IndicatorsUpdated")
            .withArgs(await userOne.getAddress(), tokens.lpTokenUsdc.address)
            .to.emit(liquidityMining, "IndicatorsUpdated")
            .withArgs(await userOne.getAddress(), tokens.lpTokenUsdt.address);

        //then
        const exchangeRateAfter = await powerToken.calculateExchangeRate();
        const powerTokenBalanceAfter = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());
        const userOneStakedTokenBalanceAfter = await stakedToken.balanceOf(
            await userOne.getAddress()
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );

        expect(powerTokenBalanceBefore).to.be.equal(BigNumber.from("300000000000000000000"));
        expect(powerTokenBalanceAfter).to.be.equal(powerTokenBalanceBefore.add(expectedRewards));
        expect(userOneStakedTokenBalanceAfter).to.be.equal(
            userOneStakedTokenBalanceBefore.sub(stakeAmount)
        );
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(stakeAmount).add(expectedRewards)
        );
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(stakedLpTokensAmount)
        );
        expect(exchangeRateBefore).to.be.equal(exchangeRateAfter);
    });
});
