import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { IporToken, LiquidityRewards, PwIporToken } from "../../types";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    N0__1_18DEC,
    COOLDOWN_SECONDS,
} from "../utils/Constants";
import { it } from "mocha";
import { getDeployedTokens, Tokens } from "../utils/LiquidityRewardsUtils";
import exp from "constants";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

const getTimeInSeconds = () => BigNumber.from(Math.floor(new Date().getTime() / 1000));

describe("PwIporToken unstake", () => {
    const N2__0_18DEC = N1__0_18DEC.mul(BigNumber.from("2"));
    const N0__5_18DEC = N0__1_18DEC.mul(BigNumber.from("5"));
    const N0__6_18DEC = N0__1_18DEC.mul(BigNumber.from("6"));
    const N0__8_18DEC = N0__1_18DEC.mul(BigNumber.from("8"));
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

    it("Should not be able coolDown when amount is zero", async () => {
        // given
        await pwIporToken.stake(N1__0_18DEC);

        const coolDownBefore = await pwIporToken.activeCoolDown();

        // when
        await expect(pwIporToken.coolDown(ZERO)).to.be.revertedWith("IPOR_004");

        // then
        const coolDownAfter = await pwIporToken.activeCoolDown();

        expect(coolDownBefore.coolDownFinish).to.be.equal(ZERO);
        expect(coolDownBefore.amount).to.be.equal(ZERO);
        expect(coolDownAfter.coolDownFinish).to.be.equal(ZERO);
        expect(coolDownAfter.amount).to.be.equal(ZERO);
    });

    it("Should not be able coolDown when amount is to big", async () => {
        // given
        await pwIporToken.stake(N1__0_18DEC);

        const coolDownBefore = await pwIporToken.activeCoolDown();

        // when
        await expect(pwIporToken.coolDown(N2__0_18DEC)).to.be.revertedWith("IPOR_709");

        // then
        const coolDownAfter = await pwIporToken.activeCoolDown();

        expect(coolDownBefore.coolDownFinish).to.be.equal(ZERO);
        expect(coolDownBefore.amount).to.be.equal(ZERO);
        expect(coolDownAfter.coolDownFinish).to.be.equal(ZERO);
        expect(coolDownAfter.amount).to.be.equal(ZERO);
    });

    it("Should be able cool down when amount is zero", async () => {
        // given
        const nowInSeconds = getTimeInSeconds();
        await pwIporToken.stake(N1__0_18DEC);

        const coolDownBefore = await pwIporToken.activeCoolDown();

        // when
        await pwIporToken.coolDown(N0__5_18DEC);

        // then
        const coolDownAfter = await pwIporToken.activeCoolDown();

        expect(coolDownBefore.coolDownFinish).to.be.equal(ZERO);
        expect(coolDownBefore.amount).to.be.equal(ZERO);
        expect(coolDownAfter.coolDownFinish.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownAfter.amount).to.be.equal(N0__5_18DEC);
    });

    it("Should be able to override cool down when second time execute method ", async () => {
        // given
        const nowInSeconds = getTimeInSeconds();
        await pwIporToken.stake(N1__0_18DEC);

        await pwIporToken.coolDown(N0__5_18DEC);
        const coolDownBefore = await pwIporToken.activeCoolDown();
        // when

        await pwIporToken.coolDown(N0__6_18DEC);

        // then
        const coolDownAfter = await pwIporToken.activeCoolDown();

        expect(coolDownBefore.coolDownFinish.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownBefore.amount).to.be.equal(N0__5_18DEC);

        expect(coolDownAfter.coolDownFinish.gt(coolDownBefore.coolDownFinish)).to.be.true;
        expect(coolDownAfter.amount).to.be.equal(N0__6_18DEC);
    });

    it("Should be able to cancel cool down", async () => {
        // given
        const nowInSeconds = getTimeInSeconds();
        await pwIporToken.stake(N1__0_18DEC);

        await pwIporToken.coolDown(N0__5_18DEC);
        const coolDownBefore = await pwIporToken.activeCoolDown();
        // when

        await pwIporToken.cancelCoolDown();

        // then
        const coolDownAfter = await pwIporToken.activeCoolDown();

        expect(coolDownBefore.coolDownFinish.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownBefore.amount).to.be.equal(N0__5_18DEC);

        expect(coolDownAfter.coolDownFinish).to.be.equal(ZERO);
        expect(coolDownAfter.amount).to.be.equal(ZERO);
    });

    it("Should not be able to unstake when some amount is in cool down state", async () => {
        // given
        const adminAddress = await accounts[0].getAddress();
        const nowInSeconds = getTimeInSeconds();

        await pwIporToken.stake(N1__0_18DEC);
        await pwIporToken.coolDown(N0__8_18DEC);

        const coolDownBefore = await pwIporToken.activeCoolDown();
        const balanceBefore = await pwIporToken.balanceOf(adminAddress);
        // when

        await expect(pwIporToken.unstake(N0__5_18DEC)).to.be.revertedWith("IPOR_709");

        // then
        const coolDownAfter = await pwIporToken.activeCoolDown();
        const balanceAfter = await pwIporToken.balanceOf(adminAddress);

        expect(coolDownBefore.coolDownFinish.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownBefore.amount).to.be.equal(N0__8_18DEC);
        expect(coolDownAfter.coolDownFinish.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownAfter.amount).to.be.equal(N0__8_18DEC);

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
    });

    it("Should not be able to delegate when some amount is in cool down state", async () => {
        // given
        const adminAddress = await accounts[0].getAddress();
        const nowInSeconds = getTimeInSeconds();

        await pwIporToken.stake(N1__0_18DEC);
        await pwIporToken.coolDown(N0__8_18DEC);

        const coolDownBefore = await pwIporToken.activeCoolDown();
        const balanceBefore = await pwIporToken.balanceOf(adminAddress);
        const delegatedBalanceBefore = await pwIporToken.delegatedBalanceOf(adminAddress);
        // when

        await expect(
            pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [N0__5_18DEC])
        ).to.be.revertedWith("IPOR_700");

        // then
        const coolDownAfter = await pwIporToken.activeCoolDown();
        const balanceAfter = await pwIporToken.balanceOf(adminAddress);
        const delegatedBalanceAfter = await pwIporToken.delegatedBalanceOf(adminAddress);

        expect(coolDownBefore.coolDownFinish.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownBefore.amount).to.be.equal(N0__8_18DEC);
        expect(coolDownAfter.coolDownFinish.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownAfter.amount).to.be.equal(N0__8_18DEC);

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(ZERO);
    });

    it("Should not be able to redeem cool down tokens when time not pass", async () => {
        // given
        const nowInSeconds = getTimeInSeconds();
        await pwIporToken.stake(N1__0_18DEC);

        await pwIporToken.coolDown(N0__5_18DEC);
        const coolDownBefore = await pwIporToken.activeCoolDown();
        // when

        await expect(pwIporToken.redeem()).to.be.revertedWith("IPOR_709");

        // then
        const coolDownAfter = await pwIporToken.activeCoolDown();

        expect(coolDownBefore.coolDownFinish.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownBefore.amount).to.be.equal(N0__5_18DEC);

        expect(coolDownAfter.coolDownFinish.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownAfter.amount).to.be.equal(N0__5_18DEC);
    });

    it("Should be able to redeem cool down tokens when 2 weeks pass", async () => {
        // given
        const twoWeekesInSeconds = 2 * 7 * 24 * 60 * 60;
        const adminAddress = await accounts[0].getAddress();
        const nowInSeconds = getTimeInSeconds();
        await pwIporToken.stake(N1__0_18DEC);
        const pwBalanceBefore = await pwIporToken.balanceOf(adminAddress);

        await pwIporToken.coolDown(N0__5_18DEC);
        const coolDownBefore = await pwIporToken.activeCoolDown();
        // when
        await hre.network.provider.send("evm_increaseTime", [twoWeekesInSeconds + 1]);
        await pwIporToken.redeem();

        // then
        const coolDownAfter = await pwIporToken.activeCoolDown();
        const pwBalanceAfter = await pwIporToken.balanceOf(adminAddress);

        expect(coolDownBefore.coolDownFinish.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownBefore.amount).to.be.equal(N0__5_18DEC);

        expect(coolDownAfter.coolDownFinish).to.be.equal(ZERO);
        expect(coolDownAfter.amount).to.be.equal(ZERO);

        expect(pwBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(pwBalanceAfter).to.be.equal(N0__5_18DEC);
    });

    it("Should be able to redeem cool down tokens when 2 weeks pass and exchange rate changed", async () => {
        // given
        const twoWeekesInSeconds = 2 * 7 * 24 * 60 * 60;
        const adminAddress = await accounts[0].getAddress();
        const nowInSeconds = getTimeInSeconds();
        await pwIporToken.stake(N1__0_18DEC);
        const pwBalanceBefore = await pwIporToken.balanceOf(adminAddress);

        await pwIporToken.coolDown(N0__5_18DEC);
        await iporToken.transfer(pwIporToken.address, N1__0_18DEC);

        const coolDownBefore = await pwIporToken.activeCoolDown();
        const iporTokenBalanceBefore = await iporToken.balanceOf(adminAddress);

        // when
        await hre.network.provider.send("evm_increaseTime", [twoWeekesInSeconds + 1]);
        await pwIporToken.redeem();

        // then
        const coolDownAfter = await pwIporToken.activeCoolDown();
        const pwBalanceAfter = await pwIporToken.balanceOf(adminAddress);
        const iporTokenBalanceAfter = await iporToken.balanceOf(adminAddress);

        expect(coolDownBefore.coolDownFinish.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownBefore.amount).to.be.equal(N0__5_18DEC);

        expect(coolDownAfter.coolDownFinish).to.be.equal(ZERO);
        expect(coolDownAfter.amount).to.be.equal(ZERO);

        expect(pwBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(pwBalanceAfter).to.be.equal(N1__0_18DEC.add(N0__5_18DEC));

        expect(iporTokenBalanceAfter).to.be.equal(iporTokenBalanceBefore.add(N0__5_18DEC));
    });
});
