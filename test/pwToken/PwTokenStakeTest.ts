import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockStakedToken, PowerToken } from "../../types";
import { N1__0_18DEC, ZERO, TOTAL_SUPPLY_18_DECIMALS, N0__1_18DEC } from "../utils/Constants";
import { it } from "mocha";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PowerToken configuration, deploy tests", () => {
    let accounts: Signer[];
    let stakedToken: MockStakedToken;
    let powerToken: PowerToken;

    before(async () => {
        accounts = await ethers.getSigners();
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
    });

    it("Should not be able stake when amount is zero", async () => {
        // given
        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await powerToken.balanceOf(adminAddress);
        const totalSupplyBefore = await powerToken.totalSupplyBase();
        // when
        await expect(powerToken.stake(ZERO)).to.be.revertedWith("PT_717");
        // then
        const balanceAfter = await powerToken.balanceOf(adminAddress);
        const totalSupplyAfter = await powerToken.totalSupplyBase();
        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
        expect(totalSupplyBefore).to.be.equal(ZERO);
        expect(totalSupplyAfter).to.be.equal(ZERO);
    });

    it("Should be able stake", async () => {
        // given
        await stakedToken.increaseAllowance(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);

        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await powerToken.balanceOf(adminAddress);

        // when
        await powerToken.stake(N1__0_18DEC);
        // then
        const balanceAfter = await powerToken.balanceOf(adminAddress);
        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
    });

    it("Should the exchange rate be one when the power token was deployed", async () => {
        // then
        const exchangeRate = await powerToken.calculateExchangeRate();

        expect(exchangeRate).to.be.equal(N1__0_18DEC);
    });

    it("Should exchange rate increase when transfer stakedToken to powerToken address", async () => {
        // given
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        const stakeStakedTokenAmount = N1__0_18DEC;
        const transferStakedTokenAmount = N1__0_18DEC;

        const two = N1__0_18DEC.mul(BigNumber.from("2"));
        await stakedToken.increaseAllowance(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);

        const adminAddress = await accounts[0].getAddress();
        const exchangeRateBefore = await powerToken.calculateExchangeRate();
        const balanceBefore = await powerToken.balanceOf(adminAddress);

        // when
        await powerToken.stake(stakeStakedTokenAmount);
        await stakedToken.transfer(powerToken.address, transferStakedTokenAmount);

        // then
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const exchangeRateAfter = await powerToken.calculateExchangeRate();
        const balanceAfter = await powerToken.balanceOf(adminAddress);

        expect(balanceBefore).to.be.equal(ZERO);
        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(two);
        expect(exchangeRateAfter).to.be.equal(two);
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore
                .add(transferStakedTokenAmount)
                .add(stakeStakedTokenAmount)
        );
    });

    it("Should increase balance of users when exchange rate increase", async () => {
        //    given
        const stakedTokenStakeAmount = N1__0_18DEC;
        const stakedTokenTransferAmount = N1__0_18DEC;
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        const [admin, userOne, userTwo] = accounts;
        await stakedToken.transfer(await userOne.getAddress(), N1__0_18DEC);
        await stakedToken.transfer(await userTwo.getAddress(), N1__0_18DEC);
        await stakedToken
            .connect(userOne)
            .increaseAllowance(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await stakedToken
            .connect(userTwo)
            .increaseAllowance(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);

        await powerToken.connect(userOne).stake(stakedTokenStakeAmount);
        await powerToken.connect(userTwo).stake(stakedTokenStakeAmount);

        const userOneBalanceBefore = await powerToken.balanceOf(await userOne.getAddress());
        const userTwoBalanceBefore = await powerToken.balanceOf(await userTwo.getAddress());
        const exchangeRateBefore = await powerToken.calculateExchangeRate();

        //    when
        await stakedToken.transfer(powerToken.address, stakedTokenTransferAmount);

        //    then
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const userOneBalanceAfter = await powerToken.balanceOf(await userOne.getAddress());
        const userTwoBalanceAfter = await powerToken.balanceOf(await userTwo.getAddress());
        const exchangeRateAfter = await powerToken.calculateExchangeRate();
        const N1__5_18DEC = N0__1_18DEC.mul(BigNumber.from("15"));

        expect(userOneBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(userTwoBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(userOneBalanceAfter).to.be.equal(N1__5_18DEC);
        expect(userTwoBalanceAfter).to.be.equal(N1__5_18DEC);
        expect(exchangeRateAfter).to.be.equal(N1__5_18DEC);
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore
                .add(stakedTokenTransferAmount)
                .add(stakedTokenStakeAmount)
                .add(stakedTokenStakeAmount)
        );
    });
    it("Should increase balance of userOne and no increase userTwo when exchange rate increase before userTwo stake", async () => {
        //    given
        const stakedTokenStakeAmount = N1__0_18DEC;
        const stakedTokenTransferAmount = N1__0_18DEC;
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        const [admin, userOne, userTwo] = accounts;
        await stakedToken.transfer(await userOne.getAddress(), N1__0_18DEC);
        await stakedToken.transfer(await userTwo.getAddress(), N1__0_18DEC);
        await stakedToken
            .connect(userOne)
            .increaseAllowance(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await stakedToken
            .connect(userTwo)
            .increaseAllowance(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);

        await powerToken.connect(userOne).stake(stakedTokenStakeAmount);

        const userOneBalanceBefore = await powerToken.balanceOf(await userOne.getAddress());
        const userTwoBalanceBefore = await powerToken.balanceOf(await userTwo.getAddress());
        const exchangeRateBefore = await powerToken.calculateExchangeRate();

        //    when
        await stakedToken.transfer(powerToken.address, stakedTokenTransferAmount);
        await powerToken.connect(userTwo).stake(stakedTokenStakeAmount);

        //    then
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const userOneBalanceAfter = await powerToken.balanceOf(await userOne.getAddress());
        const userTwoBalanceAfter = await powerToken.balanceOf(await userTwo.getAddress());
        const exchangeRateAfter = await powerToken.calculateExchangeRate();
        const N2__0_18DEC = N1__0_18DEC.mul(BigNumber.from("2"));

        expect(userOneBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(userTwoBalanceBefore).to.be.equal(ZERO);
        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(userOneBalanceAfter).to.be.equal(N2__0_18DEC);
        expect(userTwoBalanceAfter).to.be.equal(N1__0_18DEC);
        expect(exchangeRateAfter).to.be.equal(N2__0_18DEC);
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore
                .add(stakedTokenTransferAmount)
                .add(stakedTokenStakeAmount)
                .add(stakedTokenStakeAmount)
        );
    });
});
