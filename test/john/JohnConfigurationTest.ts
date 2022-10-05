import hre, { upgrades } from "hardhat";
import chai from "chai";

import { Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { John } from "../../types";
import { Tokens, getDeployedTokens } from "../utils/JohnUtils";

chai.use(solidity);
const { expect } = chai;

const randomAddress = "0x0B54FA10558caBBdd0D6df5b8667913C43567Bc5";

describe("John configuration, deploy tests", () => {
    let tokens: Tokens;
    let accounts: Signer[];

    before(async () => {
        accounts = await hre.ethers.getSigners();
        tokens = await getDeployedTokens(accounts);
    });

    it("Should deploy contract without assets", async () => {
        // given
        const John = await hre.ethers.getContractFactory("John");
        // when
        const john = (await upgrades.deployProxy(John, [
            [],
            randomAddress,
            tokens.ipTokenUsdt.address,
        ])) as John;
        // then
        expect(john.address).to.be.not.undefined;
        expect(john.address).to.be.not.null;
        expect(john.address).to.be.not.equal("");
    });

    it("Should not be able to deploy contract when Power Ipor Token address is zero", async () => {
        // given
        const John = await hre.ethers.getContractFactory("John");

        // when
        await expect(
            upgrades.deployProxy(John, [
                [],
                "0x0000000000000000000000000000000000000000",
                tokens.ipTokenUsdt.address,
            ])
        ).to.be.revertedWith("IPOR_000");
    });

    it("Should deploy contract with 3 assets", async () => {
        // given
        const John = await hre.ethers.getContractFactory("John");

        // when
        const john = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            randomAddress,
            tokens.ipTokenUsdt.address,
        ])) as John;

        // then
        const isDaiActive = await john.isIpTokenSupported(tokens.ipTokenDai.address);
        const isUsdcActive = await john.isIpTokenSupported(tokens.ipTokenUsdc.address);
        const isUsdtActive = await john.isIpTokenSupported(tokens.ipTokenUsdt.address);

        expect(isDaiActive).to.be.true;
        expect(isUsdcActive).to.be.true;
        expect(isUsdtActive).to.be.true;
    });

    it("Should deploy contract with 1 assets", async () => {
        // given
        const John = await hre.ethers.getContractFactory("John");

        // when
        const john = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address],
            randomAddress,
            tokens.ipTokenUsdt.address,
        ])) as John;

        // then
        const isDaiActive = await john.isIpTokenSupported(tokens.ipTokenDai.address);
        const isUsdcActive = await john.isIpTokenSupported(tokens.ipTokenUsdc.address);
        const isUsdtActive = await john.isIpTokenSupported(tokens.ipTokenUsdt.address);

        expect(isDaiActive).to.be.true;
        expect(isUsdcActive).to.be.false;
        expect(isUsdtActive).to.be.false;
    });

    it("Should be able to add new asset by owner", async () => {
        // given
        const John = await hre.ethers.getContractFactory("John");
        const john = (await upgrades.deployProxy(John, [
            [],
            randomAddress,
            tokens.ipTokenUsdt.address,
        ])) as John;
        const isDaiActiveBefore = await john.isIpTokenSupported(tokens.ipTokenDai.address);
        const isUsdcActiveBefore = await john.isIpTokenSupported(tokens.ipTokenUsdc.address);
        const isUsdtActiveBefore = await john.isIpTokenSupported(tokens.ipTokenUsdt.address);

        // when
        await john.addIpTokenAsset(tokens.ipTokenUsdc.address);
        await john.addIpTokenAsset(tokens.ipTokenUsdt.address);

        // then
        const isDaiActiveAfter = await john.isIpTokenSupported(tokens.ipTokenDai.address);
        const isUsdcActiveAfter = await john.isIpTokenSupported(tokens.ipTokenUsdc.address);
        const isUsdtActiveAfter = await john.isIpTokenSupported(tokens.ipTokenUsdt.address);

        expect(isDaiActiveBefore).to.be.false;
        expect(isUsdcActiveBefore).to.be.false;
        expect(isUsdtActiveBefore).to.be.false;

        expect(isDaiActiveAfter).to.be.false;
        expect(isUsdcActiveAfter).to.be.true;
        expect(isUsdtActiveAfter).to.be.true;
    });

    it("Should not be able to add new asset by random user", async () => {
        // given
        const John = await hre.ethers.getContractFactory("John");
        const john = (await upgrades.deployProxy(John, [
            [],
            randomAddress,
            tokens.ipTokenUsdt.address,
        ])) as John;
        const [_, userOne] = accounts;

        // when
        await expect(
            //when
            john.connect(userOne).addIpTokenAsset(tokens.ipTokenUsdc.address)
            //then
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should be able to transfer ownership", async () => {
        // given
        const John = await hre.ethers.getContractFactory("John");
        const john = (await upgrades.deployProxy(John, [
            [],
            randomAddress,
            tokens.ipTokenUsdt.address,
        ])) as John;

        const [admin, userOne] = accounts;
        const ownerAddressBefore = await john.owner();

        // when
        await john.transferOwnership(await userOne.getAddress());
        await john.connect(userOne).confirmTransferOwnership();

        // then
        const ownerAddressAfter = await john.owner();

        expect(ownerAddressBefore).to.be.equal(await admin.getAddress());
        expect(ownerAddressAfter).to.be.equal(await userOne.getAddress());
    });

    it("Should not be able to transfer ownership when not owner", async () => {
        // given
        const John = await hre.ethers.getContractFactory("John");
        const john = (await upgrades.deployProxy(John, [
            [],
            randomAddress,
            tokens.ipTokenUsdt.address,
        ])) as John;

        const [_, userOne] = accounts;

        // when
        await expect(
            //when
            john.connect(userOne).transferOwnership(await userOne.getAddress())
            //then
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should be able to pause contract when owner (initial deployment)", async () => {
        // given
        const John = await hre.ethers.getContractFactory("John");
        const john = (await upgrades.deployProxy(John, [
            [],
            randomAddress,
            tokens.ipTokenUsdt.address,
        ])) as John;

        const isPausedBefore = await john.paused();

        // when
        await john.pause();

        // then
        const isPausedAfter = await john.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.true;
    });

    it("Should be able to pause contract when Pause Manager", async () => {
        // given
        const [_, userOne, userThree] = accounts;
        const John = await hre.ethers.getContractFactory("John");
        const john = (await upgrades.deployProxy(John, [
            [],
            randomAddress,
            tokens.ipTokenUsdt.address,
        ])) as John;

        const isPausedBefore = await john.paused();
        const oldPauseManager = await john.getPauseManager();

        await john.setPauseManager(await userThree.getAddress());

        // when
        await john.connect(userThree).pause();

        // then
        const isPausedAfter = await john.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.true;

        //clean up
        await john.setPauseManager(oldPauseManager);
    });

    it("Should not be able to pause contract when no owner", async () => {
        // given
        const John = await hre.ethers.getContractFactory("John");
        const john = (await upgrades.deployProxy(John, [
            [],
            randomAddress,
            tokens.ipTokenUsdt.address,
        ])) as John;

        const [_, userOne] = accounts;
        const isPausedBefore = await john.paused();

        // when
        await expect(john.connect(userOne).pause()).to.be.revertedWith("IPOR_704");

        // then
        const isPausedAfter = await john.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.false;
    });

    it("Should not be able to pause contract when initial Pause Manager changed", async () => {
        // given
        const John = await hre.ethers.getContractFactory("John");
        const john = (await upgrades.deployProxy(John, [
            [],
            randomAddress,
            tokens.ipTokenUsdt.address,
        ])) as John;

        const [_, userOne] = accounts;
        const isPausedBefore = await john.paused();
        const oldPauseManager = await john.getPauseManager();

        await john.setPauseManager(await userOne.getAddress());

        // when
        await expect(john.pause()).to.be.revertedWith("IPOR_704");

        // then
        const isPausedAfter = await john.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.false;

        //clean up
        await john.setPauseManager(oldPauseManager);
    });

    it("Should be able to unpause contract when owner (initial deployment)", async () => {
        // given
        const John = await hre.ethers.getContractFactory("John");
        const john = (await upgrades.deployProxy(John, [
            [],
            randomAddress,
            tokens.ipTokenUsdt.address,
        ])) as John;
        await john.pause();
        const isPausedBefore = await john.paused();

        // when
        await john.unpause();

        // then
        const isPausedAfter = await john.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.false;
    });

    it("Should be able to unpause contract when Pause Manager", async () => {
        // given
        const [_, userOne, userThree] = accounts;
        const John = await hre.ethers.getContractFactory("John");
        const john = (await upgrades.deployProxy(John, [
            [],
            randomAddress,
            tokens.ipTokenUsdt.address,
        ])) as John;
        await john.pause();
        const isPausedBefore = await john.paused();

        const oldPauseManager = await john.getPauseManager();

        await john.setPauseManager(await userThree.getAddress());

        // when
        await john.connect(userThree).unpause();

        // then
        const isPausedAfter = await john.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.false;

        //clean up
        await john.setPauseManager(oldPauseManager);
    });

    it("Should not be able to unpause contract when no owner", async () => {
        // given
        const John = await hre.ethers.getContractFactory("John");
        const john = (await upgrades.deployProxy(John, [
            [],
            randomAddress,
            tokens.ipTokenUsdt.address,
        ])) as John;

        const [_, userOne] = accounts;
        await john.pause();
        const isPausedBefore = await john.paused();

        // when
        await expect(john.connect(userOne).unpause()).to.be.revertedWith("IPOR_704");

        // then
        const isPausedAfter = await john.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.true;
    });

    it("Should not be able to unpause contract when initial Pause Manager changed", async () => {
        // given
        const John = await hre.ethers.getContractFactory("John");
        const john = (await upgrades.deployProxy(John, [
            [],
            randomAddress,
            tokens.ipTokenUsdt.address,
        ])) as John;

        const [_, userOne, userThree] = accounts;
        await john.pause();
        const isPausedBefore = await john.paused();

        const oldPauseManager = await john.getPauseManager();

        await john.setPauseManager(await userThree.getAddress());

        // when
        await expect(john.unpause()).to.be.revertedWith("IPOR_704");

        // then
        const isPausedAfter = await john.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.true;

        //clean up
        await john.setPauseManager(oldPauseManager);
    });
});
