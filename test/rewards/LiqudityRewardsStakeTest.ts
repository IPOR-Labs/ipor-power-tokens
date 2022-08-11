import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityRewards } from "../../types";
import { Tokens, getDeployedTokens } from "../utils/LiquidityRewardsUtils";
import {
    N1__0_18DEC,
    N1__0_6DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

const randomAddress = "0x0B54FA10558caBBdd0D6df5b8667913C43567Bc5";

describe("LiquidityRewards Stake and balance", () => {
    let tokens: Tokens;
    let liquidityRewards: LiquidityRewards;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            randomAddress,
        ])) as LiquidityRewards;
        tokens.ipTokenDai.approve(liquidityRewards.address, TOTAL_SUPPLY_18_DECIMALS);
        tokens.ipTokenDai
            .connect(userOne)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_18_DECIMALS);
        tokens.ipTokenDai
            .connect(userTwo)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_18_DECIMALS);

        tokens.ipTokenUsdc.approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.ipTokenUsdc
            .connect(userOne)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.ipTokenUsdc
            .connect(userTwo)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);

        tokens.ipTokenUsdt.approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.ipTokenUsdt
            .connect(userOne)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.ipTokenUsdt
            .connect(userTwo)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
    });

    it("Should not be able to stake when insufficient allowance on ipToken(Dai) ", async () => {
        // given
        const balanceBefore = await liquidityRewards.balanceOf(tokens.ipTokenDai.address);
        // when
        await expect(
            liquidityRewards.connect(userThree).stake(tokens.ipTokenDai.address, N1__0_18DEC)
        ).to.be.revertedWith("ERC20: insufficient allowance");
        // then
        const balanceAfter = await liquidityRewards.balanceOf(tokens.ipTokenDai.address);

        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
    });

    it("Should be able to stake ipToken(Dai)", async () => {
        // given
        const balanceBefore = await liquidityRewards
            .connect(userOne)
            .balanceOf(tokens.ipTokenDai.address);
        // when
        await liquidityRewards.connect(userOne).stake(tokens.ipTokenDai.address, N1__0_18DEC);
        // then
        const balanceAfter = await liquidityRewards
            .connect(userOne)
            .balanceOf(tokens.ipTokenDai.address);

        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
    });

    it("Should be able to stake twice ipToken(Dai)", async () => {
        // given
        const balanceBefore = await liquidityRewards
            .connect(userOne)
            .balanceOf(tokens.ipTokenDai.address);
        // when
        await liquidityRewards.connect(userOne).stake(tokens.ipTokenDai.address, N1__0_18DEC);
        await liquidityRewards.connect(userOne).stake(tokens.ipTokenDai.address, N1__0_18DEC);
        // then
        const balanceAfter = await liquidityRewards
            .connect(userOne)
            .balanceOf(tokens.ipTokenDai.address);

        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(N1__0_18DEC.mul(BigNumber.from("2")));
    });

    it("Should be able to stake twice ipToken(usdc)", async () => {
        // given
        const balanceBefore = await liquidityRewards
            .connect(userOne)
            .balanceOf(tokens.ipTokenUsdc.address);
        // when
        await liquidityRewards.connect(userOne).stake(tokens.ipTokenUsdc.address, N1__0_6DEC);
        await liquidityRewards.connect(userOne).stake(tokens.ipTokenUsdc.address, N1__0_6DEC);
        // then
        const balanceAfter = await liquidityRewards
            .connect(userOne)
            .balanceOf(tokens.ipTokenUsdc.address);

        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(N1__0_6DEC.mul(BigNumber.from("2")));
    });

    it("Should not be able to stake when IpToken(usdt) is deactivated", async () => {
        // given
        const balanceBefore = await liquidityRewards
            .connect(userOne)
            .balanceOf(tokens.ipTokenUsdc.address);
        await liquidityRewards.removeAsset(tokens.ipTokenUsdt.address);
        // when
        await expect(
            liquidityRewards.connect(userOne).stake(tokens.ipTokenUsdt.address, N1__0_6DEC)
        ).to.be.revertedWith("IPOR_702");
        // then
        const balanceAfter = await liquidityRewards
            .connect(userOne)
            .balanceOf(tokens.ipTokenUsdc.address);

        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
    });

    it("Should not be able to stake when contract is pause", async () => {
        // given
        const balanceBefore = await liquidityRewards
            .connect(userOne)
            .balanceOf(tokens.ipTokenUsdc.address);
        await liquidityRewards.pause();
        // when
        await expect(
            liquidityRewards.connect(userOne).stake(tokens.ipTokenUsdt.address, N1__0_6DEC)
        ).to.be.revertedWith("Pausable: paused");
        // then
        const balanceAfter = await liquidityRewards
            .connect(userOne)
            .balanceOf(tokens.ipTokenUsdc.address);

        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
    });

    it("Should not be able to stake when amount is zero", async () => {
        // given
        const balanceBefore = await liquidityRewards
            .connect(userOne)
            .balanceOf(tokens.ipTokenUsdc.address);
        // when
        await expect(
            liquidityRewards.connect(userOne).stake(tokens.ipTokenUsdt.address, ZERO)
        ).to.be.revertedWith("IPOR_004");
        // then
        const balanceAfter = await liquidityRewards
            .connect(userOne)
            .balanceOf(tokens.ipTokenUsdc.address);

        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
    });
});
