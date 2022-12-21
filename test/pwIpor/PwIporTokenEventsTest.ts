import hre, { upgrades } from "hardhat";
import chai from "chai";

import { Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockIporToken, PowerIpor, John } from "../../types";
import { N1__0_18DEC, ZERO, TOTAL_SUPPLY_18_DECIMALS, N0__5_18DEC } from "../utils/Constants";
import { it } from "mocha";
import { getDeployedTokens, Tokens } from "../utils/JohnUtils";
import { randomAddress } from "hardhat/internal/hardhat-network/provider/utils/random";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PowerIpor token delegate", () => {
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let iporToken: MockIporToken;
    let powerIpor: PowerIpor;
    let tokens: Tokens;
    let john: John;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await ethers.getSigners();
        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const IporToken = await ethers.getContractFactory("MockIporToken");
        iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await admin.getAddress()
        )) as MockIporToken;
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;
        await iporToken.increaseAllowance(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        const John = await hre.ethers.getContractFactory("John");
        john = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as John;

        await powerIpor.setJohn(john.address);
    });

    it("Should emit Stake event", async () => {
        //    given
        const stakeAmount = N1__0_18DEC;
        const internalExchangeRate = N1__0_18DEC;
        const baseAmount = N1__0_18DEC;
        const iporTokenStakeBalanceBefore = await powerIpor.balanceOf(await admin.getAddress());
        //    when
        await expect(powerIpor.stake(stakeAmount))
            .to.emit(powerIpor, "Stake")
            .withArgs(await admin.getAddress(), stakeAmount, internalExchangeRate, baseAmount);
        //    then
        const iporTokenStakeBalanceAfter = await powerIpor.balanceOf(await admin.getAddress());

        expect(iporTokenStakeBalanceAfter).to.be.equal(
            iporTokenStakeBalanceBefore.add(stakeAmount)
        );
    });
    it("Should emit Unstake event", async () => {
        //    given
        const stakeAmount = N1__0_18DEC;
        const unstakeAmount = N1__0_18DEC;
        const internalExchangeRate = N1__0_18DEC;
        const fee = N0__5_18DEC;
        await powerIpor.stake(stakeAmount);
        const iporTokenStakeBalanceBefore = await powerIpor.balanceOf(await admin.getAddress());
        //    when
        await expect(powerIpor.unstake(stakeAmount))
            .to.emit(powerIpor, "Unstake")
            .withArgs(await admin.getAddress(), unstakeAmount, internalExchangeRate, fee);
        //    then
        const iporTokenStakeBalanceAfter = await powerIpor.balanceOf(await admin.getAddress());
        expect(iporTokenStakeBalanceBefore).to.be.equal(stakeAmount);
        expect(iporTokenStakeBalanceAfter).to.be.equal(ZERO);
    });

    it("Should emit DelegateToJohn event ", async () => {
        //    given
        const stakeIporTokenAmount = N1__0_18DEC;
        const delegatePwTokenAmount = N1__0_18DEC;
        await powerIpor.stake(stakeIporTokenAmount);
        const delegatedPwTokenBalanceBefore = (
            await john.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.ipTokenDai.address,
            ])
        )[0].pwIporAmount;
        //    when
        await expect(powerIpor.delegateToJohn([tokens.ipTokenDai.address], [delegatePwTokenAmount]))
            .to.emit(powerIpor, "DelegateToJohn")
            .withArgs(
                await admin.getAddress(),
                [tokens.ipTokenDai.address],
                [delegatePwTokenAmount]
            );
        //    then
        const delegatedPwTokenBalanceAfter = (
            await john.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.ipTokenDai.address,
            ])
        )[0].pwIporAmount;

        expect(delegatedPwTokenBalanceAfter).to.be.equal(
            delegatedPwTokenBalanceBefore.add(delegatePwTokenAmount)
        );
    });

    it("Should emit UndelegatePwIpor event ", async () => {
        //    given
        const stakeIporTokenAmount = N1__0_18DEC;
        const delegatePwTokenAmount = N1__0_18DEC;
        const undelegatePwTokenAmount = N1__0_18DEC;
        await powerIpor.stake(stakeIporTokenAmount);
        await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [delegatePwTokenAmount]);
        const delegatedPwTokenBalanceBefore = (
            await john.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.ipTokenDai.address,
            ])
        )[0].pwIporAmount;
        //    when
        await expect(
            powerIpor.undelegateFromJohn([tokens.ipTokenDai.address], [undelegatePwTokenAmount])
        )
            .to.emit(powerIpor, "UndelegateFromJohn")
            .withArgs(
                await admin.getAddress(),
                [tokens.ipTokenDai.address],
                [undelegatePwTokenAmount]
            );
        //    then
        const delegatedPwTokenBalanceAfter = (
            await john.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.ipTokenDai.address,
            ])
        )[0].pwIporAmount;

        expect(delegatedPwTokenBalanceAfter).to.be.equal(
            delegatedPwTokenBalanceBefore.sub(undelegatePwTokenAmount)
        );
    });

    it("Should emit CoolDownChanged event when cooldown", async () => {
        //    given
        const stakeIporTokenAmount = N1__0_18DEC;
        const coolDownAmount = N1__0_18DEC;
        const delegatePwTokenAmount = N1__0_18DEC;
        const undelegatePwTokenAmount = N1__0_18DEC;
        await powerIpor.stake(stakeIporTokenAmount);
        //    when
        await expect(powerIpor.coolDown(coolDownAmount)).to.emit(powerIpor, "CoolDownChanged");
        //    then
    });
    it("Should emit CoolDownChanged event when cancelCoolDown", async () => {
        //    given
        const stakeIporTokenAmount = N1__0_18DEC;
        const coolDownAmount = N1__0_18DEC;
        await powerIpor.stake(stakeIporTokenAmount);
        await powerIpor.coolDown(coolDownAmount);
        //    when
        await expect(powerIpor.cancelCoolDown()).to.emit(powerIpor, "CoolDownChanged");
        //    then
    });

    it("Should emit Redeem event", async () => {
        // given
        const twoWeekesInSeconds = 2 * 7 * 24 * 60 * 60;
        await powerIpor.stake(N1__0_18DEC);
        await powerIpor.coolDown(N0__5_18DEC);

        // when
        await hre.network.provider.send("evm_increaseTime", [twoWeekesInSeconds + 1]);
        await expect(powerIpor.redeem()).to.be.emit(powerIpor, "Redeem");
    });

    it("Should emit UnstakeWithoutCooldownFeeChanged event", async () => {
        // given

        // when
        await expect(powerIpor.setUnstakeWithoutCooldownFee(N1__0_18DEC)).to.be.emit(
            powerIpor,
            "UnstakeWithoutCooldownFeeChanged"
        );
    });

    it("Should emit JohnChanged event", async () => {
        // given
        const John = await hre.ethers.getContractFactory("JohnForTests");
        const itfJohn = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as JohnForTests;

        // when
        await expect(powerIpor.setJohn(itfJohn.address)).to.be.emit(powerIpor, "JohnChanged");
    });

    it("Should emit PauseManagerChanged event ", async () => {
        //    given
        //    when
        await expect(powerIpor.setPauseManager(await userOne.getAddress()))
            .to.emit(powerIpor, "PauseManagerChanged")
            .withArgs(
                await admin.getAddress(),
                await admin.getAddress(),
                await userOne.getAddress()
            );
        //    then
        const newPauseManager = await powerIpor.getPauseManager();

        expect(newPauseManager).to.be.equal(await userOne.getAddress());
    });
});
