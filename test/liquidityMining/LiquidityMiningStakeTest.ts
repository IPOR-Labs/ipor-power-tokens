import hre, { upgrades } from "hardhat";
import chai from "chai";

import { Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockStakedToken } from "../../types";
import { Tokens, getDeployedTokens, extractGlobalIndicators } from "../utils/LiquidityMiningUtils";
import {
    N1__0_18DEC,
    N1__0_6DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

describe("LiquidityMining Stake", () => {
    let tokens: Tokens;
    let liquidityMining: LiquidityMining;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let adminAddress: string, userOneAddress: string;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();
        adminAddress = await admin.getAddress();
        userOneAddress = await userOne.getAddress();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const StakedToken = await ethers.getContractFactory("MockStakedToken");
        const stakedToken = (await StakedToken.deploy(
            "IPOR Token",
            "IPOR",
            await admin.getAddress()
        )) as MockStakedToken;
        const PowerToken = await ethers.getContractFactory("PowerToken");
        const powerToken = (await upgrades.deployProxy(PowerToken, [
            stakedToken.address,
        ])) as PowerToken;

        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMiningForTests");
        liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMiningForTests;

        await liquidityMining.setPowerToken(await admin.getAddress());

        tokens.lpTokenDai.approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        tokens.lpTokenDai
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        tokens.lpTokenDai
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);

        tokens.lpTokenUsdc.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.lpTokenUsdc
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.lpTokenUsdc
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);

        tokens.lpTokenUsdt.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.lpTokenUsdt
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.lpTokenUsdt
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
    });

    it("Should not be able to stake when insufficient allowance on lpToken(Dai) ", async () => {
        // given
        const balanceBefore = await liquidityMining.balanceOf(
            adminAddress,
            tokens.lpTokenDai.address
        );
        // when
        await expect(
            liquidityMining.connect(userThree).stake(tokens.lpTokenDai.address, N1__0_18DEC)
        ).to.be.revertedWith("ERC20: insufficient allowance");

        // then
        const balanceAfter = await liquidityMining.balanceOf(
            adminAddress,
            tokens.lpTokenDai.address
        );
        // we dont
        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
    });

    it("Should be able to stake lpToken(Dai)", async () => {
        // given
        const balanceBefore = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.lpTokenDai.address
        );
        // when
        await liquidityMining.connect(userOne).stake(tokens.lpTokenDai.address, N1__0_18DEC);

        // then
        const balanceAfter = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.lpTokenDai.address
        );

        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
    });

    it("Should not be able to stake when LpToken(usdt) is deactivated", async () => {
        // given
        const balanceBefore = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.lpTokenUsdc.address
        );
        await liquidityMining.removeLpTokenAsset(tokens.lpTokenUsdt.address);

        // when
        await expect(
            liquidityMining.connect(userOne).stake(tokens.lpTokenUsdt.address, N1__0_6DEC)
        ).to.be.revertedWith("PT_701");

        // then
        const balanceAfter = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.lpTokenUsdc.address
        );

        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
    });

    it("Should not be able to stake when contract is pause", async () => {
        // given
        const balanceBefore = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.lpTokenUsdc.address
        );
        await liquidityMining.pause();

        // when
        await expect(
            liquidityMining.connect(userOne).stake(tokens.lpTokenUsdt.address, N1__0_6DEC)
        ).to.be.revertedWith("Pausable: paused");
        // then
        const balanceAfter = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.lpTokenUsdc.address
        );

        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
    });

    it("Should not be able to stake when amount is zero", async () => {
        // given
        const balanceBefore = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.lpTokenUsdc.address
        );
        // when
        await expect(
            liquidityMining.connect(userOne).stake(tokens.lpTokenUsdt.address, ZERO)
        ).to.be.revertedWith("PT_717");

        // then
        const balanceAfter = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.lpTokenUsdc.address
        );

        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
    });
});
