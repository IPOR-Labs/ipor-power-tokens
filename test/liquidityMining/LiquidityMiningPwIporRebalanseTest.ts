import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockStakedToken, PowerToken, LiquidityMiningForTests } from "../../types";
import { Tokens, getDeployedTokens } from "../utils/LiquidityMiningUtils";
import {
    N1__0_18DEC,
    ZERO,
    N0__1_18DEC,
    N0__01_18DEC,
    N2__0_18DEC,
    N1__0_8DEC,
} from "../utils/Constants";
import { LiquidityMiningTypes } from "../../types/LiquidityMining";

chai.use(solidity);
const { expect } = chai;

const expectedBalances = (
    amounts: BigNumber[],
    response: LiquidityMiningTypes.DelegatedPwTokenBalanceStruct[]
) => {
    for (let i = 0; i < 3; i++) {
        expect(response[i].pwTokenAmount).to.be.equal(amounts[i]);
    }
};

describe("LiquidityMining rebalance ", () => {
    let tokens: Tokens;
    let powerToken: PowerToken;
    let stakedToken: MockStakedToken;
    let liquidityMining: LiquidityMining;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const StakedToken = await hre.ethers.getContractFactory("MockStakedToken");
        stakedToken = (await StakedToken.deploy(
            "IPOR Token",
            "IPOR",
            await admin.getAddress()
        )) as MockStakedToken;

        const PowerToken = await hre.ethers.getContractFactory("PowerToken");
        powerToken = (await upgrades.deployProxy(PowerToken, [stakedToken.address])) as PowerToken;

        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");

        liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        await tokens.lpTokenDai.approve(liquidityMining.address, N2__0_18DEC);
        await tokens.lpTokenUsdc.approve(liquidityMining.address, N2__0_18DEC);
        await tokens.lpTokenUsdt.approve(liquidityMining.address, N2__0_18DEC);

        await stakedToken.transfer(
            liquidityMining.address,
            N1__0_18DEC.mul(BigNumber.from("100000"))
        );

        await powerToken.setLiquidityMining(liquidityMining.address);
    });

    it("Should has zero balance when contract was deployed", async () => {
        //    given
        //    when
        const balances = await liquidityMining.balanceOfDelegatedPwToken(await admin.getAddress(), [
            tokens.lpTokenDai.address,
            tokens.lpTokenUsdc.address,
            tokens.lpTokenUsdt.address,
        ]);
        //    then
        expectedBalances([ZERO, ZERO, ZERO], balances);
    });

    it("Should not be able to stake power token when sender is not Power Token", async () => {
        //    given
        //    when
        await expect(
            liquidityMining
                .connect(userOne)
                .delegatePwToken(
                    await userOne.getAddress(),
                    [tokens.lpTokenDai.address],
                    [N1__0_18DEC]
                )
        ).to.be.revertedWith("PT_702");
        //    then
    });

    it("Should not be able to stake power token when lpToken is not supported", async () => {
        //    given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMiningForTests");
        const liquidityMiningInternal = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMiningForTests;
        await liquidityMiningInternal.setPowerToken(await admin.getAddress());

        //    when
        await expect(
            liquidityMiningInternal.delegatePwToken(
                await admin.getAddress(),
                [tokens.tokenDai.address],
                [N1__0_18DEC]
            )
        ).to.be.revertedWith("PT_701");
        //    then
    });

    it("Should be able to delegate pwToken", async () => {
        //    given
        const balancesBefore = await liquidityMining.balanceOfDelegatedPwToken(
            await admin.getAddress(),
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address]
        );

        await liquidityMining.setRewardsPerBlock(tokens.lpTokenDai.address, N1__0_8DEC);
        await liquidityMining.setRewardsPerBlock(tokens.lpTokenUsdc.address, N1__0_8DEC);
        await liquidityMining.setRewardsPerBlock(tokens.lpTokenUsdt.address, N1__0_8DEC);

        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const liquidityMiningIpUsdcBalanceBefore = await tokens.lpTokenUsdc.balanceOf(
            liquidityMining.address
        );
        const liquidityMiningLpUsdtBalanceBefore = await tokens.lpTokenUsdt.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);

        await tokens.lpTokenDai.mint(await admin.getAddress(), N2__0_18DEC);
        await tokens.lpTokenUsdc.mint(await admin.getAddress(), N2__0_18DEC);
        await tokens.lpTokenUsdt.mint(await admin.getAddress(), N2__0_18DEC);

        await liquidityMining.stake(tokens.lpTokenDai.address, N1__0_18DEC);
        await liquidityMining.stake(tokens.lpTokenUsdc.address, N1__0_18DEC);
        await liquidityMining.stake(tokens.lpTokenUsdt.address, N1__0_18DEC);

        const amounts = [N1__0_18DEC, N0__1_18DEC, N0__01_18DEC];

        await stakedToken.approve(powerToken.address, N2__0_18DEC.add(N2__0_18DEC));

        await powerToken.stake(N2__0_18DEC);

        //    when
        await powerToken.delegateToLiquidityMining(
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
            amounts
        );

        //    then
        const balancesAfter = await liquidityMining.balanceOfDelegatedPwToken(
            await admin.getAddress(),
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address]
        );

        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const liquidityMiningIpUsdcBalanceAfter = await tokens.lpTokenUsdc.balanceOf(
            liquidityMining.address
        );
        const liquidityMiningLpUsdtBalanceAfter = await tokens.lpTokenUsdt.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);

        expectedBalances([ZERO, ZERO, ZERO], balancesBefore);
        expectedBalances(amounts, balancesAfter);

        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(N1__0_18DEC)
        );
        expect(liquidityMiningIpUsdcBalanceAfter).to.be.equal(
            liquidityMiningIpUsdcBalanceBefore.add(N1__0_18DEC)
        );
        expect(liquidityMiningLpUsdtBalanceAfter).to.be.equal(
            liquidityMiningLpUsdtBalanceBefore.add(N1__0_18DEC)
        );
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(N1__0_18DEC.mul(BigNumber.from("14")))
        );
    });

    it("Should not be able to delegate pwToken when contract is pause", async () => {
        //    given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMiningForTests");
        const liquidityMiningInternal = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMiningForTests;

        await liquidityMiningInternal.setPowerToken(await admin.getAddress());

        const amounts = [N1__0_18DEC, N0__1_18DEC, N0__01_18DEC];
        await liquidityMiningInternal.pause();

        //    when
        await expect(
            liquidityMiningInternal.delegatePwToken(
                await admin.getAddress(),
                [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
                amounts
            )
        ).to.be.revertedWith("Pausable: paused");
    });
});
