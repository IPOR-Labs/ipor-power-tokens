import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockStakedToken, LiquidityMining, PowerToken } from "../../types";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    N0__01_18DEC,
    N0__1_18DEC,
    N2__0_18DEC,
} from "../utils/Constants";
import { it } from "mocha";
import { getDeployedTokens, Tokens } from "../utils/LiquidityMiningUtils";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PowerToken unstake", () => {
    const N0__2_18DEC = N0__1_18DEC.mul(BigNumber.from("2"));
    const N0__25_18DEC = N0__01_18DEC.mul(BigNumber.from("25"));
    const N0__4_18DEC = N0__1_18DEC.mul(BigNumber.from("4"));
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

    it("Should not be able set _unstakeWithoutCooldownFee to value highter than 1e18", async () => {
        await expect(powerToken.setUnstakeWithoutCooldownFee(N2__0_18DEC)).to.be.revertedWith(
            "PT_714"
        );
    });

    it("Should not be able unstake when amount is zero", async () => {
        // given
        await powerToken.stake(N1__0_18DEC);

        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await powerToken.balanceOf(adminAddress);
        const totalSupplyBefore = await powerToken.totalSupplyBase();

        // when
        await expect(powerToken.unstake(ZERO)).to.be.revertedWith("PT_717");
        // then
        const balanceAfter = await powerToken.balanceOf(adminAddress);
        const totalSupplyAfter = await powerToken.totalSupplyBase();
        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
        expect(totalSupplyBefore).to.be.equal(N1__0_18DEC);
        expect(totalSupplyAfter).to.be.equal(N1__0_18DEC);
    });

    it("Should be able unstake", async () => {
        // given
        await powerToken.stake(N1__0_18DEC);

        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await powerToken.balanceOf(adminAddress);
        const totalSupplyBefore = await powerToken.totalSupplyBase();
        const stakedTokenBalanceBefore = await stakedToken.balanceOf(adminAddress);
        const exchangeRateBefore = await powerToken.calculateExchangeRate();

        // when
        await powerToken.unstake(N1__0_18DEC);

        // then
        const exchangeRateAfter = await powerToken.calculateExchangeRate();
        const balanceAfter = await powerToken.balanceOf(adminAddress);
        const totalSupplyAfter = await powerToken.totalSupplyBase();
        const stakedTokenBalanceAfter = await stakedToken.balanceOf(adminAddress);

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(ZERO);
        expect(totalSupplyBefore).to.be.equal(N1__0_18DEC);
        expect(totalSupplyAfter).to.be.equal(ZERO);
        expect(stakedTokenBalanceAfter).to.be.equal(stakedTokenBalanceBefore.add(N0__5_18DEC));
        expect(exchangeRateBefore).to.be.equal(exchangeRateAfter);
    });

    it("Should be able unstake part of staked balance", async () => {
        // given
        await powerToken.stake(N1__0_18DEC);

        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await powerToken.balanceOf(adminAddress);
        const totalSupplyBefore = await powerToken.totalSupplyBase();
        const stakedTokenBalanceBefore = await stakedToken.balanceOf(adminAddress);
        const exchangeRateBefore = await powerToken.calculateExchangeRate();

        // when
        await powerToken.unstake(N0__5_18DEC);

        // then
        const exchangeRateAfter = await powerToken.calculateExchangeRate();
        const balanceAfter = await powerToken.balanceOf(adminAddress);
        const totalSupplyAfter = await powerToken.totalSupplyBase();
        const stakedTokenBalanceAfter = await stakedToken.balanceOf(adminAddress);

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(BigNumber.from("750000000000000000"));
        expect(totalSupplyBefore).to.be.equal(N1__0_18DEC);
        expect(totalSupplyAfter).to.be.equal(BigNumber.from("500000000000000000"));
        expect(stakedTokenBalanceAfter).to.be.equal(stakedTokenBalanceBefore.add(N0__25_18DEC));
        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(exchangeRateAfter).to.be.equal(BigNumber.from("1500000000000000000"));
    });

    it("Should not be able to unstake when user delegated tokens to LiquidityMining", async () => {
        //    given
        await powerToken.stake(N1__0_18DEC);

        await powerToken.delegateToLiquidityMining(
            [tokens.lpTokenDai.address],
            [N0__1_18DEC.mul(BigNumber.from("6"))]
        );
        //    when
        await expect(powerToken.unstake(N0__1_18DEC.mul(BigNumber.from("6")))).to.be.revertedWith(
            "PT_708"
        );
    });

    it("Should be able to unstake tokens which is not delegate when he delegated tokens to LiquidityMining", async () => {
        //    given
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        const [admin] = accounts;

        await powerToken.stake(N1__0_18DEC);
        const balanceBefore = await powerToken.balanceOf(await admin.getAddress());
        const totalSupplyBefore = await powerToken.totalSupplyBase();
        const stakedTokenBalanceBefore = await stakedToken.balanceOf(await admin.getAddress());
        const exchangeRateBefore = await powerToken.calculateExchangeRate();

        await powerToken.delegateToLiquidityMining([tokens.lpTokenDai.address], [N0__6_18DEC]);
        //    when
        await powerToken.unstake(N0__4_18DEC);

        //    then
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const balanceAfter = await powerToken.balanceOf(await admin.getAddress());
        const totalSupplyAfter = await powerToken.totalSupplyBase();
        const stakedTokenBalanceAfter = await stakedToken.balanceOf(await admin.getAddress());
        const exchangeRateAfter = await powerToken.calculateExchangeRate();

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(totalSupplyBefore).to.be.equal(N1__0_18DEC);

        expect(totalSupplyAfter).to.be.equal(totalSupplyBefore.sub(N0__4_18DEC));
        expect(balanceAfter).to.be.equal(N0__8_18DEC);
        expect(stakedTokenBalanceAfter).to.be.equal(stakedTokenBalanceBefore.add(N0__2_18DEC));

        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(exchangeRateAfter).to.be.equal(BigNumber.from("1333333333333333333"));
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(BigNumber.from("800000000000000000"))
        );
    });

    it("Should be able to unstake tokens which is not delegate when unstake without cool down fee change", async () => {
        //    given
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        const [admin] = accounts;

        await powerToken.stake(N1__0_18DEC);
        const balanceBefore = await powerToken.balanceOf(await admin.getAddress());
        const totalSupplyBefore = await powerToken.totalSupplyBase();
        const stakedTokenBalanceBefore = await stakedToken.balanceOf(await admin.getAddress());
        const exchangeRateBefore = await powerToken.calculateExchangeRate();
        const withdrawalFeeBefore = await powerToken.getUnstakeWithoutCooldownFee();

        await powerToken.delegateToLiquidityMining([tokens.lpTokenDai.address], [N0__6_18DEC]);
        //    when
        await powerToken.setUnstakeWithoutCooldownFee(N0__1_18DEC);
        await powerToken.unstake(N0__4_18DEC);

        //    then
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const balanceAfter = await powerToken.balanceOf(await admin.getAddress());
        const totalSupplyAfter = await powerToken.totalSupplyBase();
        const stakedTokenBalanceAfter = await stakedToken.balanceOf(await admin.getAddress());
        const exchangeRateAfter = await powerToken.calculateExchangeRate();
        const withdrawalFeeAfter = await powerToken.getUnstakeWithoutCooldownFee();

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(totalSupplyBefore).to.be.equal(N1__0_18DEC);

        expect(totalSupplyAfter).to.be.equal(totalSupplyBefore.sub(N0__4_18DEC));
        expect(balanceAfter).to.be.equal(BigNumber.from("640000000000000000"));
        expect(stakedTokenBalanceBefore).to.be.equal(BigNumber.from("99999999000000000000000000"));
        expect(stakedTokenBalanceAfter).to.be.equal(BigNumber.from("99999999360000000000000000"));

        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(exchangeRateAfter).to.be.equal(BigNumber.from("1066666666666666667"));

        expect(withdrawalFeeBefore).to.be.equal(N0__5_18DEC);
        expect(withdrawalFeeAfter).to.be.equal(N0__1_18DEC);
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(BigNumber.from("640000000000000000"))
        );
    });
});
