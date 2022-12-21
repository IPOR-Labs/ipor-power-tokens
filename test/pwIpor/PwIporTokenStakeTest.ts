import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockIporToken, PowerIpor } from "../../types";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    N0__1_18DEC,
} from "../utils/Constants";
import { it } from "mocha";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PowerIpor configuration, deploy tests", () => {
    let accounts: Signer[];
    let iporToken: MockIporToken;
    let powerIpor: PowerIpor;

    before(async () => {
        accounts = await ethers.getSigners();
    });

    beforeEach(async () => {
        const IporToken = await ethers.getContractFactory("MockIporToken");
        iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await accounts[0].getAddress()
        )) as MockIporToken;
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;
    });

    it("Should not be able stake when amount is zero", async () => {
        // given
        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await powerIpor.balanceOf(adminAddress);
        const totalSupplyBefore = await powerIpor.totalSupplyBase();
        // when
        await expect(powerIpor.stake(ZERO)).to.be.revertedWith("IPOR_717");
        // then
        const balanceAfter = await powerIpor.balanceOf(adminAddress);
        const totalSupplyAfter = await powerIpor.totalSupplyBase();
        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
        expect(totalSupplyBefore).to.be.equal(ZERO);
        expect(totalSupplyAfter).to.be.equal(ZERO);
    });

    it("Should be able stake", async () => {
        // given
        await iporToken.increaseAllowance(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);

        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await powerIpor.balanceOf(adminAddress);

        // when
        await powerIpor.stake(N1__0_18DEC);
        // then
        const balanceAfter = await powerIpor.balanceOf(adminAddress);
        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
    });

    it("Should the exchange rate be one when the power token was deployed", async () => {
        // then
        const exchangeRate = await powerIpor.calculateExchangeRate();

        expect(exchangeRate).to.be.equal(N1__0_18DEC);
    });

    it("Should exchange rate increase when transfer iporToken to powerIpor address", async () => {
        // given
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const stakeIporTokenAmount = N1__0_18DEC;
        const transferIporTokenAmount = N1__0_18DEC;

        const two = N1__0_18DEC.mul(BigNumber.from("2"));
        await iporToken.increaseAllowance(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);

        const adminAddress = await accounts[0].getAddress();
        const exchangeRateBefore = await powerIpor.calculateExchangeRate();
        const balanceBefore = await powerIpor.balanceOf(adminAddress);

        // when
        await powerIpor.stake(stakeIporTokenAmount);
        await iporToken.transfer(powerIpor.address, transferIporTokenAmount);

        // then
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const exchangeRateAfter = await powerIpor.calculateExchangeRate();
        const balanceAfter = await powerIpor.balanceOf(adminAddress);

        expect(balanceBefore).to.be.equal(ZERO);
        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(two);
        expect(exchangeRateAfter).to.be.equal(two);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(transferIporTokenAmount).add(stakeIporTokenAmount)
        );
    });

    it("Should increase balance of users when exchange rate increase", async () => {
        //    given
        const iporTokenStakeAmount = N1__0_18DEC;
        const iporTokenTransferAmount = N1__0_18DEC;
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const [admin, userOne, userTwo] = accounts;
        await iporToken.transfer(await userOne.getAddress(), N1__0_18DEC);
        await iporToken.transfer(await userTwo.getAddress(), N1__0_18DEC);
        await iporToken
            .connect(userOne)
            .increaseAllowance(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken
            .connect(userTwo)
            .increaseAllowance(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);

        await powerIpor.connect(userOne).stake(iporTokenStakeAmount);
        await powerIpor.connect(userTwo).stake(iporTokenStakeAmount);

        const userOneBalanceBefore = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoBalanceBefore = await powerIpor.balanceOf(await userTwo.getAddress());
        const exchangeRateBefore = await powerIpor.calculateExchangeRate();

        //    when
        await iporToken.transfer(powerIpor.address, iporTokenTransferAmount);

        //    then
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const userOneBalanceAfter = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoBalanceAfter = await powerIpor.balanceOf(await userTwo.getAddress());
        const exchangeRateAfter = await powerIpor.calculateExchangeRate();
        const N1__5_18DEC = N0__1_18DEC.mul(BigNumber.from("15"));

        expect(userOneBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(userTwoBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(userOneBalanceAfter).to.be.equal(N1__5_18DEC);
        expect(userTwoBalanceAfter).to.be.equal(N1__5_18DEC);
        expect(exchangeRateAfter).to.be.equal(N1__5_18DEC);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore
                .add(iporTokenTransferAmount)
                .add(iporTokenStakeAmount)
                .add(iporTokenStakeAmount)
        );
    });
    it("Should increase balance of userOne and no increase userTwo when exchange rate increase before userTwo stake", async () => {
        //    given
        const iporTokenStakeAmount = N1__0_18DEC;
        const iporTokenTransferAmount = N1__0_18DEC;
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const [admin, userOne, userTwo] = accounts;
        await iporToken.transfer(await userOne.getAddress(), N1__0_18DEC);
        await iporToken.transfer(await userTwo.getAddress(), N1__0_18DEC);
        await iporToken
            .connect(userOne)
            .increaseAllowance(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken
            .connect(userTwo)
            .increaseAllowance(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);

        await powerIpor.connect(userOne).stake(iporTokenStakeAmount);

        const userOneBalanceBefore = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoBalanceBefore = await powerIpor.balanceOf(await userTwo.getAddress());
        const exchangeRateBefore = await powerIpor.calculateExchangeRate();

        //    when
        await iporToken.transfer(powerIpor.address, iporTokenTransferAmount);
        await powerIpor.connect(userTwo).stake(iporTokenStakeAmount);

        //    then
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const userOneBalanceAfter = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoBalanceAfter = await powerIpor.balanceOf(await userTwo.getAddress());
        const exchangeRateAfter = await powerIpor.calculateExchangeRate();
        const N2__0_18DEC = N1__0_18DEC.mul(BigNumber.from("2"));

        expect(userOneBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(userTwoBalanceBefore).to.be.equal(ZERO);
        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(userOneBalanceAfter).to.be.equal(N2__0_18DEC);
        expect(userTwoBalanceAfter).to.be.equal(N1__0_18DEC);
        expect(exchangeRateAfter).to.be.equal(N2__0_18DEC);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore
                .add(iporTokenTransferAmount)
                .add(iporTokenStakeAmount)
                .add(iporTokenStakeAmount)
        );
    });
});
