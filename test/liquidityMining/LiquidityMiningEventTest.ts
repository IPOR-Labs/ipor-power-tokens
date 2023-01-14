import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockStakedToken, PowerToken } from "../../types";
import { Tokens, getDeployedTokens } from "../utils/LiquidityMiningUtils";
import {
    N1__0_18DEC,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
    N0__5_18DEC,
    N1__0_8DEC,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

describe("LiquidityMining event tests", () => {
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
            [tokens.lpTokenDai.address],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        await liquidityMining.setRewardsPerBlock(tokens.lpTokenDai.address, N1__0_8DEC);

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

    it("Should emit LpTokensStaked event", async () => {
        //    given
        const stakeLpTokenAmount = N1__0_18DEC;
        const accountLpTokenBalanceBefore = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            )
        ).lpTokenBalance;
        //    when
        await expect(liquidityMining.stake(tokens.lpTokenDai.address, stakeLpTokenAmount))
            .to.emit(liquidityMining, "LpTokensStaked")
            .withArgs(await admin.getAddress(), tokens.lpTokenDai.address, stakeLpTokenAmount);
        //    then
        const accountLpTokenBalanceAfter = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            )
        ).lpTokenBalance;

        expect(accountLpTokenBalanceAfter).to.be.equal(
            accountLpTokenBalanceBefore.add(stakeLpTokenAmount)
        );
    });

    it("Should emit LpTokensUnstaked event", async () => {
        //    given
        const stakeLpTokenAmount = N1__0_18DEC;
        const unstakeLpTokenAmount = N0__5_18DEC;

        await liquidityMining.stake(tokens.lpTokenDai.address, stakeLpTokenAmount);
        const accountLpTokenBalanceBefore = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            )
        ).lpTokenBalance;

        //    when
        await expect(liquidityMining.unstake(tokens.lpTokenDai.address, unstakeLpTokenAmount))
            .to.emit(liquidityMining, "LpTokensUnstaked")
            .withArgs(await admin.getAddress(), tokens.lpTokenDai.address, unstakeLpTokenAmount);

        //    then
        const accountLpTokenBalanceAfter = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            )
        ).lpTokenBalance;

        expect(accountLpTokenBalanceAfter).to.be.equal(
            accountLpTokenBalanceBefore.sub(unstakeLpTokenAmount)
        );
    });

    it("Should emit Claim and RewardsReceived event", async () => {
        //    given
        const stakeLpTokenAmount = N1__0_18DEC;
        const rewards = N1__0_18DEC.mul(BigNumber.from("101"));
        const adminPwTokenBalanceBefore = await powerToken.balanceOf(await admin.getAddress());

        const accountLpTokenBalanceBefore = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            )
        ).lpTokenBalance;
        await liquidityMining.stake(tokens.lpTokenDai.address, stakeLpTokenAmount);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when
        await expect(liquidityMining.claim(tokens.lpTokenDai.address))
            .to.emit(liquidityMining, "Claimed")
            .withArgs(await admin.getAddress(), tokens.lpTokenDai.address, rewards)
            .to.be.emit(powerToken, "RewardsReceived")
            .withArgs(await admin.getAddress(), rewards);

        //    then
        const accountLpTokenBalanceAfter = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            )
        ).lpTokenBalance;
        const adminPwTokenBalanceAfter = await powerToken.balanceOf(await admin.getAddress());

        expect(accountLpTokenBalanceAfter).to.be.equal(
            accountLpTokenBalanceBefore.add(stakeLpTokenAmount)
        );
        expect(adminPwTokenBalanceAfter).to.be.equal(adminPwTokenBalanceBefore.add(rewards));
    });

    it("Should emit RewardsPerBlockChanged event", async () => {
        //    given
        const rewardsPerBlockOld = BigNumber.from("100000000");
        const rewardsPerBlockNew = BigNumber.from("200000000");
        //    when
        await expect(
            liquidityMining.setRewardsPerBlock(tokens.lpTokenDai.address, rewardsPerBlockNew)
        )
            .to.emit(liquidityMining, "RewardsPerBlockChanged")
            .withArgs(await admin.getAddress(), rewardsPerBlockOld, rewardsPerBlockNew);
        //    then

        const accurateRewardsPerBlock = (
            await liquidityMining.getGlobalIndicators(tokens.lpTokenDai.address)
        ).rewardsPerBlock;
        expect(accurateRewardsPerBlock).to.be.equal(rewardsPerBlockNew);
    });

    it("Should emit LpTokenAdded event", async () => {
        //    given
        const lpTokenSupportedBefore = await liquidityMining.isLpTokenSupported(
            tokens.lpTokenUsdc.address
        );

        //    when
        await expect(liquidityMining.addLpToken(tokens.lpTokenUsdc.address))
            .to.emit(liquidityMining, "LpTokenAdded")
            .withArgs(await admin.getAddress(), tokens.lpTokenUsdc.address);

        //    then
        const lpTokenSupportedAfter = await liquidityMining.isLpTokenSupported(
            tokens.lpTokenUsdc.address
        );

        expect(lpTokenSupportedBefore).to.be.false;
        expect(lpTokenSupportedAfter).to.be.true;
    });

    it("Should emit LpTokenRemoved event", async () => {
        //    given
        await liquidityMining.addLpToken(tokens.lpTokenUsdc.address);
        const lpTokenSupportedBefore = await liquidityMining.isLpTokenSupported(
            tokens.lpTokenUsdc.address
        );

        //    when
        await expect(liquidityMining.removeLpToken(tokens.lpTokenUsdc.address))
            .to.emit(liquidityMining, "LpTokenRemoved")
            .withArgs(await admin.getAddress(), tokens.lpTokenUsdc.address);

        //    then
        const lpTokenSupportedAfter = await liquidityMining.isLpTokenSupported(
            tokens.lpTokenUsdc.address
        );

        expect(lpTokenSupportedBefore).to.be.true;
        expect(lpTokenSupportedAfter).to.be.false;
    });

    it("Should emit PwTokenDelegated event ", async () => {
        //    given
        const stakeStakedTokenAmount = N1__0_18DEC;
        const delegatePwTokenAmount = N1__0_18DEC;
        await powerToken.stake(stakeStakedTokenAmount);
        const delegatedPwTokenBalanceBefore = (
            await liquidityMining.balanceOfDelegatedPwToken(await admin.getAddress(), [
                tokens.lpTokenDai.address,
            ])
        )[0].pwTokenAmount;
        //    when
        await expect(
            powerToken.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatePwTokenAmount]
            )
        )
            .to.emit(liquidityMining, "PwTokenDelegated")
            .withArgs(await admin.getAddress(), tokens.lpTokenDai.address, delegatePwTokenAmount);
        //    then
        const delegatedPwTokenBalanceAfter = (
            await liquidityMining.balanceOfDelegatedPwToken(await admin.getAddress(), [
                tokens.lpTokenDai.address,
            ])
        )[0].pwTokenAmount;

        expect(delegatedPwTokenBalanceAfter).to.be.equal(
            delegatedPwTokenBalanceBefore.add(delegatePwTokenAmount)
        );
    });

    it("Should emit PwTokenDelegatedAndLpTokenStaked event ", async () => {
        //    given
        const stakeStakedTokenAmount = N1__0_18DEC;
        const stakeLpTokenAmount = N1__0_18DEC;
        const delegatePwTokenAmount = N1__0_18DEC;
        await powerToken.stake(stakeStakedTokenAmount);
        const delegatedPwTokenBalanceBefore = (
            await liquidityMining.balanceOfDelegatedPwToken(await admin.getAddress(), [
                tokens.lpTokenDai.address,
            ])
        )[0].pwTokenAmount;
        const liquidityMiningLpTokenBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );

        //    when
        await expect(
            powerToken.delegateAndStakeToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatePwTokenAmount],
                [stakeLpTokenAmount]
            )
        )
            .to.emit(liquidityMining, "PwTokenDelegatedAndLpTokenStaked")
            .withArgs(
                await admin.getAddress(),
                tokens.lpTokenDai.address,
                delegatePwTokenAmount,
                stakeLpTokenAmount
            );
        //    then
        const delegatedPwTokenBalanceAfter = (
            await liquidityMining.balanceOfDelegatedPwToken(await admin.getAddress(), [
                tokens.lpTokenDai.address,
            ])
        )[0].pwTokenAmount;
        const liquidityMiningLpTokenBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );

        expect(delegatedPwTokenBalanceAfter).to.be.equal(
            delegatedPwTokenBalanceBefore.add(delegatePwTokenAmount)
        );
        expect(liquidityMiningLpTokenBalanceAfter).to.be.equal(
            liquidityMiningLpTokenBalanceBefore.add(stakeLpTokenAmount)
        );
    });

    it("Should emit PwTokenUndelegated event ", async () => {
        //    given
        const stakeStakedTokenAmount = N1__0_18DEC;
        const delegatePwTokenAmount = N1__0_18DEC;
        const undelegatePwTokenAmount = N1__0_18DEC;
        await powerToken.stake(stakeStakedTokenAmount);
        await powerToken.delegateToLiquidityMining(
            [tokens.lpTokenDai.address],
            [delegatePwTokenAmount]
        );
        const delegatedPwTokenBalanceBefore = (
            await liquidityMining.balanceOfDelegatedPwToken(await admin.getAddress(), [
                tokens.lpTokenDai.address,
            ])
        )[0].pwTokenAmount;
        //    when
        await expect(
            powerToken.undelegateFromLiquidityMining(
                [tokens.lpTokenDai.address],
                [undelegatePwTokenAmount]
            )
        )
            .to.emit(liquidityMining, "PwTokenUndelegated")
            .withArgs(await admin.getAddress(), tokens.lpTokenDai.address, undelegatePwTokenAmount);
        //    then
        const delegatedPwTokenBalanceAfter = (
            await liquidityMining.balanceOfDelegatedPwToken(await admin.getAddress(), [
                tokens.lpTokenDai.address,
            ])
        )[0].pwTokenAmount;

        expect(delegatedPwTokenBalanceAfter).to.be.equal(
            delegatedPwTokenBalanceBefore.sub(undelegatePwTokenAmount)
        );
    });

    it("Should emit PauseManagerChanged event ", async () => {
        //    given
        //    when
        await expect(liquidityMining.setPauseManager(await userOne.getAddress()))
            .to.emit(liquidityMining, "PauseManagerChanged")
            .withArgs(
                await admin.getAddress(),
                await admin.getAddress(),
                await userOne.getAddress()
            );
        //    then
        const newPauseManager = await liquidityMining.getPauseManager();

        expect(newPauseManager).to.be.equal(await userOne.getAddress());
    });
});
