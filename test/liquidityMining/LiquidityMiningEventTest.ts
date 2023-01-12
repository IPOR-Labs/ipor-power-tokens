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
            [tokens.lpTokenDai.address],
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;

        await liquidityMining.setRewardsPerBlock(tokens.lpTokenDai.address, N1__0_8DEC);

        await tokens.lpTokenDai.approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.lpTokenDai
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.lpTokenDai
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);

        await tokens.lpTokenUsdc.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdc
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdc
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);

        await tokens.lpTokenUsdt.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdt
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdt
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

    it("Should emit StakeLpTokens event", async () => {
        //    given
        const stakeLpTokenAmount = N1__0_18DEC;
        const accountLpTokenBalanceBefore = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            )
        ).lpTokenBalance;
        //    when
        await expect(liquidityMining.stake(tokens.lpTokenDai.address, stakeLpTokenAmount))
            .to.emit(liquidityMining, "StakeLpTokens")
            .withArgs(await admin.getAddress(), tokens.lpTokenDai.address, stakeLpTokenAmount);
        //    then
        const accountLpTokenBalanceAfter = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            )
        ).lpTokenBalance;

        expect(accountLpTokenBalanceAfter).to.be.equal(
            accountLpTokenBalanceBefore.add(stakeLpTokenAmount)
        );
    });

    it("Should emit UnstakeLpTokens event", async () => {
        //    given
        const stakeLpTokenAmount = N1__0_18DEC;
        const unstakeLpTokenAmount = N0__5_18DEC;

        await liquidityMining.stake(tokens.lpTokenDai.address, stakeLpTokenAmount);
        const accountLpTokenBalanceBefore = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            )
        ).lpTokenBalance;

        //    when
        await expect(liquidityMining.unstake(tokens.lpTokenDai.address, unstakeLpTokenAmount))
            .to.emit(liquidityMining, "UnstakeLpTokens")
            .withArgs(await admin.getAddress(), tokens.lpTokenDai.address, unstakeLpTokenAmount);

        //    then
        const accountLpTokenBalanceAfter = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            )
        ).lpTokenBalance;

        expect(accountLpTokenBalanceAfter).to.be.equal(
            accountLpTokenBalanceBefore.sub(unstakeLpTokenAmount)
        );
    });

    it("Should emit Claim and ReceiveRewards event", async () => {
        //    given
        const stakeLpTokenAmount = N1__0_18DEC;
        const rewards = N1__0_18DEC.mul(BigNumber.from("101"));
        const adminPwIporBalanceBefore = await powerIpor.balanceOf(await admin.getAddress());

        const accountLpTokenBalanceBefore = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            )
        ).lpTokenBalance;
        await liquidityMining.stake(tokens.lpTokenDai.address, stakeLpTokenAmount);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when
        await expect(liquidityMining.claim(tokens.lpTokenDai.address))
            .to.emit(liquidityMining, "Claim")
            .withArgs(await admin.getAddress(), tokens.lpTokenDai.address, rewards)
            .to.be.emit(powerIpor, "ReceiveRewards")
            .withArgs(await admin.getAddress(), rewards);

        //    then
        const accountLpTokenBalanceAfter = (
            await liquidityMining.getAccountIndicators(
                await admin.getAddress(),
                tokens.lpTokenDai.address
            )
        ).lpTokenBalance;
        const adminPwIporBalanceAfter = await powerIpor.balanceOf(await admin.getAddress());

        expect(accountLpTokenBalanceAfter).to.be.equal(
            accountLpTokenBalanceBefore.add(stakeLpTokenAmount)
        );
        expect(adminPwIporBalanceAfter).to.be.equal(adminPwIporBalanceBefore.add(rewards));
    });

    it("Should emit RewardsPerBlockChanged event", async () => {
        //    given
        const rewardsPerBlockOld = BigNumber.from("100000000");
        const rewardsPerBlockNew = BigNumber.from("200000000");
        //    when
        await expect(
            liquidityMining.setRewardsPerBlock(tokens.lpTokenDai.address, rewardsPerBlockNew)
        )
            .to.emit(liquidityMining, "RewardsPerBlockChanged")
            .withArgs(await admin.getAddress(), rewardsPerBlockOld, rewardsPerBlockNew);
        //    then

        const accurateRewardsPerBlock = (
            await liquidityMining.getGlobalIndicators(tokens.lpTokenDai.address)
        ).rewardsPerBlock;
        expect(accurateRewardsPerBlock).to.be.equal(rewardsPerBlockNew);
    });

    it("Should emit LpTokenAdded event", async () => {
        //    given
        const lpTokenSupportedBefore = await liquidityMining.isLpTokenSupported(
            tokens.lpTokenUsdc.address
        );

        //    when
        await expect(liquidityMining.addLpTokenAsset(tokens.lpTokenUsdc.address))
            .to.emit(liquidityMining, "LpTokenAdded")
            .withArgs(await admin.getAddress(), tokens.lpTokenUsdc.address);

        //    then
        const lpTokenSupportedAfter = await liquidityMining.isLpTokenSupported(
            tokens.lpTokenUsdc.address
        );

        expect(lpTokenSupportedBefore).to.be.false;
        expect(lpTokenSupportedAfter).to.be.true;
    });

    it("Should emit LpTokenRemoved event", async () => {
        //    given
        await liquidityMining.addLpTokenAsset(tokens.lpTokenUsdc.address);
        const lpTokenSupportedBefore = await liquidityMining.isLpTokenSupported(
            tokens.lpTokenUsdc.address
        );

        //    when
        await expect(liquidityMining.removeLpTokenAsset(tokens.lpTokenUsdc.address))
            .to.emit(liquidityMining, "LpTokenRemoved")
            .withArgs(await admin.getAddress(), tokens.lpTokenUsdc.address);

        //    then
        const lpTokenSupportedAfter = await liquidityMining.isLpTokenSupported(
            tokens.lpTokenUsdc.address
        );

        expect(lpTokenSupportedBefore).to.be.true;
        expect(lpTokenSupportedAfter).to.be.false;
    });

    it("Should emit DelegatePwIpor event ", async () => {
        //    given
        const stakeIporTokenAmount = N1__0_18DEC;
        const delegatePwTokenAmount = N1__0_18DEC;
        await powerIpor.stake(stakeIporTokenAmount);
        const delegatedPwTokenBalanceBefore = (
            await liquidityMining.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.lpTokenDai.address,
            ])
        )[0].pwIporAmount;
        //    when
        await expect(
            powerIpor.delegateToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatePwTokenAmount]
            )
        )
            .to.emit(liquidityMining, "DelegatePwIpor")
            .withArgs(await admin.getAddress(), tokens.lpTokenDai.address, delegatePwTokenAmount);
        //    then
        const delegatedPwTokenBalanceAfter = (
            await liquidityMining.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.lpTokenDai.address,
            ])
        )[0].pwIporAmount;

        expect(delegatedPwTokenBalanceAfter).to.be.equal(
            delegatedPwTokenBalanceBefore.add(delegatePwTokenAmount)
        );
    });

    it("Should emit DelegatePwIporAndStakeLpToken event ", async () => {
        //    given
        const stakeIporTokenAmount = N1__0_18DEC;
        const stakeLpTokenAmount = N1__0_18DEC;
        const delegatePwTokenAmount = N1__0_18DEC;
        await powerIpor.stake(stakeIporTokenAmount);
        const delegatedPwTokenBalanceBefore = (
            await liquidityMining.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.lpTokenDai.address,
            ])
        )[0].pwIporAmount;
        const liquidityMiningLpTokenBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );

        //    when
        await expect(
            powerIpor.delegateAndStakeToLiquidityMining(
                [tokens.lpTokenDai.address],
                [delegatePwTokenAmount],
                [stakeLpTokenAmount]
            )
        )
            .to.emit(liquidityMining, "DelegatePwIporAndStakeLpToken")
            .withArgs(
                await admin.getAddress(),
                tokens.lpTokenDai.address,
                delegatePwTokenAmount,
                stakeLpTokenAmount
            );
        //    then
        const delegatedPwTokenBalanceAfter = (
            await liquidityMining.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.lpTokenDai.address,
            ])
        )[0].pwIporAmount;
        const liquidityMiningLpTokenBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );

        expect(delegatedPwTokenBalanceAfter).to.be.equal(
            delegatedPwTokenBalanceBefore.add(delegatePwTokenAmount)
        );
        expect(liquidityMiningLpTokenBalanceAfter).to.be.equal(
            liquidityMiningLpTokenBalanceBefore.add(stakeLpTokenAmount)
        );
    });

    it("Should emit UndelegatePwIpor event ", async () => {
        //    given
        const stakeIporTokenAmount = N1__0_18DEC;
        const delegatePwTokenAmount = N1__0_18DEC;
        const undelegatePwTokenAmount = N1__0_18DEC;
        await powerIpor.stake(stakeIporTokenAmount);
        await powerIpor.delegateToLiquidityMining(
            [tokens.lpTokenDai.address],
            [delegatePwTokenAmount]
        );
        const delegatedPwTokenBalanceBefore = (
            await liquidityMining.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.lpTokenDai.address,
            ])
        )[0].pwIporAmount;
        //    when
        await expect(
            powerIpor.undelegateFromLiquidityMining(
                [tokens.lpTokenDai.address],
                [undelegatePwTokenAmount]
            )
        )
            .to.emit(liquidityMining, "UndelegatePwIpor")
            .withArgs(await admin.getAddress(), tokens.lpTokenDai.address, undelegatePwTokenAmount);
        //    then
        const delegatedPwTokenBalanceAfter = (
            await liquidityMining.balanceOfDelegatedPwIpor(await admin.getAddress(), [
                tokens.lpTokenDai.address,
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
