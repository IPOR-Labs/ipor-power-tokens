import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockIporToken, LiquidityMining, PowerIpor } from "../../types";
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

describe("PowerIpor unstake", () => {
    const N2__0_18DEC = N1__0_18DEC.mul(BigNumber.from("2"));
    const N0__5_18DEC = N0__1_18DEC.mul(BigNumber.from("5"));
    const N0__6_18DEC = N0__1_18DEC.mul(BigNumber.from("6"));
    const N0__8_18DEC = N0__1_18DEC.mul(BigNumber.from("8"));
    let accounts: Signer[];
    let iporToken: MockIporToken;
    let powerIpor: PowerIpor;
    let tokens: Tokens;
    let liquidityMining: LiquidityMining;

    before(async () => {
        accounts = await ethers.getSigners();
        tokens = await getDeployedTokens(accounts);
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
        await iporToken.increaseAllowance(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.ipTokenDai.address],
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;

        await powerIpor.setLiquidityMining(liquidityMining.address);
    });

    it("Should not be able coolDown when amount is zero", async () => {
        // given
        await powerIpor.stake(N1__0_18DEC);

        const coolDownBefore = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());

        // when
        await expect(powerIpor.coolDown(ZERO)).to.be.revertedWith("IPOR_717");

        // then
        const coolDownAfter = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());

        expect(coolDownBefore.endTimestamp).to.be.equal(ZERO);
        expect(coolDownBefore.pwIporAmount).to.be.equal(ZERO);
        expect(coolDownAfter.endTimestamp).to.be.equal(ZERO);
        expect(coolDownAfter.pwIporAmount).to.be.equal(ZERO);
    });

    it("Should not be able coolDown when amount is to big", async () => {
        // given
        await powerIpor.stake(N1__0_18DEC);

        const coolDownBefore = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());

        // when
        await expect(powerIpor.coolDown(N2__0_18DEC)).to.be.revertedWith("IPOR_708");

        // then
        const coolDownAfter = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());

        expect(coolDownBefore.endTimestamp).to.be.equal(ZERO);
        expect(coolDownBefore.pwIporAmount).to.be.equal(ZERO);
        expect(coolDownAfter.endTimestamp).to.be.equal(ZERO);
        expect(coolDownAfter.pwIporAmount).to.be.equal(ZERO);
    });

    it("Should be able cool down when amount is zero", async () => {
        // given
        const nowInSeconds = getTimeInSeconds();
        await powerIpor.stake(N1__0_18DEC);

        const coolDownBefore = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());

        // when
        await powerIpor.coolDown(N0__5_18DEC);

        // then
        const coolDownAfter = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());

        expect(coolDownBefore.endTimestamp).to.be.equal(ZERO);
        expect(coolDownBefore.pwIporAmount).to.be.equal(ZERO);
        expect(coolDownAfter.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownAfter.pwIporAmount).to.be.equal(N0__5_18DEC);
    });

    it("Should be able to override cool down when second time execute method ", async () => {
        // given
        const nowInSeconds = getTimeInSeconds();
        await powerIpor.stake(N1__0_18DEC);

        await powerIpor.coolDown(N0__5_18DEC);
        const coolDownBefore = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());
        // when

        await powerIpor.coolDown(N0__6_18DEC);

        // then
        const coolDownAfter = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());

        expect(coolDownBefore.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownBefore.pwIporAmount).to.be.equal(N0__5_18DEC);

        expect(coolDownAfter.endTimestamp.gt(coolDownBefore.endTimestamp)).to.be.true;
        expect(coolDownAfter.pwIporAmount).to.be.equal(N0__6_18DEC);
    });

    it("Should be able to cancel cool down", async () => {
        // given
        const nowInSeconds = getTimeInSeconds();
        await powerIpor.stake(N1__0_18DEC);

        await powerIpor.coolDown(N0__5_18DEC);
        const coolDownBefore = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());
        // when

        await powerIpor.cancelCoolDown();

        // then
        const coolDownAfter = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());

        expect(coolDownBefore.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownBefore.pwIporAmount).to.be.equal(N0__5_18DEC);

        expect(coolDownAfter.endTimestamp).to.be.equal(ZERO);
        expect(coolDownAfter.pwIporAmount).to.be.equal(ZERO);
    });

    it("Should not be able to unstake when some amount is in cool down state", async () => {
        // given
        const adminAddress = await accounts[0].getAddress();
        const nowInSeconds = getTimeInSeconds();

        await powerIpor.stake(N1__0_18DEC);
        await powerIpor.coolDown(N0__8_18DEC);

        const coolDownBefore = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());
        const balanceBefore = await powerIpor.balanceOf(adminAddress);
        // when

        await expect(powerIpor.unstake(N0__5_18DEC)).to.be.revertedWith("IPOR_708");

        // then
        const coolDownAfter = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());
        const balanceAfter = await powerIpor.balanceOf(adminAddress);

        expect(coolDownBefore.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownBefore.pwIporAmount).to.be.equal(N0__8_18DEC);
        expect(coolDownAfter.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownAfter.pwIporAmount).to.be.equal(N0__8_18DEC);

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
    });

    it("Should not be able to delegate when some amount is in cool down state", async () => {
        // given
        const adminAddress = await accounts[0].getAddress();
        const nowInSeconds = getTimeInSeconds();

        await powerIpor.stake(N1__0_18DEC);
        await powerIpor.coolDown(N0__8_18DEC);

        const coolDownBefore = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());
        const balanceBefore = await powerIpor.balanceOf(adminAddress);
        const delegatedBalanceBefore = await powerIpor.delegatedToLiquidityMiningBalanceOf(
            adminAddress
        );
        // when

        await expect(
            powerIpor.delegateToLiquidityMining([tokens.ipTokenDai.address], [N0__5_18DEC])
        ).to.be.revertedWith("IPOR_708");

        // then
        const coolDownAfter = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());
        const balanceAfter = await powerIpor.balanceOf(adminAddress);
        const delegatedBalanceAfter = await powerIpor.delegatedToLiquidityMiningBalanceOf(
            adminAddress
        );

        expect(coolDownBefore.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownBefore.pwIporAmount).to.be.equal(N0__8_18DEC);
        expect(coolDownAfter.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownAfter.pwIporAmount).to.be.equal(N0__8_18DEC);

        expect(balanceBefore).to.be.equal(N1__0_18DEC);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(ZERO);
    });

    it("Should not be able to redeem cool down tokens when time not pass", async () => {
        // given
        const nowInSeconds = getTimeInSeconds();
        await powerIpor.stake(N1__0_18DEC);

        await powerIpor.coolDown(N0__5_18DEC);
        const coolDownBefore = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());
        // when

        await expect(powerIpor.redeem()).to.be.revertedWith("IPOR_710");

        // then
        const coolDownAfter = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());

        expect(coolDownBefore.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownBefore.pwIporAmount).to.be.equal(N0__5_18DEC);

        expect(coolDownAfter.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownAfter.pwIporAmount).to.be.equal(N0__5_18DEC);
    });

    it("Should be able to redeem cool down tokens when 2 weeks pass", async () => {
        // given

        const expectedCoolDownPwIporAmount = N0__5_18DEC;
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const twoWeekesInSeconds = 2 * 7 * 24 * 60 * 60;
        const adminAddress = await accounts[0].getAddress();
        const nowInSeconds = getTimeInSeconds();
        await powerIpor.stake(N1__0_18DEC);
        const pwBalanceBefore = await powerIpor.balanceOf(adminAddress);

        await powerIpor.coolDown(N0__5_18DEC);
        const coolDownBefore = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());
        const exchangeRateBefore = await powerIpor.calculateExchangeRate();

        // when
        await hre.network.provider.send("evm_increaseTime", [twoWeekesInSeconds + 1]);
        await powerIpor.redeem();

        // then
        const exchangeRateAfter = await powerIpor.calculateExchangeRate();

        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const coolDownAfter = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());
        const pwBalanceAfter = await powerIpor.balanceOf(adminAddress);

        expect(coolDownBefore.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownBefore.pwIporAmount).to.be.equal(expectedCoolDownPwIporAmount);

        expect(coolDownAfter.endTimestamp).to.be.equal(ZERO);
        expect(coolDownAfter.pwIporAmount).to.be.equal(ZERO);

        expect(pwBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(pwBalanceAfter).to.be.equal(N0__5_18DEC);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(expectedCoolDownPwIporAmount)
        );
        expect(exchangeRateBefore).to.be.equal(exchangeRateAfter);
    });

    it("Should be able to redeem cool down tokens when 2 weeks pass and exchange rate changed", async () => {
        // given
        const stakeIporAmount = N1__0_18DEC;
        const cooldownAmount = N0__5_18DEC;
        const transferAmount = N1__0_18DEC;

        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const twoWeekesInSeconds = 2 * 7 * 24 * 60 * 60;
        const adminAddress = await accounts[0].getAddress();
        const nowInSeconds = getTimeInSeconds();
        await powerIpor.stake(N1__0_18DEC);
        const pwBalanceBefore = await powerIpor.balanceOf(adminAddress);

        await powerIpor.coolDown(N0__5_18DEC);
        await iporToken.transfer(powerIpor.address, N1__0_18DEC);

        const coolDownBefore = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());
        const iporTokenBalanceBefore = await iporToken.balanceOf(adminAddress);
        const exchangeRateBefore = await powerIpor.calculateExchangeRate();

        // when
        await hre.network.provider.send("evm_increaseTime", [twoWeekesInSeconds + 1]);
        await powerIpor.redeem();

        // then
        const exchangeRateAfter = await powerIpor.calculateExchangeRate();
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const coolDownAfter = await powerIpor.getActiveCoolDown(await accounts[0].getAddress());
        const pwBalanceAfter = await powerIpor.balanceOf(adminAddress);
        const iporTokenBalanceAfter = await iporToken.balanceOf(adminAddress);

        expect(coolDownBefore.endTimestamp.gt(nowInSeconds.add(COOLDOWN_SECONDS))).to.be.true;
        expect(coolDownBefore.pwIporAmount).to.be.equal(N0__5_18DEC);

        expect(coolDownAfter.endTimestamp).to.be.equal(ZERO);
        expect(coolDownAfter.pwIporAmount).to.be.equal(ZERO);

        expect(pwBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(pwBalanceAfter).to.be.equal(N1__0_18DEC.add(N0__5_18DEC));

        expect(iporTokenBalanceAfter).to.be.equal(iporTokenBalanceBefore.add(N0__5_18DEC));
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore
                .add(transferAmount)
                .add(stakeIporAmount)
                .sub(cooldownAmount)
        );

        expect(exchangeRateBefore).to.be.equal(exchangeRateAfter);
    });
});
