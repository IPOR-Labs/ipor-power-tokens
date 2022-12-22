import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockIporToken, PowerIpor, LiquidityMiningForTests } from "../../types";
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
    response: LiquidityMiningTypes.DelegatedPwIporBalanceStruct[]
) => {
    for (let i = 0; i < 3; i++) {
        expect(response[i].pwIporAmount).to.be.equal(amounts[i]);
    }
};

describe("LiquidityMining rebalance ", () => {
    let tokens: Tokens;
    let powerIpor: PowerIpor;
    let iporToken: MockIporToken;
    let liquidityMining: LiquidityMining;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;

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
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;

        await tokens.ipTokenDai.approve(liquidityMining.address, N2__0_18DEC);
        await tokens.ipTokenUsdc.approve(liquidityMining.address, N2__0_18DEC);
        await tokens.ipTokenUsdt.approve(liquidityMining.address, N2__0_18DEC);

        await iporToken.transfer(
            liquidityMining.address,
            N1__0_18DEC.mul(BigNumber.from("100000"))
        );

        await powerIpor.setLiquidityMining(liquidityMining.address);
    });

    it("Should has zero balance when contract was deployed", async () => {
        //    given
        //    when
        const balances = await liquidityMining.balanceOfDelegatedPwIpor(await admin.getAddress(), [
            tokens.ipTokenDai.address,
            tokens.ipTokenUsdc.address,
            tokens.ipTokenUsdt.address,
        ]);
        //    then
        expectedBalances([ZERO, ZERO, ZERO], balances);
    });

    it("Should not be able to stake power token when sender is not Power Ipor", async () => {
        //    given
        //    when
        await expect(
            liquidityMining
                .connect(userOne)
                .delegatePwIpor(
                    await userOne.getAddress(),
                    [tokens.ipTokenDai.address],
                    [N1__0_18DEC]
                )
        ).to.be.revertedWith("IPOR_702");
        //    then
    });

    it("Should not be able to stake power token when ipToken is not supported", async () => {
        //    given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMiningForTests");
        const liquidityMiningInternal = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMiningForTests;
        await liquidityMiningInternal.setPowerIpor(await admin.getAddress());

        //    when
        await expect(
            liquidityMiningInternal.delegatePwIpor(
                await admin.getAddress(),
                [tokens.tokenDai.address],
                [N1__0_18DEC]
            )
        ).to.be.revertedWith("IPOR_701");
        //    then
    });

    it("Should be able to delegate pwIpor", async () => {
        //    given
        const balancesBefore = await liquidityMining.balanceOfDelegatedPwIpor(
            await admin.getAddress(),
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address]
        );

        await liquidityMining.setRewardsPerBlock(tokens.ipTokenDai.address, N1__0_8DEC);
        await liquidityMining.setRewardsPerBlock(tokens.ipTokenUsdc.address, N1__0_8DEC);
        await liquidityMining.setRewardsPerBlock(tokens.ipTokenUsdt.address, N1__0_8DEC);

        const liquidityMiningIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );
        const liquidityMiningIpUsdcBalanceBefore = await tokens.ipTokenUsdc.balanceOf(
            liquidityMining.address
        );
        const liquidityMiningIpUsdtBalanceBefore = await tokens.ipTokenUsdt.balanceOf(
            liquidityMining.address
        );
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

        await tokens.ipTokenDai.mint(await admin.getAddress(), N2__0_18DEC);
        await tokens.ipTokenUsdc.mint(await admin.getAddress(), N2__0_18DEC);
        await tokens.ipTokenUsdt.mint(await admin.getAddress(), N2__0_18DEC);

        await liquidityMining.stake(tokens.ipTokenDai.address, N1__0_18DEC);
        await liquidityMining.stake(tokens.ipTokenUsdc.address, N1__0_18DEC);
        await liquidityMining.stake(tokens.ipTokenUsdt.address, N1__0_18DEC);

        const amounts = [N1__0_18DEC, N0__1_18DEC, N0__01_18DEC];

        await iporToken.approve(powerIpor.address, N2__0_18DEC.add(N2__0_18DEC));

        await powerIpor.stake(N2__0_18DEC);

        //    when
        await powerIpor.delegateToLiquidityMining(
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            amounts
        );

        //    then
        const balancesAfter = await liquidityMining.balanceOfDelegatedPwIpor(
            await admin.getAddress(),
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address]
        );

        const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );
        const liquidityMiningIpUsdcBalanceAfter = await tokens.ipTokenUsdc.balanceOf(
            liquidityMining.address
        );
        const liquidityMiningIpUsdtBalanceAfter = await tokens.ipTokenUsdt.balanceOf(
            liquidityMining.address
        );
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

        expectedBalances([ZERO, ZERO, ZERO], balancesBefore);
        expectedBalances(amounts, balancesAfter);

        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(N1__0_18DEC)
        );
        expect(liquidityMiningIpUsdcBalanceAfter).to.be.equal(
            liquidityMiningIpUsdcBalanceBefore.add(N1__0_18DEC)
        );
        expect(liquidityMiningIpUsdtBalanceAfter).to.be.equal(
            liquidityMiningIpUsdtBalanceBefore.add(N1__0_18DEC)
        );
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(N1__0_18DEC.mul(BigNumber.from("14")))
        );
    });

    it("Should not be able to delegate pwIpor when contract is pause", async () => {
        //    given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMiningForTests");
        const liquidityMiningInternal = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMiningForTests;

        await liquidityMiningInternal.setPowerIpor(await admin.getAddress());

        const amounts = [N1__0_18DEC, N0__1_18DEC, N0__01_18DEC];
        await liquidityMiningInternal.pause();

        //    when
        await expect(
            liquidityMiningInternal.delegatePwIpor(
                await admin.getAddress(),
                [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
                amounts
            )
        ).to.be.revertedWith("Pausable: paused");
    });
});
