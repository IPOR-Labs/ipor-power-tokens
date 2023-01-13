import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockStakedToken, LiquidityMining, PowerToken } from "../../types";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    N0__1_18DEC,
    COOLDOWN_SECONDS,
} from "../utils/Constants";
import { it } from "mocha";
import { getDeployedTokens, Tokens } from "../utils/LiquidityMiningUtils";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

const getTimeInSeconds = () => BigNumber.from(Math.floor(new Date().getTime() / 1000));

describe("PowerToken unstake", () => {
    const N2__0_18DEC = N1__0_18DEC.mul(BigNumber.from("2"));
    const N0__5_18DEC = N0__1_18DEC.mul(BigNumber.from("5"));
    const N0__6_18DEC = N0__1_18DEC.mul(BigNumber.from("6"));
    const N0__8_18DEC = N0__1_18DEC.mul(BigNumber.from("8"));
    let accounts: Signer[];
    let stakedToken: MockStakedToken;
    let powerToken: PowerToken;
    let tokens: Tokens;
    let liquidityMining: LiquidityMining;

    before(async () => {
        accounts = await ethers.getSigners();
        tokens = await getDeployedTokens(accounts);
    });

    beforeEach(async () => {
        const StakedToken = await ethers.getContractFactory("MockStakedToken");
        stakedToken = (await StakedToken.deploy(
            "IPOR Token",
            "IPOR",
            await accounts[0].getAddress()
        )) as MockStakedToken;
        const PowerToken = await ethers.getContractFactory("PowerToken");
        powerToken = (await upgrades.deployProxy(PowerToken, [stakedToken.address])) as PowerToken;
        await stakedToken.increaseAllowance(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.lpTokenDai.address],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        await powerToken.setLiquidityMining(liquidityMining.address);
    });

    it("Should not be able cooldown when amount is zero", async () => {
        // given
        await powerToken.stake(N1__0_18DEC);

        const cooldownBefore = await powerToken.getActiveCooldown(await accounts[0].getAddress());

        // when
        await expect(powerToken.cooldown(ZERO)).to.be.revertedWith("PT_717");

        // then
        const cooldownAfter = await powerToken.getActiveCooldown(await accounts[0].getAddress());

        expect(cooldownBefore.endTimestamp).to.be.equal(ZERO);
        expect(cooldownBefore.pwTokenAmount).to.be.equal(ZERO);
        expect(cooldownAfter.endTimestamp).to.be.equal(ZERO);
        expect(cooldownAfter.pwTokenAmount).to.be.equal(ZERO);
    });

    it("Should not be able cooldown when amount is to big", async () => {
        // given
        await powerToken.stake(N1__0_18DEC);

        const cooldownBefore = await powerToken.getActiveCooldown(await accounts[0].getAddress());

        // when
        await expect(powerToken.cooldown(N2__0_18DEC)).to.be.revertedWith("PT_708");

        // then
        const cooldownAfter = await powerToken.getActiveCooldown(await accounts[0].getAddress());

        expect(cooldownBefore.endTimestamp).to.be.equal(ZERO);
        expect(cooldownBefore.pwTokenAmount).to.be.equal(ZERO);
        expect(cooldownAfter.endTimestamp).to.be.equal(ZERO);
        expect(cooldownAfter.pwTokenAmount).to.be.equal(ZERO);
    });

    it("Should be able cool down when amount is zero", async () => {
        // given
        const nowInSeconds = getTimeInSeconds();
        await powerToken.stake(N1__0_18DEC);

        const cooldownBefore = await powerToken.getActiveCooldown(await accounts[0].getAddress());

        // when
        await powerToken.cooldown(N0__5_18DEC);

        // then
        const cooldownAfter = await powerToken.getActiveCooldown(await accounts[0].getAddress());

        expect(cooldownBefore.endTimestamp).to.be.equal(ZERO);
        expect(cooldownBefore.pwTokenAmount).to.be.equal(ZERO);
        expect(cooldownAfter.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(cooldownAfter.pwTokenAmount).to.be.equal(N0__5_18DEC);
    });

    it("Should be able to override cool down when second time execute method ", async () => {
        // given
        const nowInSeconds = getTimeInSeconds();
        await powerToken.stake(N1__0_18DEC);

        await powerToken.cooldown(N0__5_18DEC);
        const cooldownBefore = await powerToken.getActiveCooldown(await accounts[0].getAddress());
        // when

        await powerToken.cooldown(N0__6_18DEC);

        // then
        const cooldownAfter = await powerToken.getActiveCooldown(await accounts[0].getAddress());

        expect(cooldownBefore.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(cooldownBefore.pwTokenAmount).to.be.equal(N0__5_18DEC);

        expect(cooldownAfter.endTimestamp.gt(cooldownBefore.endTimestamp)).to.be.true;
        expect(cooldownAfter.pwTokenAmount).to.be.equal(N0__6_18DEC);
    });

    it("Should be able to cancel cool down", async () => {
        // given
        const nowInSeconds = getTimeInSeconds();
        await powerToken.stake(N1__0_18DEC);

        await powerToken.cooldown(N0__5_18DEC);
        const cooldownBefore = await powerToken.getActiveCooldown(await accounts[0].getAddress());
        // when

        await powerToken.cancelCooldown();

        // then
        const cooldownAfter = await powerToken.getActiveCooldown(await accounts[0].getAddress());

        expect(cooldownBefore.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(cooldownBefore.pwTokenAmount).to.be.equal(N0__5_18DEC);

        expect(cooldownAfter.endTimestamp).to.be.equal(ZERO);
        expect(cooldownAfter.pwTokenAmount).to.be.equal(ZERO);
    });

    it("Should not be able to unstake when some amount is in cool down state", async () => {
        // given
        const adminAddress = await accounts[0].getAddress();
        const nowInSeconds = getTimeInSeconds();

        await powerToken.stake(N1__0_18DEC);
        await powerToken.cooldown(N0__8_18DEC);

        const cooldownBefore = await powerToken.getActiveCooldown(await accounts[0].getAddress());
        const balanceBefore = await powerToken.balanceOf(adminAddress);
        // when

        await expect(powerToken.unstake(N0__5_18DEC)).to.be.revertedWith("PT_708");

        // then
        const cooldownAfter = await powerToken.getActiveCooldown(await accounts[0].getAddress());
        const balanceAfter = await powerToken.balanceOf(adminAddress);

        expect(cooldownBefore.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(cooldownBefore.pwTokenAmount).to.be.equal(N0__8_18DEC);
        expect(cooldownAfter.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(cooldownAfter.pwTokenAmount).to.be.equal(N0__8_18DEC);

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
    });

    it("Should not be able to delegate when some amount is in cool down state", async () => {
        // given
        const adminAddress = await accounts[0].getAddress();
        const nowInSeconds = getTimeInSeconds();

        await powerToken.stake(N1__0_18DEC);
        await powerToken.cooldown(N0__8_18DEC);

        const cooldownBefore = await powerToken.getActiveCooldown(await accounts[0].getAddress());
        const balanceBefore = await powerToken.balanceOf(adminAddress);
        const delegatedBalanceBefore = await powerToken.delegatedToLiquidityMiningBalanceOf(
            adminAddress
        );
        // when

        await expect(
            powerToken.delegateToLiquidityMining([tokens.lpTokenDai.address], [N0__5_18DEC])
        ).to.be.revertedWith("PT_708");

        // then
        const cooldownAfter = await powerToken.getActiveCooldown(await accounts[0].getAddress());
        const balanceAfter = await powerToken.balanceOf(adminAddress);
        const delegatedBalanceAfter = await powerToken.delegatedToLiquidityMiningBalanceOf(
            adminAddress
        );

        expect(cooldownBefore.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(cooldownBefore.pwTokenAmount).to.be.equal(N0__8_18DEC);
        expect(cooldownAfter.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(cooldownAfter.pwTokenAmount).to.be.equal(N0__8_18DEC);

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(ZERO);
    });

    it("Should not be able to redeem cool down tokens when time not pass", async () => {
        // given
        const nowInSeconds = getTimeInSeconds();
        await powerToken.stake(N1__0_18DEC);

        await powerToken.cooldown(N0__5_18DEC);
        const cooldownBefore = await powerToken.getActiveCooldown(await accounts[0].getAddress());
        // when

        await expect(powerToken.redeem()).to.be.revertedWith("PT_710");

        // then
        const cooldownAfter = await powerToken.getActiveCooldown(await accounts[0].getAddress());

        expect(cooldownBefore.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(cooldownBefore.pwTokenAmount).to.be.equal(N0__5_18DEC);

        expect(cooldownAfter.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(cooldownAfter.pwTokenAmount).to.be.equal(N0__5_18DEC);
    });

    it("Should be able to redeem cool down tokens when 2 weeks pass", async () => {
        // given

        const expectedCooldownPwTokenAmount = N0__5_18DEC;
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        const twoWeekesInSeconds = 2 * 7 * 24 * 60 * 60;
        const adminAddress = await accounts[0].getAddress();
        const nowInSeconds = getTimeInSeconds();
        await powerToken.stake(N1__0_18DEC);
        const pwBalanceBefore = await powerToken.balanceOf(adminAddress);

        await powerToken.cooldown(N0__5_18DEC);
        const cooldownBefore = await powerToken.getActiveCooldown(await accounts[0].getAddress());
        const exchangeRateBefore = await powerToken.calculateExchangeRate();

        // when
        await hre.network.provider.send("evm_increaseTime", [twoWeekesInSeconds + 1]);
        await powerToken.redeem();

        // then
        const exchangeRateAfter = await powerToken.calculateExchangeRate();

        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const cooldownAfter = await powerToken.getActiveCooldown(await accounts[0].getAddress());
        const pwBalanceAfter = await powerToken.balanceOf(adminAddress);

        expect(cooldownBefore.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(cooldownBefore.pwTokenAmount).to.be.equal(expectedCooldownPwTokenAmount);

        expect(cooldownAfter.endTimestamp).to.be.equal(ZERO);
        expect(cooldownAfter.pwTokenAmount).to.be.equal(ZERO);

        expect(pwBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(pwBalanceAfter).to.be.equal(N0__5_18DEC);
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(expectedCooldownPwTokenAmount)
        );
        expect(exchangeRateBefore).to.be.equal(exchangeRateAfter);
    });

    it("Should be able to redeem cool down tokens when 2 weeks pass and exchange rate changed", async () => {
        // given
        const stakeAmount = N1__0_18DEC;
        const cooldownAmount = N0__5_18DEC;
        const transferAmount = N1__0_18DEC;

        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        const twoWeekesInSeconds = 2 * 7 * 24 * 60 * 60;
        const adminAddress = await accounts[0].getAddress();
        const nowInSeconds = getTimeInSeconds();
        await powerToken.stake(N1__0_18DEC);
        const pwBalanceBefore = await powerToken.balanceOf(adminAddress);

        await powerToken.cooldown(N0__5_18DEC);
        await stakedToken.transfer(powerToken.address, N1__0_18DEC);

        const cooldownBefore = await powerToken.getActiveCooldown(await accounts[0].getAddress());
        const PowerTokenBalanceBefore = await stakedToken.balanceOf(adminAddress);
        const exchangeRateBefore = await powerToken.calculateExchangeRate();

        // when
        await hre.network.provider.send("evm_increaseTime", [twoWeekesInSeconds + 1]);
        await powerToken.redeem();

        // then
        const exchangeRateAfter = await powerToken.calculateExchangeRate();
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const cooldownAfter = await powerToken.getActiveCooldown(await accounts[0].getAddress());
        const pwBalanceAfter = await powerToken.balanceOf(adminAddress);
        const stakedTokenBalanceAfter = await stakedToken.balanceOf(adminAddress);

        expect(cooldownBefore.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(cooldownBefore.pwTokenAmount).to.be.equal(N0__5_18DEC);

        expect(cooldownAfter.endTimestamp).to.be.equal(ZERO);
        expect(cooldownAfter.pwTokenAmount).to.be.equal(ZERO);

        expect(pwBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(pwBalanceAfter).to.be.equal(N1__0_18DEC.add(N0__5_18DEC));

        expect(stakedTokenBalanceAfter).to.be.equal(PowerTokenBalanceBefore.add(N0__5_18DEC));
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore
                .add(transferAmount)
                .add(stakeAmount)
                .sub(cooldownAmount)
        );

        expect(exchangeRateBefore).to.be.equal(exchangeRateAfter);
    });
});
