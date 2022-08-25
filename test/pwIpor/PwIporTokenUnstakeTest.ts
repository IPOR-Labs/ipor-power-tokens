import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { IporToken, LiquidityRewards, PwIporToken } from "../../types";
import { N1__0_18DEC, ZERO, TOTAL_SUPPLY_18_DECIMALS, N0__1_18DEC } from "../utils/Constants";
import { it } from "mocha";
import { getDeployedTokens, Tokens } from "../utils/LiquidityRewardsUtils";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PwIporToken unstake", () => {
    let accounts: Signer[];
    let iporToken: IporToken;
    let pwIporToken: PwIporToken;
    let tokens: Tokens;
    let liquidityRewards: LiquidityRewards;

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
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [tokens.ipTokenDai.address],
            pwIporToken.address,
            iporToken.address,
        ])) as LiquidityRewards;

        await pwIporToken.setLiquidityRewardsAddress(liquidityRewards.address);
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
        console.log("######## balanceBefore ", balanceBefore.toString());
        console.log("######## totalSupplyBefore ", totalSupplyBefore.toString());

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
        expect(iporBalanceAfter).to.be.equal(iporBalanceBefore.add(N1__0_18DEC));
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
            "IPOR_709"
        );
    });

    it("Should be able to unstake tokens which is not delegate when he delegated tokens to liquidity rewards contract", async () => {
        //    given
        const [admin] = accounts;
        const N0__4_18DEC = N0__1_18DEC.mul(BigNumber.from("4"));
        const N0__6_18DEC = N0__1_18DEC.mul(BigNumber.from("6"));

        await pwIporToken.stake(N1__0_18DEC);
        const balanceBefore = await pwIporToken.balanceOf(await admin.getAddress());
        const totalSupplyBefore = await pwIporToken.totalSupplyBase();
        const iporBalanceBefore = await iporToken.balanceOf(await admin.getAddress());

        await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [N0__6_18DEC]);
        //    when
        await pwIporToken.unstake(N0__4_18DEC);

        //    then
        const balanceAfter = await pwIporToken.balanceOf(await admin.getAddress());
        const totalSupplyAfter = await pwIporToken.totalSupplyBase();
        const iporBalanceAfter = await iporToken.balanceOf(await admin.getAddress());

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(totalSupplyBefore).to.be.equal(N1__0_18DEC);

        expect(totalSupplyAfter).to.be.equal(totalSupplyBefore.sub(N0__4_18DEC));
        expect(balanceAfter).to.be.equal(balanceBefore.sub(N0__4_18DEC));
        expect(iporBalanceAfter).to.be.equal(iporBalanceBefore.add(N0__4_18DEC));
    });
});
