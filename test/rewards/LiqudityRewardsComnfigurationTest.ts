import hre, { upgrades } from "hardhat";
import chai from "chai";

import { Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityRewards } from "../../types";
import { Tokens, getDeployedTokens } from "../utils/LiquidityRewardsUtils";

chai.use(solidity);
const { expect } = chai;

describe("LiquidityRewards comnfiguration, deploy tests", () => {
    let tokens: Tokens;
    let accounts: Signer[];

    before(async () => {
        accounts = await hre.ethers.getSigners();
        tokens = await getDeployedTokens(accounts);
    });

    it("Should deploy contract without assets", async () => {
        // given
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        // when
        const liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [],
        ])) as LiquidityRewards;
        // then
        expect(liquidityRewards.address).to.be.not.undefined;
        expect(liquidityRewards.address).to.be.not.null;
        expect(liquidityRewards.address).to.be.not.equal("");
    });

    it("Should deploy contract with 3 assets", async () => {
        // given
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        // when
        const liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
        ])) as LiquidityRewards;
        // then
        const isDaiActive = await liquidityRewards.isAssetSupported(tokens.ipTokenDai.address);
        const isUsdcActive = await liquidityRewards.isAssetSupported(tokens.ipTokenUsdc.address);
        const isUsdtActive = await liquidityRewards.isAssetSupported(tokens.ipTokenUsdt.address);

        expect(isDaiActive).to.be.true;
        expect(isUsdcActive).to.be.true;
        expect(isUsdtActive).to.be.true;
    });

    it("Should deploy contract with 1 assets", async () => {
        // given
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        // when
        const liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [tokens.ipTokenDai.address],
        ])) as LiquidityRewards;
        // then
        const isDaiActive = await liquidityRewards.isAssetSupported(tokens.ipTokenDai.address);
        const isUsdcActive = await liquidityRewards.isAssetSupported(tokens.ipTokenUsdc.address);
        const isUsdtActive = await liquidityRewards.isAssetSupported(tokens.ipTokenUsdt.address);

        expect(isDaiActive).to.be.true;
        expect(isUsdcActive).to.be.false;
        expect(isUsdtActive).to.be.false;
    });

    it("Should be able to add new asset by owner", async () => {
        // given
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        const liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [],
        ])) as LiquidityRewards;
        const isDaiActiveBefore = await liquidityRewards.isAssetSupported(tokens.ipTokenDai.address);
        const isUsdcActiveBefore = await liquidityRewards.isAssetSupported(tokens.ipTokenUsdc.address);
        const isUsdtActiveBefore = await liquidityRewards.isAssetSupported(tokens.ipTokenUsdt.address);
        // when
        await liquidityRewards.addAsset(tokens.ipTokenUsdc.address);
        await liquidityRewards.addAsset(tokens.ipTokenUsdt.address);
        // then
        const isDaiActiveAfter = await liquidityRewards.isAssetSupported(tokens.ipTokenDai.address);
        const isUsdcActiveAfter = await liquidityRewards.isAssetSupported(tokens.ipTokenUsdc.address);
        const isUsdtActiveAfter = await liquidityRewards.isAssetSupported(tokens.ipTokenUsdt.address);

        expect(isDaiActiveBefore).to.be.false;
        expect(isUsdcActiveBefore).to.be.false;
        expect(isUsdtActiveBefore).to.be.false;

        expect(isDaiActiveAfter).to.be.false;
        expect(isUsdcActiveAfter).to.be.true;
        expect(isUsdtActiveAfter).to.be.true;
    });

    it("Should not be able to add new asset by random user", async () => {
        // given
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        const liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [],
        ])) as LiquidityRewards;
        const isUsdcActiveBefore = await liquidityRewards.isAssetSupported(tokens.ipTokenUsdc.address);
        const [admin, userOne] = accounts;
        // when
        await expect(
            //when
            liquidityRewards.connect(userOne).addAsset(tokens.ipTokenUsdc.address)
            //then
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should be able to transfer ownership", async () => {
        // given
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        const liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [],
        ])) as LiquidityRewards;

        const [admin, userOne] = accounts;
        const ownerAddressBefore = await liquidityRewards.owner();
        // when
        await liquidityRewards.transferOwnership(await userOne.getAddress());
        await liquidityRewards.connect(userOne).confirmTransferOwnership();
        // then
        const ownerAddressAfter = await liquidityRewards.owner();

        expect(ownerAddressBefore).to.be.equal(await admin.getAddress());
        expect(ownerAddressAfter).to.be.equal(await userOne.getAddress());
    });

    it("Should not be able to transfer ownership when not owner", async () => {
        // given
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        const liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [],
        ])) as LiquidityRewards;

        const [admin, userOne] = accounts;
        const ownerAddressBefore = await liquidityRewards.owner();
        // when
        await expect(
            //when
            liquidityRewards.connect(userOne).transferOwnership(await userOne.getAddress())
            //then
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should be able to pause contract when owner", async () => {
        // given
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        const liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [],
        ])) as LiquidityRewards;

        const isPausedBefore = await liquidityRewards.paused();
        // when
        await liquidityRewards.pause();
        // then
        const isPausedAfter = await liquidityRewards.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.true;
    });

    it("Should not be able to pause contract when no owner", async () => {
        // given
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        const liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [],
        ])) as LiquidityRewards;

        const [admin, userOne] = accounts;
        const isPausedBefore = await liquidityRewards.paused();
        // when
        await expect(liquidityRewards.connect(userOne).pause()).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
        // then
        const isPausedAfter = await liquidityRewards.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.false;
    });

    it("Should be able to unpause contract when owner", async () => {
        // given
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        const liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [],
        ])) as LiquidityRewards;
        await liquidityRewards.pause();
        const isPausedBefore = await liquidityRewards.paused();
        // when
        await liquidityRewards.unpause();
        // then
        const isPausedAfter = await liquidityRewards.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.false;
    });

    it("Should not be able to unpause contract when no owner", async () => {
        // given
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        const liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [],
        ])) as LiquidityRewards;

        const [admin, userOne] = accounts;
        await liquidityRewards.pause();
        const isPausedBefore = await liquidityRewards.paused();
        // when
        await expect(liquidityRewards.connect(userOne).unpause()).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
        // then
        const isPausedAfter = await liquidityRewards.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.true;
    });
});
