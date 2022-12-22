import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockIporToken, PowerIpor } from "../../types";
import { Tokens, getDeployedTokens } from "../utils/LiquidityMiningUtils";
import {
    N1__0_18DEC,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
    N0__5_18DEC,
    N1__0_8DEC,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

describe("LiquidityMining event tests", () => {
    let tokens: Tokens;
    let liquidityMining: LiquidityMining;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let iporToken: MockIporToken;
    let powerIpor: PowerIpor;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const IporToken = await hre.ethers.getContractFactory("MockIporToken");
        iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await admin.getAddress()
        )) as MockIporToken;
        const PowerIpor = await hre.ethers.getContractFactory("PowerIpor");
        powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;

        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.ipTokenDai.address],
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;

        await liquidityMining.setRewardsPerBlock(tokens.ipTokenDai.address, N1__0_8DEC);

        await tokens.ipTokenDai.approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenDai
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenDai
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);

        await tokens.ipTokenUsdc.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdc
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdc
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);

        await tokens.ipTokenUsdt.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdt
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdt
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);

        await iporToken.approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.connect(userOne).approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.connect(userTwo).approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.transfer(
            await userOne.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await iporToken.transfer(
            await userTwo.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await iporToken.transfer(
            liquidityMining.address,
            N1__0_18DEC.mul(BigNumber.from("100000"))
        );
        await powerIpor.setLiquidityMining(liquidityMining.address);
    });

    it("Should emit StakeIpTokens event", async () => {
        //    given
        const stakeIpTokenAmount = N1__0_18DEC;
        const accountIpTokenBalanceBefore = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            )
        ).ipTokenBalance;
        //    when
        await expect(liquidityMining.stake(tokens.ipTokenDai.address, stakeIpTokenAmount))
            .to.emit(liquidityMining, "StakeIpTokens")
            .withArgs(await admin.getAddress(), tokens.ipTokenDai.address, stakeIpTokenAmount);
        //    then
        const accountIpTokenBalanceAfter = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            )
        ).ipTokenBalance;

        expect(accountIpTokenBalanceAfter).to.be.equal(
            accountIpTokenBalanceBefore.add(stakeIpTokenAmount)
        );
    });

    it("Should emit UnstakeIpTokens event", async () => {
        //    given
        const stakeIpTokenAmount = N1__0_18DEC;
        const unstakeIpTokenAmount = N0__5_18DEC;

        await liquidityMining.stake(tokens.ipTokenDai.address, stakeIpTokenAmount);
        const accountIpTokenBalanceBefore = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            )
        ).ipTokenBalance;

        //    when
        await expect(liquidityMining.unstake(tokens.ipTokenDai.address, unstakeIpTokenAmount))
            .to.emit(liquidityMining, "UnstakeIpTokens")
            .withArgs(await admin.getAddress(), tokens.ipTokenDai.address, unstakeIpTokenAmount);

        //    then
        const accountIpTokenBalanceAfter = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            )
        ).ipTokenBalance;

        expect(accountIpTokenBalanceAfter).to.be.equal(
            accountIpTokenBalanceBefore.sub(unstakeIpTokenAmount)
        );
    });

    it("Should emit Claim and ReceiveRewards event", async () => {
        //    given
        const stakeIpTokenAmount = N1__0_18DEC;
        const rewards = N1__0_18DEC.mul(BigNumber.from("101"));
        const adminPwIporBalanceBefore = await powerIpor.balanceOf(await admin.getAddress());

        const accountIpTokenBalanceBefore = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            )
        ).ipTokenBalance;
        await liquidityMining.stake(tokens.ipTokenDai.address, stakeIpTokenAmount);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when
        await expect(liquidityMining.claim(tokens.ipTokenDai.address))
            .to.emit(liquidityMining, "Claim")
            .withArgs(await admin.getAddress(), tokens.ipTokenDai.address, rewards)
            .to.be.emit(powerIpor, "ReceiveRewards")
            .withArgs(await admin.getAddress(), rewards);

        //    then
        const accountIpTokenBalanceAfter = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            )
        ).ipTokenBalance;
        const adminPwIporBalanceAfter = await powerIpor.balanceOf(await admin.getAddress());

        expect(accountIpTokenBalanceAfter).to.be.equal(
            accountIpTokenBalanceBefore.add(stakeIpTokenAmount)
        );
        expect(adminPwIporBalanceAfter).to.be.equal(adminPwIporBalanceBefore.add(rewards));
    });

    it("Should emit RewardsPerBlockChanged event", async () => {
        //    given
        const rewardsPerBlockOld = BigNumber.from("100000000");
        const rewardsPerBlockNew = BigNumber.from("200000000");
        //    when
        await expect(
            liquidityMining.setRewardsPerBlock(tokens.ipTokenDai.address, rewardsPerBlockNew)
        )
            .to.emit(liquidityMining, "RewardsPerBlockChanged")
            .withArgs(await admin.getAddress(), rewardsPerBlockOld, rewardsPerBlockNew);
        //    then

        const accurateRewardsPerBlock = (
            await liquidityMining.getGlobalIndicators(tokens.ipTokenDai.address)
        ).rewardsPerBlock;
        expect(accurateRewardsPerBlock).to.be.equal(rewardsPerBlockNew);
    });

    it("Should emit IpTokenAdded event", async () => {
        //    given
        const ipTokenSupportedBefore = await liquidityMining.isIpTokenSupported(
            tokens.ipTokenUsdc.address
        );

        //    when
        await expect(liquidityMining.addIpTokenAsset(tokens.ipTokenUsdc.address))
            .to.emit(liquidityMining, "IpTokenAdded")
            .withArgs(await admin.getAddress(), tokens.ipTokenUsdc.address);

        //    then
        const ipTokenSupportedAfter = await liquidityMining.isIpTokenSupported(
            tokens.ipTokenUsdc.address
        );

        expect(ipTokenSupportedBefore).to.be.false;
        expect(ipTokenSupportedAfter).to.be.true;
    });

    it("Should emit IpTokenRemoved event", async () => {
        //    given
        await liquidityMining.addIpTokenAsset(tokens.ipTokenUsdc.address);
        const ipTokenSupportedBefore = await liquidityMining.isIpTokenSupported(
            tokens.ipTokenUsdc.address
        );

        //    when
        await expect(liquidityMining.removeIpTokenAsset(tokens.ipTokenUsdc.address))
            .to.emit(liquidityMining, "IpTokenRemoved")
            .withArgs(await admin.getAddress(), tokens.ipTokenUsdc.address);

        //    then
        const ipTokenSupportedAfter = await liquidityMining.isIpTokenSupported(
            tokens.ipTokenUsdc.address
        );

        expect(ipTokenSupportedBefore).to.be.true;
        expect(ipTokenSupportedAfter).to.be.false;
    });

    it("Should emit DelegatePwIpor event ", async () => {
        //    given
        const stakeIporTokenAmount = N1__0_18DEC;
        const delegatePwTokenAmount = N1__0_18DEC;
        await powerIpor.stake(stakeIporTokenAmount);
        const delegatedPwTokenBalanceBefore = (
            await liquidityMining.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.ipTokenDai.address,
            ])
        )[0].pwIporAmount;
        //    when
        await expect(
            powerIpor.delegateToLiquidityMining(
                [tokens.ipTokenDai.address],
                [delegatePwTokenAmount]
            )
        )
            .to.emit(liquidityMining, "DelegatePwIpor")
            .withArgs(await admin.getAddress(), tokens.ipTokenDai.address, delegatePwTokenAmount);
        //    then
        const delegatedPwTokenBalanceAfter = (
            await liquidityMining.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.ipTokenDai.address,
            ])
        )[0].pwIporAmount;

        expect(delegatedPwTokenBalanceAfter).to.be.equal(
            delegatedPwTokenBalanceBefore.add(delegatePwTokenAmount)
        );
    });

    it("Should emit DelegatePwIporAndStakeIpToken event ", async () => {
        //    given
        const stakeIporTokenAmount = N1__0_18DEC;
        const stakeIpTokenAmount = N1__0_18DEC;
        const delegatePwTokenAmount = N1__0_18DEC;
        await powerIpor.stake(stakeIporTokenAmount);
        const delegatedPwTokenBalanceBefore = (
            await liquidityMining.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.ipTokenDai.address,
            ])
        )[0].pwIporAmount;
        const liquidityMiningIpTokenBalanceBefore = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );

        //    when
        await expect(
            powerIpor.delegateAndStakeToLiquidityMining(
                [tokens.ipTokenDai.address],
                [delegatePwTokenAmount],
                [stakeIpTokenAmount]
            )
        )
            .to.emit(liquidityMining, "DelegatePwIporAndStakeIpToken")
            .withArgs(
                await admin.getAddress(),
                tokens.ipTokenDai.address,
                delegatePwTokenAmount,
                stakeIpTokenAmount
            );
        //    then
        const delegatedPwTokenBalanceAfter = (
            await liquidityMining.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.ipTokenDai.address,
            ])
        )[0].pwIporAmount;
        const liquidityMiningIpTokenBalanceAfter = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );

        expect(delegatedPwTokenBalanceAfter).to.be.equal(
            delegatedPwTokenBalanceBefore.add(delegatePwTokenAmount)
        );
        expect(liquidityMiningIpTokenBalanceAfter).to.be.equal(
            liquidityMiningIpTokenBalanceBefore.add(stakeIpTokenAmount)
        );
    });

    it("Should emit UndelegatePwIpor event ", async () => {
        //    given
        const stakeIporTokenAmount = N1__0_18DEC;
        const delegatePwTokenAmount = N1__0_18DEC;
        const undelegatePwTokenAmount = N1__0_18DEC;
        await powerIpor.stake(stakeIporTokenAmount);
        await powerIpor.delegateToLiquidityMining(
            [tokens.ipTokenDai.address],
            [delegatePwTokenAmount]
        );
        const delegatedPwTokenBalanceBefore = (
            await liquidityMining.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.ipTokenDai.address,
            ])
        )[0].pwIporAmount;
        //    when
        await expect(
            powerIpor.undelegateFromLiquidityMining(
                [tokens.ipTokenDai.address],
                [undelegatePwTokenAmount]
            )
        )
            .to.emit(liquidityMining, "UndelegatePwIpor")
            .withArgs(await admin.getAddress(), tokens.ipTokenDai.address, undelegatePwTokenAmount);
        //    then
        const delegatedPwTokenBalanceAfter = (
            await liquidityMining.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.ipTokenDai.address,
            ])
        )[0].pwIporAmount;

        expect(delegatedPwTokenBalanceAfter).to.be.equal(
            delegatedPwTokenBalanceBefore.sub(undelegatePwTokenAmount)
        );
    });

    it("Should emit PauseManagerChanged event ", async () => {
        //    given
        //    when
        await expect(liquidityMining.setPauseManager(await userOne.getAddress()))
            .to.emit(liquidityMining, "PauseManagerChanged")
            .withArgs(
                await admin.getAddress(),
                await admin.getAddress(),
                await userOne.getAddress()
            );
        //    then
        const newPauseManager = await liquidityMining.getPauseManager();

        expect(newPauseManager).to.be.equal(await userOne.getAddress());
    });
});
