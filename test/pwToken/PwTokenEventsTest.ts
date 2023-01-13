import hre, { upgrades } from "hardhat";
import chai from "chai";

import { Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockStakedToken, PowerToken, LiquidityMining, LiquidityMiningForTests } from "../../types";
import { N1__0_18DEC, ZERO, TOTAL_SUPPLY_18_DECIMALS, N0__5_18DEC } from "../utils/Constants";
import { it } from "mocha";
import { getDeployedTokens, Tokens } from "../utils/LiquidityMiningUtils";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PowerToken token delegate", () => {
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let stakedToken: MockStakedToken;
    let powerToken: PowerToken;
    let tokens: Tokens;
    let liquidityMining: LiquidityMining;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await ethers.getSigners();
        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const StakedToken = await ethers.getContractFactory("MockStakedToken");
        stakedToken = (await StakedToken.deploy(
            "IPOR Token",
            "IPOR",
            await admin.getAddress()
        )) as MockStakedToken;
        const PowerToken = await ethers.getContractFactory("PowerToken");
        powerToken = (await upgrades.deployProxy(PowerToken, [stakedToken.address])) as PowerToken;
        await stakedToken.increaseAllowance(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        await powerToken.setLiquidityMining(liquidityMining.address);
    });

    it("Should emit Stake event", async () => {
        //    given
        const stakeAmount = N1__0_18DEC;
        const internalExchangeRate = N1__0_18DEC;
        const baseAmount = N1__0_18DEC;
        const stakedTokenStakeBalanceBefore = await powerToken.balanceOf(await admin.getAddress());
        //    when
        await expect(powerToken.stake(stakeAmount))
            .to.emit(powerToken, "Staked")
            .withArgs(await admin.getAddress(), stakeAmount, internalExchangeRate, baseAmount);
        //    then
        const stakedTokenStakeBalanceAfter = await powerToken.balanceOf(await admin.getAddress());

        expect(stakedTokenStakeBalanceAfter).to.be.equal(
            stakedTokenStakeBalanceBefore.add(stakeAmount)
        );
    });
    it("Should emit Unstake event", async () => {
        //    given
        const stakeAmount = N1__0_18DEC;
        const unstakeAmount = N1__0_18DEC;
        const internalExchangeRate = N1__0_18DEC;
        const fee = N0__5_18DEC;
        await powerToken.stake(stakeAmount);
        const stakedTokenStakeBalanceBefore = await powerToken.balanceOf(await admin.getAddress());
        //    when
        await expect(powerToken.unstake(stakeAmount))
            .to.emit(powerToken, "Unstaked")
            .withArgs(await admin.getAddress(), unstakeAmount, internalExchangeRate, fee);
        //    then
        const stakedTokenStakeBalanceAfter = await powerToken.balanceOf(await admin.getAddress());
        expect(stakedTokenStakeBalanceBefore).to.be.equal(stakeAmount);
        expect(stakedTokenStakeBalanceAfter).to.be.equal(ZERO);
    });

    it("Should emit DelegateToLiquidityMining event ", async () => {
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
            .to.emit(powerToken, "ToLiquidityMiningDelegated")
            .withArgs(
                await admin.getAddress(),
                [tokens.lpTokenDai.address],
                [delegatePwTokenAmount]
            );
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
            .to.emit(powerToken, "FromLiquidityMiningUndelegated")
            .withArgs(
                await admin.getAddress(),
                [tokens.lpTokenDai.address],
                [undelegatePwTokenAmount]
            );
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

    it("Should emit CooldownChanged event when cooldown", async () => {
        //    given
        const stakeStakedTokenAmount = N1__0_18DEC;
        const cooldownAmount = N1__0_18DEC;
        const delegatePwTokenAmount = N1__0_18DEC;
        const undelegatePwTokenAmount = N1__0_18DEC;
        await powerToken.stake(stakeStakedTokenAmount);
        //    when
        await expect(powerToken.cooldown(cooldownAmount)).to.emit(powerToken, "CooldownChanged");
        //    then
    });
    it("Should emit CooldownChanged event when cancelCooldown", async () => {
        //    given
        const stakeStakedTokenAmount = N1__0_18DEC;
        const cooldownAmount = N1__0_18DEC;
        await powerToken.stake(stakeStakedTokenAmount);
        await powerToken.cooldown(cooldownAmount);
        //    when
        await expect(powerToken.cancelCooldown()).to.emit(powerToken, "CooldownChanged");
        //    then
    });

    it("Should emit Redeem event", async () => {
        // given
        const twoWeekesInSeconds = 2 * 7 * 24 * 60 * 60;
        await powerToken.stake(N1__0_18DEC);
        await powerToken.cooldown(N0__5_18DEC);

        // when
        await hre.network.provider.send("evm_increaseTime", [twoWeekesInSeconds + 1]);
        await expect(powerToken.redeem()).to.be.emit(powerToken, "Redeem");
    });

    it("Should emit UnstakeWithoutCooldownFeeChanged event", async () => {
        // given

        // when
        await expect(powerToken.setUnstakeWithoutCooldownFee(N1__0_18DEC)).to.be.emit(
            powerToken,
            "UnstakeWithoutCooldownFeeChanged"
        );
    });

    it("Should emit LiquidityMiningChanged event", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMiningForTests");
        const itfLiquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMiningForTests;

        // when
        await expect(powerToken.setLiquidityMining(itfLiquidityMining.address)).to.be.emit(
            powerToken,
            "LiquidityMiningChanged"
        );
    });

    it("Should emit PauseManagerChanged event ", async () => {
        //    given
        //    when
        await expect(powerToken.setPauseManager(await userOne.getAddress()))
            .to.emit(powerToken, "PauseManagerChanged")
            .withArgs(
                await admin.getAddress(),
                await admin.getAddress(),
                await userOne.getAddress()
            );
        //    then
        const newPauseManager = await powerToken.getPauseManager();

        expect(newPauseManager).to.be.equal(await userOne.getAddress());
    });
});
