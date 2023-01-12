import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockStakedToken, PowerToken } from "../../types";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PowerToken configuration, deploy tests", () => {
    let accounts: Signer[];
    let stakedToken: MockStakedToken;
    before(async () => {
        accounts = await ethers.getSigners();

        const StakedToken = await ethers.getContractFactory("MockStakedToken");
        stakedToken = (await StakedToken.deploy(
            "IPOR Token",
            "IPOR",
            await accounts[0].getAddress()
        )) as MockStakedToken;
    });

    it("Should deploy contract", async () => {
        // given
        const PowerToken = await ethers.getContractFactory("PowerToken");
        // when
        const powerToken = (await upgrades.deployProxy(PowerToken, [
            stakedToken.address,
        ])) as PowerToken;
        // then
        expect(await powerToken.name()).to.be.equal("Power IPOR");
        expect(await powerToken.symbol()).to.be.equal("pwIPOR");
        expect(await powerToken.decimals()).to.be.equal(BigNumber.from("18"));
    });

    it("Should not be able to deploy contract when no stakedToken address", async () => {
        // given
        const PowerToken = await ethers.getContractFactory("PowerToken");
        // when
        await expect(
            upgrades.deployProxy(PowerToken, ["0x0000000000000000000000000000000000000000"])
        ).to.be.revertedWith("PT_715");
        // then
    });

    it("Should be able to transfer ownership", async () => {
        // given
        const PowerToken = await ethers.getContractFactory("PowerToken");
        const powerToken = (await upgrades.deployProxy(PowerToken, [
            stakedToken.address,
        ])) as PowerToken;

        const [admin, userOne] = accounts;
        const ownerAddressBefore = await powerToken.owner();
        // when
        await powerToken.transferOwnership(await userOne.getAddress());
        await powerToken.connect(userOne).confirmTransferOwnership();
        // then
        const ownerAddressAfter = await powerToken.owner();

        expect(ownerAddressBefore).to.be.equal(await admin.getAddress());
        expect(ownerAddressAfter).to.be.equal(await userOne.getAddress());
    });

    it("Should not be able to transfer ownership when not owner", async () => {
        // given
        const PowerToken = await ethers.getContractFactory("PowerToken");
        const powerToken = (await upgrades.deployProxy(PowerToken, [
            stakedToken.address,
        ])) as PowerToken;

        const [admin, userOne] = accounts;
        const ownerAddressBefore = await powerToken.owner();
        // when
        await expect(
            //when
            powerToken.connect(userOne).transferOwnership(await userOne.getAddress())
            //then
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should be able to pause contract when owner (initial deployment)", async () => {
        // given
        const PowerToken = await ethers.getContractFactory("PowerToken");
        const powerToken = (await upgrades.deployProxy(PowerToken, [
            stakedToken.address,
        ])) as PowerToken;

        const [admin, userOne] = accounts;

        const isPausedBefore = await powerToken.paused();
        // when
        await powerToken.pause();
        // then
        const isPausedAfter = await powerToken.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.true;
    });

    it("Should be able to pause contract when Pause Manager", async () => {
        // given

        const PowerToken = await ethers.getContractFactory("PowerToken");
        const powerToken = (await upgrades.deployProxy(PowerToken, [
            stakedToken.address,
        ])) as PowerToken;

        const [admin, userOne, userThree] = accounts;

        const isPausedBefore = await powerToken.paused();

        const oldPauseManager = await powerToken.getPauseManager();
        await powerToken.setPauseManager(await userThree.getAddress());

        // when
        await powerToken.connect(userThree).pause();

        // then
        const isPausedAfter = await powerToken.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.true;

        //clean up
        await powerToken.setPauseManager(oldPauseManager);
    });

    it("Should not be able to pause contract when no owner", async () => {
        // given
        const PowerToken = await ethers.getContractFactory("PowerToken");
        const powerToken = (await upgrades.deployProxy(PowerToken, [
            stakedToken.address,
        ])) as PowerToken;

        const [admin, userOne] = accounts;
        const isPausedBefore = await powerToken.paused();
        // when
        await expect(powerToken.connect(userOne).pause()).to.be.revertedWith("PT_704");
        // then
        const isPausedAfter = await powerToken.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.false;
    });

    it("Should be able to unpause contract when owner (initial deployment)", async () => {
        // given
        const PowerToken = await ethers.getContractFactory("PowerToken");
        const powerToken = (await upgrades.deployProxy(PowerToken, [
            stakedToken.address,
        ])) as PowerToken;
        await powerToken.pause();
        const isPausedBefore = await powerToken.paused();
        // when
        await powerToken.unpause();
        // then
        const isPausedAfter = await powerToken.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.false;
    });

    it("Should be able to unpause contract when Pause Manager", async () => {
        // given
        const [admin, userOne, userThree] = accounts;
        const PowerToken = await ethers.getContractFactory("PowerToken");
        const powerToken = (await upgrades.deployProxy(PowerToken, [
            stakedToken.address,
        ])) as PowerToken;
        await powerToken.pause();
        const isPausedBefore = await powerToken.paused();

        const oldPauseManager = await powerToken.getPauseManager();
        await powerToken.setPauseManager(await userThree.getAddress());

        // when
        await powerToken.connect(userThree).unpause();
        // then
        const isPausedAfter = await powerToken.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.false;

        //clean up
        await powerToken.setPauseManager(oldPauseManager);
    });

    it("Should not be able to unpause contract when no owner", async () => {
        // given
        const PowerToken = await ethers.getContractFactory("PowerToken");
        const powerToken = (await upgrades.deployProxy(PowerToken, [
            stakedToken.address,
        ])) as PowerToken;

        const [admin, userOne] = accounts;
        await powerToken.pause();
        const isPausedBefore = await powerToken.paused();
        // when
        await expect(powerToken.connect(userOne).unpause()).to.be.revertedWith("PT_704");
        // then
        const isPausedAfter = await powerToken.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.true;
    });

    it("Should not be able to unpause contract when initial Pause Manager changed", async () => {
        // given
        const PowerToken = await ethers.getContractFactory("PowerToken");
        const powerToken = (await upgrades.deployProxy(PowerToken, [
            stakedToken.address,
        ])) as PowerToken;

        const [admin, userOne, userThree] = accounts;
        await powerToken.pause();
        const isPausedBefore = await powerToken.paused();
        const oldPauseManager = await powerToken.getPauseManager();
        await powerToken.setPauseManager(await userThree.getAddress());

        // when
        await expect(powerToken.unpause()).to.be.revertedWith("PT_704");

        // then
        const isPausedAfter = await powerToken.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.true;

        //clean up
        await powerToken.setPauseManager(oldPauseManager);
    });

    it("Should not be able execute receiveRewards because sender is not a LiquidityMining", async () => {
        //given
        const PowerToken = await ethers.getContractFactory("PowerToken");
        const powerToken = (await upgrades.deployProxy(PowerToken, [
            stakedToken.address,
        ])) as PowerToken;
        const [admin, userOne, userThree] = accounts;
        //when
        await expect(
            powerToken.receiveRewardsFromLiquidityMining(
                await userOne.getAddress(),
                BigNumber.from("123")
            )
        ).to.be.revertedWith("PT_703");
    });
});
