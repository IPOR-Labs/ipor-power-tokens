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

describe("LiquidityMining claim", () => {
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

    it("Should not claim when no stake lpTokens", async () => {
        //    given
        //    when
        await expect(liquidityMining.claim(tokens.lpTokenDai.address)).to.be.revertedWith("PT_709");
    });
    it("Should not claimAllocatedPwTokens when no allocated pwTokens", async () => {
        //    given
        //    when
        await expect(liquidityMining.connect(userOne).claimAllocatedPwTokens()).to.be.revertedWith(
            "PT_709"
        );
    });

    it("Should claim rewards when 100 blocks were mint", async () => {
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
        await liquidityMining.connect(userOne).claim(tokens.lpTokenDai.address);

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

    it("Should claimAllocatedPwTokens rewards when 100 blocks were mint", async () => {
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

        await liquidityMining
            .connect(userOne)
            .unstakeAndAllocatePwTokens(tokens.lpTokenDai.address, stakeAmount);
        const allocatedTokensBefore = await liquidityMining.balanceOfAllocatedPwTokens(
            await userOne.getAddress()
        );
        //when
        await liquidityMining.connect(userOne).claimAllocatedPwTokens();
        //then
        const allocatedTokensAfter = await liquidityMining.balanceOfAllocatedPwTokens(
            await userOne.getAddress()
        );
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
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(ZERO);
        expect(exchangeRateBefore).to.be.equal(exchangeRateAfter);
        expect(allocatedTokensBefore).to.be.equal(expectedRewards);
        expect(allocatedTokensAfter).to.be.equal(ZERO);
    });

    it("Should get 100 rewards when first stake 0.1 dai and after 1 Dai, 200 blocks mint", async () => {
        //    given
        const delegatedPwTokenAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakeAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedLpTokensAmount = N0__1_18DEC;
        const expectedRewards = BigNumber.from("100000000000000000000");

        const userOneStakedTokenBalanceBefore = await stakedToken.balanceOf(
            await userOne.getAddress()
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );

        await powerToken.connect(userOne).stake(stakeAmount);

        const accountRewardsBefore = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );
        const accruedRewardsBefore = await liquidityMining
            .connect(userOne)
            .calculateAccruedRewards(tokens.lpTokenDai.address);

        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedPwTokenAmount]);

        //    when
        await liquidityMining
            .connect(userOne)
            .stake(tokens.lpTokenDai.address, stakedLpTokensAmount);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const accountRewardsMiddle = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );
        const accruedRewardsMiddle = await liquidityMining
            .connect(userOne)
            .calculateAccruedRewards(tokens.lpTokenDai.address);
        // rewards is zero no transfer to powerToken
        await liquidityMining.connect(userOne).stake(tokens.lpTokenDai.address, N1__0_18DEC);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    then
        const accountRewardsAfter = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );
        const accruedRewardsAfter = await liquidityMining
            .connect(userOne)
            .calculateAccruedRewards(tokens.lpTokenDai.address);
        const userOneStakedTokenBalanceAfter = await stakedToken.balanceOf(
            await userOne.getAddress()
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );

        expect(accountRewardsBefore).to.be.equal(ZERO);
        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(accountRewardsMiddle).to.be.equal(ZERO);
        expect(accruedRewardsMiddle).to.be.equal(ZERO);
        expect(accountRewardsAfter).to.be.equal(expectedRewards.sub(BigNumber.from(1)));
        expect(accruedRewardsAfter).to.be.equal(expectedRewards);
        expect(userOneStakedTokenBalanceAfter).to.be.equal(
            userOneStakedTokenBalanceBefore.sub(stakeAmount)
        );

        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(stakeAmount)
        );
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(N1__0_18DEC).add(N0__1_18DEC)
        );
    });

    it("Should count proper transfer rewards when one user stake lpTokens twice", async () => {
        //    given
        const delegatedPwTokenAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakeAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedLpTokensAmount = N1__0_18DEC.mul(BigNumber.from("100"));

        const expectedRewards = BigNumber.from("100000000000000000000");

        const userOneStakedTokenBalanceBefore = await stakedToken.balanceOf(
            await userOne.getAddress()
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );

        await powerToken.connect(userOne).stake(delegatedPwTokenAmount);
        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [stakeAmount]);

        const powerTokenBalanceBefore = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        // when
        await liquidityMining
            .connect(userOne)
            .stake(tokens.lpTokenDai.address, stakedLpTokensAmount);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const powerTokenBalanceAfter1Stake = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        const rewardsAfterFirstStake = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );

        await liquidityMining
            .connect(userOne)
            .stake(tokens.lpTokenDai.address, stakedLpTokensAmount);

        //    then
        const powerTokenBalanceAfter2Stake = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        const rewardsAfterSecondStake = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );

        const userOneStakedTokenBalanceAfter = await stakedToken.balanceOf(
            await userOne.getAddress()
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );

        expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(rewardsAfterSecondStake).to.be.equal(ZERO);

        expect(powerTokenBalanceBefore).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(powerTokenBalanceAfter1Stake).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(powerTokenBalanceAfter2Stake).to.be.equal(BigNumber.from("201000000000000000000"));

        expect(userOneStakedTokenBalanceAfter).to.be.equal(
            userOneStakedTokenBalanceBefore.sub(stakeAmount)
        );
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(stakeAmount).add(stakeAmount).add(N1__0_18DEC)
        );
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(stakedLpTokensAmount).add(stakedLpTokensAmount)
        );
    });

    it("Should count proper rewards when one user stake Power Tokens (pwToken) twice", async () => {
        //    given
        const delegatedPwTokenAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakeAmount = N1__0_18DEC.mul(BigNumber.from("200"));
        const stakedLpTokensAmount = N1__0_18DEC.mul(BigNumber.from("100"));

        const expectedRewards = BigNumber.from("100000000000000000000");

        const userOneStakedTokenBalanceBefore = await stakedToken.balanceOf(
            await userOne.getAddress()
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );

        //    when
        await powerToken.connect(userOne).stake(stakeAmount);

        const powerTokenBalanceBefore = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await liquidityMining
            .connect(userOne)
            .stake(tokens.lpTokenDai.address, stakedLpTokensAmount);
        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedPwTokenAmount]);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const powerTokenBalanceAfter1Stake = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());
        const rewardsAfterFirstStake = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );

        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedPwTokenAmount]);

        const rewardsAfterSecondStake = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );

        //    then
        const powerTokenBalanceAfter2Stake = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        const userOneStakedTokenBalanceAfter = await stakedToken.balanceOf(
            await userOne.getAddress()
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );

        expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(rewardsAfterSecondStake).to.be.equal(ZERO);

        expect(powerTokenBalanceBefore).to.be.equal(BigNumber.from("200000000000000000000"));
        // 1 transfer when first delegateToLiquidityMining
        expect(powerTokenBalanceAfter1Stake).to.be.equal(BigNumber.from("201000000000000000000"));
        // 100 transfer after second delegateToLiquidityMining
        expect(powerTokenBalanceAfter2Stake).to.be.equal(BigNumber.from("302000000000000000000"));

        expect(userOneStakedTokenBalanceAfter).to.be.equal(
            userOneStakedTokenBalanceBefore.sub(stakeAmount)
        );
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore
                .add(stakeAmount)
                .add(expectedRewards)
                .add(N2__0_18DEC)
        );
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(stakedLpTokensAmount)
        );
    });

    it("Should count proper rewards when one user stake Power Tokens (pwToken) twice and lpAsset was removed", async () => {
        //    given
        const delegatedPwTokenAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakeAmount = N1__0_18DEC.mul(BigNumber.from("200"));
        const stakedLpTokensAmount = N1__0_18DEC.mul(BigNumber.from("100"));

        const expectedRewards = BigNumber.from("100000000000000000000");

        const userOneStakedTokenBalanceBefore = await stakedToken.balanceOf(
            await userOne.getAddress()
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );

        //    when
        await powerToken.connect(userOne).stake(stakeAmount);

        const powerTokenBalanceBefore = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await liquidityMining
            .connect(userOne)
            .stake(tokens.lpTokenDai.address, stakedLpTokensAmount);
        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedPwTokenAmount]);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const powerTokenBalanceAfter1Stake = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());
        const rewardsAfterFirstStake = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );

        await liquidityMining.removeLpTokenAsset(tokens.lpTokenDai.address);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const rewardsAfterRemoveLpToken = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );
        await liquidityMining.addLpTokenAsset(tokens.lpTokenDai.address);
        const rewardsAfterAddLpToken = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );

        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedPwTokenAmount]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const rewardsAfterSecondStake = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );

        //    then
        const powerTokenBalanceAfter2Stake = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        const userOneStakedTokenBalanceAfter = await stakedToken.balanceOf(
            await userOne.getAddress()
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );

        expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(rewardsAfterSecondStake).to.be.equal(ZERO);

        expect(powerTokenBalanceBefore).to.be.equal(BigNumber.from("200000000000000000000"));
        // 1 transfer when first delegateToLiquidityMining
        expect(powerTokenBalanceAfter1Stake).to.be.equal(BigNumber.from("201000000000000000000"));
        // 100 transfer after second delegateToLiquidityMining
        expect(powerTokenBalanceAfter2Stake).to.be.equal(BigNumber.from("302000000000000000000"));

        expect(userOneStakedTokenBalanceAfter).to.be.equal(
            userOneStakedTokenBalanceBefore.sub(stakeAmount)
        );
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore
                .add(stakeAmount)
                .add(expectedRewards)
                .add(N2__0_18DEC)
        );
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(stakedLpTokensAmount)
        );

        expect(rewardsAfterFirstStake).to.be.equal(N1__0_18DEC.mul(BigNumber.from("100")));
        expect(rewardsAfterRemoveLpToken).to.be.equal(N1__0_18DEC.mul(BigNumber.from("101")));
        expect(rewardsAfterAddLpToken).to.be.equal(N1__0_18DEC.mul(BigNumber.from("101")));
        expect(rewardsAfterSecondStake).to.be.equal(ZERO);
    });
});
