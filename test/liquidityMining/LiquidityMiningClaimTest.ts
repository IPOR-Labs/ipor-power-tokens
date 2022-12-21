import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockIporToken, PowerIpor } from "../../types";
import { Tokens, getDeployedTokens, extractGlobalIndicators } from "../utils/LiquidityMiningUtils";
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

    it("Should not claim when no stake ipTokens", async () => {
        //    given
        //    when
        await expect(liquidityMining.claim(tokens.ipTokenDai.address)).to.be.revertedWith(
            "IPOR_709"
        );
    });
    it("Should not claimAllocatedPwTokens when no allocated pwTokens", async () => {
        //    given
        //    when
        await expect(liquidityMining.connect(userOne).claimAllocatedPwTokens()).to.be.revertedWith(
            "IPOR_709"
        );
    });

    it("Should claim rewards when 100 blocks were mint", async () => {
        //    given
        const delegatedPwIporAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakeIporAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokensAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const expectedRewards = BigNumber.from("101000000000000000000");

        const userOneIporBalanceBefore = await iporToken.balanceOf(await userOne.getAddress());
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const liquidityMiningIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );
        await powerIpor.connect(userOne).stake(stakeIporAmount);

        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedPwIporAmount]);

        const powerIporBalanceBefore = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await liquidityMining
            .connect(userOne)
            .stake(tokens.ipTokenDai.address, stakedIpTokensAmount);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const exchangeRateBefore = await powerIpor.calculateExchangeRate();

        //when
        await liquidityMining.connect(userOne).claim(tokens.ipTokenDai.address);

        //then
        const exchangeRateAfter = await powerIpor.calculateExchangeRate();
        const powerIporBalanceAfter = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());
        const userOneIporBalanceAfter = await iporToken.balanceOf(await userOne.getAddress());
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );

        expect(powerIporBalanceBefore).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(powerIporBalanceAfter).to.be.equal(powerIporBalanceBefore.add(expectedRewards));
        expect(userOneIporBalanceAfter).to.be.equal(userOneIporBalanceBefore.sub(stakeIporAmount));
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(stakeIporAmount).add(expectedRewards)
        );
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(stakedIpTokensAmount)
        );
        expect(exchangeRateBefore).to.be.equal(exchangeRateAfter);
    });

    it("Should claimAllocatedPwTokens rewards when 100 blocks were mint", async () => {
        //    given
        const delegatedPwIporAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakeIporAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokensAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const expectedRewards = BigNumber.from("101000000000000000000");

        const userOneIporBalanceBefore = await iporToken.balanceOf(await userOne.getAddress());
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const liquidityMiningIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );
        await powerIpor.connect(userOne).stake(stakeIporAmount);

        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedPwIporAmount]);

        const powerIporBalanceBefore = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await liquidityMining
            .connect(userOne)
            .stake(tokens.ipTokenDai.address, stakedIpTokensAmount);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const exchangeRateBefore = await powerIpor.calculateExchangeRate();

        await liquidityMining
            .connect(userOne)
            .unstakeAndAllocatePwTokens(tokens.ipTokenDai.address, stakeIporAmount);
        const allocatedTokensBefore = await liquidityMining.balanceOfAllocatedPwTokens(
            await userOne.getAddress()
        );
        //when
        await liquidityMining.connect(userOne).claimAllocatedPwTokens();
        //then
        const allocatedTokensAfter = await liquidityMining.balanceOfAllocatedPwTokens(
            await userOne.getAddress()
        );
        const exchangeRateAfter = await powerIpor.calculateExchangeRate();
        const powerIporBalanceAfter = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());
        const userOneIporBalanceAfter = await iporToken.balanceOf(await userOne.getAddress());
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );

        expect(powerIporBalanceBefore).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(powerIporBalanceAfter).to.be.equal(powerIporBalanceBefore.add(expectedRewards));
        expect(userOneIporBalanceAfter).to.be.equal(userOneIporBalanceBefore.sub(stakeIporAmount));
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(stakeIporAmount).add(expectedRewards)
        );
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(ZERO);
        expect(exchangeRateBefore).to.be.equal(exchangeRateAfter);
        expect(allocatedTokensBefore).to.be.equal(expectedRewards);
        expect(allocatedTokensAfter).to.be.equal(ZERO);
    });

    it("Should get 100 rewards when first stake 0.1 dai and after 1 Dai, 200 blocks mint", async () => {
        //    given
        const delegatedPwIporAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakeIporAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokensAmount = N0__1_18DEC;
        const expectedRewards = BigNumber.from("100000000000000000000");

        const userOneIporBalanceBefore = await iporToken.balanceOf(await userOne.getAddress());
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const liquidityMiningIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );

        await powerIpor.connect(userOne).stake(stakeIporAmount);

        const accountRewardsBefore = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.ipTokenDai.address
        );
        const accruedRewardsBefore = await liquidityMining
            .connect(userOne)
            .calculateAccruedRewards(tokens.ipTokenDai.address);

        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedPwIporAmount]);

        //    when
        await liquidityMining
            .connect(userOne)
            .stake(tokens.ipTokenDai.address, stakedIpTokensAmount);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const accountRewardsMiddle = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.ipTokenDai.address
        );
        const accruedRewardsMiddle = await liquidityMining
            .connect(userOne)
            .calculateAccruedRewards(tokens.ipTokenDai.address);
        // rewards is zero no transfer to powerIpor
        await liquidityMining.connect(userOne).stake(tokens.ipTokenDai.address, N1__0_18DEC);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    then
        const accountRewardsAfter = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.ipTokenDai.address
        );
        const accruedRewardsAfter = await liquidityMining
            .connect(userOne)
            .calculateAccruedRewards(tokens.ipTokenDai.address);
        const userOneIporBalanceAfter = await iporToken.balanceOf(await userOne.getAddress());
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );

        expect(accountRewardsBefore).to.be.equal(ZERO);
        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(accountRewardsMiddle).to.be.equal(ZERO);
        expect(accruedRewardsMiddle).to.be.equal(ZERO);
        expect(accountRewardsAfter).to.be.equal(expectedRewards.sub(BigNumber.from(1)));
        expect(accruedRewardsAfter).to.be.equal(expectedRewards);
        expect(userOneIporBalanceAfter).to.be.equal(userOneIporBalanceBefore.sub(stakeIporAmount));

        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(stakeIporAmount)
        );
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(N1__0_18DEC).add(N0__1_18DEC)
        );
    });

    it("Should count proper transfer rewards when one user stake ipTokens twice", async () => {
        //    given
        const delegatedPwIporAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakeIporAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokensAmount = N1__0_18DEC.mul(BigNumber.from("100"));

        const expectedRewards = BigNumber.from("100000000000000000000");

        const userOneIporBalanceBefore = await iporToken.balanceOf(await userOne.getAddress());
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const liquidityMiningIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );

        await powerIpor.connect(userOne).stake(delegatedPwIporAmount);
        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [stakeIporAmount]);

        const powerIporBalanceBefore = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        // when
        await liquidityMining
            .connect(userOne)
            .stake(tokens.ipTokenDai.address, stakedIpTokensAmount);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const powerIporBalanceAfter1Stake = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        const rewardsAfterFirstStake = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.ipTokenDai.address
        );

        await liquidityMining
            .connect(userOne)
            .stake(tokens.ipTokenDai.address, stakedIpTokensAmount);

        //    then
        const powerIporBalanceAfter2Stake = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        const rewardsAfterSecondStake = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.ipTokenDai.address
        );

        const userOneIporBalanceAfter = await iporToken.balanceOf(await userOne.getAddress());
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );

        expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(rewardsAfterSecondStake).to.be.equal(ZERO);

        expect(powerIporBalanceBefore).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(powerIporBalanceAfter1Stake).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(powerIporBalanceAfter2Stake).to.be.equal(BigNumber.from("201000000000000000000"));

        expect(userOneIporBalanceAfter).to.be.equal(userOneIporBalanceBefore.sub(stakeIporAmount));
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore
                .add(stakeIporAmount)
                .add(stakeIporAmount)
                .add(N1__0_18DEC)
        );
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(stakedIpTokensAmount).add(stakedIpTokensAmount)
        );
    });

    it("Should count proper rewards when one user stake Power Ipor Tokens (pwIpor) twice", async () => {
        //    given
        const delegatedPwIporAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakeIporAmount = N1__0_18DEC.mul(BigNumber.from("200"));
        const stakedIpTokensAmount = N1__0_18DEC.mul(BigNumber.from("100"));

        const expectedRewards = BigNumber.from("100000000000000000000");

        const userOneIporBalanceBefore = await iporToken.balanceOf(await userOne.getAddress());
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const liquidityMiningIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );

        //    when
        await powerIpor.connect(userOne).stake(stakeIporAmount);

        const powerIporBalanceBefore = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await liquidityMining
            .connect(userOne)
            .stake(tokens.ipTokenDai.address, stakedIpTokensAmount);
        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedPwIporAmount]);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const powerIporBalanceAfter1Stake = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());
        const rewardsAfterFirstStake = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.ipTokenDai.address
        );

        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedPwIporAmount]);

        const rewardsAfterSecondStake = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.ipTokenDai.address
        );

        //    then
        const powerIporBalanceAfter2Stake = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        const userOneIporBalanceAfter = await iporToken.balanceOf(await userOne.getAddress());
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );

        expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(rewardsAfterSecondStake).to.be.equal(ZERO);

        expect(powerIporBalanceBefore).to.be.equal(BigNumber.from("200000000000000000000"));
        // 1 transfer when first delegateToLiquidityMining
        expect(powerIporBalanceAfter1Stake).to.be.equal(BigNumber.from("201000000000000000000"));
        // 100 transfer after second delegateToLiquidityMining
        expect(powerIporBalanceAfter2Stake).to.be.equal(BigNumber.from("302000000000000000000"));

        expect(userOneIporBalanceAfter).to.be.equal(userOneIporBalanceBefore.sub(stakeIporAmount));
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore
                .add(stakeIporAmount)
                .add(expectedRewards)
                .add(N2__0_18DEC)
        );
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(stakedIpTokensAmount)
        );
    });

    it("Should count proper rewards when one user stake Power Ipor Tokens (pwIpor) twice and ipAsset was removed", async () => {
        //    given
        const delegatedPwIporAmount = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakeIporAmount = N1__0_18DEC.mul(BigNumber.from("200"));
        const stakedIpTokensAmount = N1__0_18DEC.mul(BigNumber.from("100"));

        const expectedRewards = BigNumber.from("100000000000000000000");

        const userOneIporBalanceBefore = await iporToken.balanceOf(await userOne.getAddress());
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const liquidityMiningIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );

        //    when
        await powerIpor.connect(userOne).stake(stakeIporAmount);

        const powerIporBalanceBefore = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await liquidityMining
            .connect(userOne)
            .stake(tokens.ipTokenDai.address, stakedIpTokensAmount);
        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedPwIporAmount]);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const powerIporBalanceAfter1Stake = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());
        const rewardsAfterFirstStake = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.ipTokenDai.address
        );

        await liquidityMining.removeIpTokenAsset(tokens.ipTokenDai.address);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const rewardsAfterRemoveIpToken = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.ipTokenDai.address
        );
        await liquidityMining.addIpTokenAsset(tokens.ipTokenDai.address);
        const rewardsAfterAddIpToken = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.ipTokenDai.address
        );

        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedPwIporAmount]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const rewardsAfterSecondStake = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.ipTokenDai.address
        );

        //    then
        const powerIporBalanceAfter2Stake = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        const userOneIporBalanceAfter = await iporToken.balanceOf(await userOne.getAddress());
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );

        expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(rewardsAfterSecondStake).to.be.equal(ZERO);

        expect(powerIporBalanceBefore).to.be.equal(BigNumber.from("200000000000000000000"));
        // 1 transfer when first delegateToLiquidityMining
        expect(powerIporBalanceAfter1Stake).to.be.equal(BigNumber.from("201000000000000000000"));
        // 100 transfer after second delegateToLiquidityMining
        expect(powerIporBalanceAfter2Stake).to.be.equal(BigNumber.from("302000000000000000000"));

        expect(userOneIporBalanceAfter).to.be.equal(userOneIporBalanceBefore.sub(stakeIporAmount));
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore
                .add(stakeIporAmount)
                .add(expectedRewards)
                .add(N2__0_18DEC)
        );
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(stakedIpTokensAmount)
        );

        expect(rewardsAfterFirstStake).to.be.equal(N1__0_18DEC.mul(BigNumber.from("100")));
        expect(rewardsAfterRemoveIpToken).to.be.equal(N1__0_18DEC.mul(BigNumber.from("101")));
        expect(rewardsAfterAddIpToken).to.be.equal(N1__0_18DEC.mul(BigNumber.from("101")));
        expect(rewardsAfterSecondStake).to.be.equal(ZERO);
    });
});
