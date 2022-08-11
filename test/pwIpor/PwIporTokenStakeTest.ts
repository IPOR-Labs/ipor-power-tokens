import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { IporToken, PwIporToken } from "../../types";
import { N1__0_18DEC, ZERO, TOTAL_SUPPLY_18_DECIMALS, N0__1_18DEC } from "../utils/Constants";
import { it } from "mocha";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PwIporToken configuration, deploy tests", () => {
    let accounts: Signer[];
    let iporToken: IporToken;
    let pwIporToken: PwIporToken;

    before(async () => {
        accounts = await ethers.getSigners();
    });

    beforeEach(async () => {
        const IporToken = await ethers.getContractFactory("IporToken");
        iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await accounts[0].getAddress()
        )) as IporToken;
        const PwIporToken = await ethers.getContractFactory("PwIporToken");
        pwIporToken = (await upgrades.deployProxy(PwIporToken, [iporToken.address])) as PwIporToken;
    });

    it("Should not be able stake when amount is zero", async () => {
        // given
        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await pwIporToken.balanceOf(adminAddress);
        const totalSupplyBefore = await pwIporToken.totalSupplyBase();
        // when
        await expect(pwIporToken.stake(ZERO)).to.be.revertedWith("IPOR_004");
        // then
        const balanceAfter = await pwIporToken.balanceOf(adminAddress);
        const totalSupplyAfter = await pwIporToken.totalSupplyBase();
        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
        expect(totalSupplyBefore).to.be.equal(ZERO);
        expect(totalSupplyAfter).to.be.equal(ZERO);
    });

    it("Should be able stake", async () => {
        // given
        await iporToken.increaseAllowance(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);

        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await pwIporToken.balanceOf(adminAddress);

        // when
        await pwIporToken.stake(N1__0_18DEC);
        // then
        const balanceAfter = await pwIporToken.balanceOf(adminAddress);
        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
    });

    it("Should the exchange rate be one when the power token was deployed", async () => {
        // then
        const exchangeRate = await pwIporToken.exchangeRate();

        expect(exchangeRate).to.be.equal(N1__0_18DEC);
    });

    it("Should exchange rate increase when transfer iporToken to pwIporToken address", async () => {
        // given
        const two = N1__0_18DEC.mul(BigNumber.from("2"));
        await iporToken.increaseAllowance(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);

        const adminAddress = await accounts[0].getAddress();
        const exchangeRateBefore = await pwIporToken.exchangeRate();
        const balanceBefore = await pwIporToken.balanceOf(adminAddress);

        // when
        await pwIporToken.stake(N1__0_18DEC);
        await iporToken.transfer(pwIporToken.address, N1__0_18DEC);

        // then

        const exchangeRateAfter = await pwIporToken.exchangeRate();
        const balanceAfter = await pwIporToken.balanceOf(adminAddress);

        expect(balanceBefore).to.be.equal(ZERO);
        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(two);
        expect(exchangeRateAfter).to.be.equal(two);
    });

    it("Should increase balance of users when exchange rate increase", async () => {
        //    given
        const [admin, userOne, userTwo] = accounts;
        await iporToken.transfer(await userOne.getAddress(), N1__0_18DEC);
        await iporToken.transfer(await userTwo.getAddress(), N1__0_18DEC);
        await iporToken
            .connect(userOne)
            .increaseAllowance(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken
            .connect(userTwo)
            .increaseAllowance(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);

        await pwIporToken.connect(userOne).stake(N1__0_18DEC);
        await pwIporToken.connect(userTwo).stake(N1__0_18DEC);

        const userOneBalanceBefore = await pwIporToken.balanceOf(await userOne.getAddress());
        const userTwoBalanceBefore = await pwIporToken.balanceOf(await userTwo.getAddress());
        const exchangeRateBefore = await pwIporToken.exchangeRate();

        //    when
        await iporToken.transfer(pwIporToken.address, N1__0_18DEC);

        //    then
        const userOneBalanceAfter = await pwIporToken.balanceOf(await userOne.getAddress());
        const userTwoBalanceAfter = await pwIporToken.balanceOf(await userTwo.getAddress());
        const exchangeRateAfter = await pwIporToken.exchangeRate();
        const N1__5_18DEC = N0__1_18DEC.mul(BigNumber.from("15"));

        expect(userOneBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(userTwoBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(userOneBalanceAfter).to.be.equal(N1__5_18DEC);
        expect(userTwoBalanceAfter).to.be.equal(N1__5_18DEC);
        expect(exchangeRateAfter).to.be.equal(N1__5_18DEC);
    });
    //TODO: Add more random numbers tests
    it("Should increase balance of userOne and no increase userTwo when exchange rate increase before userTwo stake", async () => {
        //    given
        const [admin, userOne, userTwo] = accounts;
        await iporToken.transfer(await userOne.getAddress(), N1__0_18DEC);
        await iporToken.transfer(await userTwo.getAddress(), N1__0_18DEC);
        await iporToken
            .connect(userOne)
            .increaseAllowance(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken
            .connect(userTwo)
            .increaseAllowance(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);

        await pwIporToken.connect(userOne).stake(N1__0_18DEC);

        const userOneBalanceBefore = await pwIporToken.balanceOf(await userOne.getAddress());
        const userTwoBalanceBefore = await pwIporToken.balanceOf(await userTwo.getAddress());
        const exchangeRateBefore = await pwIporToken.exchangeRate();

        //    when
        await iporToken.transfer(pwIporToken.address, N1__0_18DEC);
        await pwIporToken.connect(userTwo).stake(N1__0_18DEC);

        //    then
        const userOneBalanceAfter = await pwIporToken.balanceOf(await userOne.getAddress());
        const userTwoBalanceAfter = await pwIporToken.balanceOf(await userTwo.getAddress());
        const exchangeRateAfter = await pwIporToken.exchangeRate();
        const N2__0_18DEC = N1__0_18DEC.mul(BigNumber.from("2"));

        expect(userOneBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(userTwoBalanceBefore).to.be.equal(ZERO);
        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(userOneBalanceAfter).to.be.equal(N2__0_18DEC);
        expect(userTwoBalanceAfter).to.be.equal(N1__0_18DEC);
        expect(exchangeRateAfter).to.be.equal(N2__0_18DEC);
    });
});
