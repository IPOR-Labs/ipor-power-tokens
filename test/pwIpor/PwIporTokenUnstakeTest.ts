import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { IporToken, John, PwIporToken } from "../../types";
import { N1__0_18DEC, ZERO, TOTAL_SUPPLY_18_DECIMALS, N0__1_18DEC } from "../utils/Constants";
import { it } from "mocha";
import { getDeployedTokens, Tokens } from "../utils/JohnUtils";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PwIporToken unstake", () => {
    const N0__2_18DEC = N0__1_18DEC.mul(BigNumber.from("2"));
    const N0__4_18DEC = N0__1_18DEC.mul(BigNumber.from("4"));
    const N0__5_18DEC = N0__1_18DEC.mul(BigNumber.from("5"));
    const N0__6_18DEC = N0__1_18DEC.mul(BigNumber.from("6"));
    const N0__8_18DEC = N0__1_18DEC.mul(BigNumber.from("8"));
    let accounts: Signer[];
    let iporToken: IporToken;
    let pwIporToken: PwIporToken;
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
        const PwIporToken = await ethers.getContractFactory("PwIporToken");
        pwIporToken = (await upgrades.deployProxy(PwIporToken, [iporToken.address])) as PwIporToken;
        await iporToken.increaseAllowance(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);
        const John = await hre.ethers.getContractFactory("John");
        john = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address],
            pwIporToken.address,
            iporToken.address,
        ])) as John;

        await pwIporToken.setJohn(john.address);
    });

    it("Should not be able unstake when amount is zero", async () => {
        // given
        await pwIporToken.stake(N1__0_18DEC);

        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await pwIporToken.balanceOf(adminAddress);
        const totalSupplyBefore = await pwIporToken.totalSupplyBase();

        // when
        await expect(pwIporToken.unstake(ZERO)).to.be.revertedWith("IPOR_004");
        // then
        const balanceAfter = await pwIporToken.balanceOf(adminAddress);
        const totalSupplyAfter = await pwIporToken.totalSupplyBase();
        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
        expect(totalSupplyBefore).to.be.equal(N1__0_18DEC);
        expect(totalSupplyAfter).to.be.equal(N1__0_18DEC);
    });

    it("Should be able unstake", async () => {
        // given
        await pwIporToken.stake(N1__0_18DEC);

        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await pwIporToken.balanceOf(adminAddress);
        const totalSupplyBefore = await pwIporToken.totalSupplyBase();
        const iporBalanceBefore = await iporToken.balanceOf(adminAddress);

        // when
        await pwIporToken.unstake(N1__0_18DEC);
        // then
        const balanceAfter = await pwIporToken.balanceOf(adminAddress);
        const totalSupplyAfter = await pwIporToken.totalSupplyBase();
        const iporBalanceAfter = await iporToken.balanceOf(adminAddress);

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(ZERO);
        expect(totalSupplyBefore).to.be.equal(N1__0_18DEC);
        expect(totalSupplyAfter).to.be.equal(ZERO);
        expect(iporBalanceAfter).to.be.equal(iporBalanceBefore.add(N0__5_18DEC));
    });

    it("Should not be able to unstake when user delegated tokens to liquidity rewards contract", async () => {
        //    given
        await pwIporToken.stake(N1__0_18DEC);

        await pwIporToken.delegateToRewards(
            [tokens.ipTokenDai.address],
            [N0__1_18DEC.mul(BigNumber.from("6"))]
        );
        //    when
        await expect(pwIporToken.unstake(N0__1_18DEC.mul(BigNumber.from("6")))).to.be.revertedWith(
            "IPOR_707"
        );
    });

    it("Should be able to unstake tokens which is not delegate when he delegated tokens to liquidity rewards contract", async () => {
        //    given
        const [admin] = accounts;

        await pwIporToken.stake(N1__0_18DEC);
        const balanceBefore = await pwIporToken.balanceOf(await admin.getAddress());
        const totalSupplyBefore = await pwIporToken.totalSupplyBase();
        const iporBalanceBefore = await iporToken.balanceOf(await admin.getAddress());
        const exchangeRateBefore = await pwIporToken.exchangeRate();

        await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [N0__6_18DEC]);
        //    when
        await pwIporToken.unstake(N0__4_18DEC);

        //    then
        const balanceAfter = await pwIporToken.balanceOf(await admin.getAddress());
        const totalSupplyAfter = await pwIporToken.totalSupplyBase();
        const iporBalanceAfter = await iporToken.balanceOf(await admin.getAddress());
        const exchangeRateAfter = await pwIporToken.exchangeRate();

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(totalSupplyBefore).to.be.equal(N1__0_18DEC);

        expect(totalSupplyAfter).to.be.equal(totalSupplyBefore.sub(N0__4_18DEC));
        expect(balanceAfter).to.be.equal(N0__8_18DEC);
        expect(iporBalanceAfter).to.be.equal(iporBalanceBefore.add(N0__2_18DEC));

        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(exchangeRateAfter).to.be.equal(BigNumber.from("1333333333333333333"));
    });

    it("Should be able to unstake tokens which is not delegate when withdrawal fee change", async () => {
        //    given
        const [admin] = accounts;

        await pwIporToken.stake(N1__0_18DEC);
        const balanceBefore = await pwIporToken.balanceOf(await admin.getAddress());
        const totalSupplyBefore = await pwIporToken.totalSupplyBase();
        const iporBalanceBefore = await iporToken.balanceOf(await admin.getAddress());
        const exchangeRateBefore = await pwIporToken.exchangeRate();
        const withdrawalFeeBefore = await pwIporToken.withdrawalFee();

        await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [N0__6_18DEC]);
        //    when
        await pwIporToken.setWithdrawalFee(N0__1_18DEC);
        await pwIporToken.unstake(N0__4_18DEC);

        //    then
        const balanceAfter = await pwIporToken.balanceOf(await admin.getAddress());
        const totalSupplyAfter = await pwIporToken.totalSupplyBase();
        const iporBalanceAfter = await iporToken.balanceOf(await admin.getAddress());
        const exchangeRateAfter = await pwIporToken.exchangeRate();
        const withdrawalFeeAfter = await pwIporToken.withdrawalFee();

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
    });
});
