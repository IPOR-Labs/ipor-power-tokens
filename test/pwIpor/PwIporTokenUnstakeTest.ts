import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { IporToken, John, PowerIpor } from "../../types";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    N0__01_18DEC,
    N0__1_18DEC,
    N2__0_18DEC,
} from "../utils/Constants";
import { it } from "mocha";
import { getDeployedTokens, Tokens } from "../utils/JohnUtils";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PowerIpor unstake", () => {
    const N0__2_18DEC = N0__1_18DEC.mul(BigNumber.from("2"));
    const N0__25_18DEC = N0__01_18DEC.mul(BigNumber.from("25"));
    const N0__4_18DEC = N0__1_18DEC.mul(BigNumber.from("4"));
    const N0__5_18DEC = N0__1_18DEC.mul(BigNumber.from("5"));
    const N0__6_18DEC = N0__1_18DEC.mul(BigNumber.from("6"));
    const N0__8_18DEC = N0__1_18DEC.mul(BigNumber.from("8"));
    let accounts: Signer[];
    let iporToken: IporToken;
    let powerIpor: PowerIpor;
    let tokens: Tokens;
    let john: John;

    before(async () => {
        accounts = await ethers.getSigners();
        tokens = await getDeployedTokens(accounts);
    });

    beforeEach(async () => {
        const IporToken = await ethers.getContractFactory("IporToken");
        iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await accounts[0].getAddress()
        )) as IporToken;
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;
        await iporToken.increaseAllowance(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        const John = await hre.ethers.getContractFactory("John");
        john = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address],
            powerIpor.address,
            iporToken.address,
        ])) as John;

        await powerIpor.setJohn(john.address);
    });

    it("Should not be able set _unstakeWithoutCooldownFee to value highter than 1e18", async () => {
        await expect(powerIpor.setUnstakeWithoutCooldownFee(N2__0_18DEC)).to.be.revertedWith(
            "IPOR_714"
        );
    });

    it("Should not be able unstake when amount is zero", async () => {
        // given
        await powerIpor.stake(N1__0_18DEC);

        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await powerIpor.balanceOf(adminAddress);
        const totalSupplyBefore = await powerIpor.totalSupplyBase();

        // when
        await expect(powerIpor.unstake(ZERO)).to.be.revertedWith("IPOR_717");
        // then
        const balanceAfter = await powerIpor.balanceOf(adminAddress);
        const totalSupplyAfter = await powerIpor.totalSupplyBase();
        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
        expect(totalSupplyBefore).to.be.equal(N1__0_18DEC);
        expect(totalSupplyAfter).to.be.equal(N1__0_18DEC);
    });

    it("Should be able unstake", async () => {
        // given
        await powerIpor.stake(N1__0_18DEC);

        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await powerIpor.balanceOf(adminAddress);
        const totalSupplyBefore = await powerIpor.totalSupplyBase();
        const iporBalanceBefore = await iporToken.balanceOf(adminAddress);
        const exchangeRateBefore = await powerIpor.calculateExchangeRate();

        // when
        await powerIpor.unstake(N1__0_18DEC);

        // then
        const exchangeRateAfter = await powerIpor.calculateExchangeRate();
        const balanceAfter = await powerIpor.balanceOf(adminAddress);
        const totalSupplyAfter = await powerIpor.totalSupplyBase();
        const iporBalanceAfter = await iporToken.balanceOf(adminAddress);

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(ZERO);
        expect(totalSupplyBefore).to.be.equal(N1__0_18DEC);
        expect(totalSupplyAfter).to.be.equal(ZERO);
        expect(iporBalanceAfter).to.be.equal(iporBalanceBefore.add(N0__5_18DEC));
        expect(exchangeRateBefore).to.be.equal(exchangeRateAfter);
    });

    it("Should be able unstake part of staked balance", async () => {
        // given
        await powerIpor.stake(N1__0_18DEC);

        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await powerIpor.balanceOf(adminAddress);
        const totalSupplyBefore = await powerIpor.totalSupplyBase();
        const iporBalanceBefore = await iporToken.balanceOf(adminAddress);
        const exchangeRateBefore = await powerIpor.calculateExchangeRate();

        // when
        await powerIpor.unstake(N0__5_18DEC);

        // then
        const exchangeRateAfter = await powerIpor.calculateExchangeRate();
        const balanceAfter = await powerIpor.balanceOf(adminAddress);
        const totalSupplyAfter = await powerIpor.totalSupplyBase();
        const iporBalanceAfter = await iporToken.balanceOf(adminAddress);

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(BigNumber.from("750000000000000000"));
        expect(totalSupplyBefore).to.be.equal(N1__0_18DEC);
        expect(totalSupplyAfter).to.be.equal(BigNumber.from("500000000000000000"));
        expect(iporBalanceAfter).to.be.equal(iporBalanceBefore.add(N0__25_18DEC));
        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(exchangeRateAfter).to.be.equal(BigNumber.from("1500000000000000000"));
    });

    it("Should not be able to unstake when user delegated tokens to John", async () => {
        //    given
        await powerIpor.stake(N1__0_18DEC);

        await powerIpor.delegateToJohn(
            [tokens.ipTokenDai.address],
            [N0__1_18DEC.mul(BigNumber.from("6"))]
        );
        //    when
        await expect(powerIpor.unstake(N0__1_18DEC.mul(BigNumber.from("6")))).to.be.revertedWith(
            "IPOR_708"
        );
    });

    it("Should be able to unstake tokens which is not delegate when he delegated tokens to John", async () => {
        //    given
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const [admin] = accounts;

        await powerIpor.stake(N1__0_18DEC);
        const balanceBefore = await powerIpor.balanceOf(await admin.getAddress());
        const totalSupplyBefore = await powerIpor.totalSupplyBase();
        const iporBalanceBefore = await iporToken.balanceOf(await admin.getAddress());
        const exchangeRateBefore = await powerIpor.calculateExchangeRate();

        await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [N0__6_18DEC]);
        //    when
        await powerIpor.unstake(N0__4_18DEC);

        //    then
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const balanceAfter = await powerIpor.balanceOf(await admin.getAddress());
        const totalSupplyAfter = await powerIpor.totalSupplyBase();
        const iporBalanceAfter = await iporToken.balanceOf(await admin.getAddress());
        const exchangeRateAfter = await powerIpor.calculateExchangeRate();

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(totalSupplyBefore).to.be.equal(N1__0_18DEC);

        expect(totalSupplyAfter).to.be.equal(totalSupplyBefore.sub(N0__4_18DEC));
        expect(balanceAfter).to.be.equal(N0__8_18DEC);
        expect(iporBalanceAfter).to.be.equal(iporBalanceBefore.add(N0__2_18DEC));

        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(exchangeRateAfter).to.be.equal(BigNumber.from("1333333333333333333"));
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(BigNumber.from("800000000000000000"))
        );
    });

    it("Should be able to unstake tokens which is not delegate when unstake without cool down fee change", async () => {
        //    given
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const [admin] = accounts;

        await powerIpor.stake(N1__0_18DEC);
        const balanceBefore = await powerIpor.balanceOf(await admin.getAddress());
        const totalSupplyBefore = await powerIpor.totalSupplyBase();
        const iporBalanceBefore = await iporToken.balanceOf(await admin.getAddress());
        const exchangeRateBefore = await powerIpor.calculateExchangeRate();
        const withdrawalFeeBefore = await powerIpor.getUnstakeWithoutCooldownFee();

        await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [N0__6_18DEC]);
        //    when
        await powerIpor.setUnstakeWithoutCooldownFee(N0__1_18DEC);
        await powerIpor.unstake(N0__4_18DEC);

        //    then
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const balanceAfter = await powerIpor.balanceOf(await admin.getAddress());
        const totalSupplyAfter = await powerIpor.totalSupplyBase();
        const iporBalanceAfter = await iporToken.balanceOf(await admin.getAddress());
        const exchangeRateAfter = await powerIpor.calculateExchangeRate();
        const withdrawalFeeAfter = await powerIpor.getUnstakeWithoutCooldownFee();

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(totalSupplyBefore).to.be.equal(N1__0_18DEC);

        expect(totalSupplyAfter).to.be.equal(totalSupplyBefore.sub(N0__4_18DEC));
        expect(balanceAfter).to.be.equal(BigNumber.from("640000000000000000"));
        expect(iporBalanceBefore).to.be.equal(BigNumber.from("99999999000000000000000000"));
        expect(iporBalanceAfter).to.be.equal(BigNumber.from("99999999360000000000000000"));

        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(exchangeRateAfter).to.be.equal(BigNumber.from("1066666666666666667"));

        expect(withdrawalFeeBefore).to.be.equal(N0__5_18DEC);
        expect(withdrawalFeeAfter).to.be.equal(N0__1_18DEC);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(BigNumber.from("640000000000000000"))
        );
    });
});
