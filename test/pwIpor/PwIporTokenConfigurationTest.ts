import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { IporToken, PowerIpor } from "../../types";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PowerIpor configuration, deploy tests", () => {
    let accounts: Signer[];
    let iporToken: IporToken;
    before(async () => {
        accounts = await ethers.getSigners();

        const IporToken = await ethers.getContractFactory("IporToken");
        iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await accounts[0].getAddress()
        )) as IporToken;
    });

    it("Should deploy contract", async () => {
        // given
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        // when
        const powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;
        // then
        expect(await powerIpor.name()).to.be.equal("Power IPOR");
        expect(await powerIpor.symbol()).to.be.equal("pwIPOR");
        expect(await powerIpor.decimals()).to.be.equal(BigNumber.from("18"));
    });

    it("Should not be able to deploy contract when no iporToken address", async () => {
        // given
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        // when
        await expect(
            upgrades.deployProxy(PowerIpor, ["0x0000000000000000000000000000000000000000"])
        ).to.be.revertedWith("IPOR_715");
        // then
    });

    it("Should be able to transfer ownership", async () => {
        // given
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        const powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;

        const [admin, userOne] = accounts;
        const ownerAddressBefore = await powerIpor.owner();
        // when
        await powerIpor.transferOwnership(await userOne.getAddress());
        await powerIpor.connect(userOne).confirmTransferOwnership();
        // then
        const ownerAddressAfter = await powerIpor.owner();

        expect(ownerAddressBefore).to.be.equal(await admin.getAddress());
        expect(ownerAddressAfter).to.be.equal(await userOne.getAddress());
    });

    it("Should not be able to transfer ownership when not owner", async () => {
        // given
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        const powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;

        const [admin, userOne] = accounts;
        const ownerAddressBefore = await powerIpor.owner();
        // when
        await expect(
            //when
            powerIpor.connect(userOne).transferOwnership(await userOne.getAddress())
            //then
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should be able to pause contract when owner (initial deployment)", async () => {
        // given
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        const powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;

        const [admin, userOne] = accounts;

        const isPausedBefore = await powerIpor.paused();
        // when
        await powerIpor.pause();
        // then
        const isPausedAfter = await powerIpor.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.true;
    });

    it("Should be able to pause contract when Pause Manager", async () => {
        // given

        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        const powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;

        const [admin, userOne, userThree] = accounts;

        const isPausedBefore = await powerIpor.paused();

        const oldPauseManager = await powerIpor.getPauseManager();
        await powerIpor.setPauseManager(await userThree.getAddress());

        // when
        await powerIpor.connect(userThree).pause();

        // then
        const isPausedAfter = await powerIpor.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.true;

        //clean up
        await powerIpor.setPauseManager(oldPauseManager);
    });

    it("Should not be able to pause contract when no owner", async () => {
        // given
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        const powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;

        const [admin, userOne] = accounts;
        const isPausedBefore = await powerIpor.paused();
        // when
        await expect(powerIpor.connect(userOne).pause()).to.be.revertedWith("IPOR_704");
        // then
        const isPausedAfter = await powerIpor.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.false;
    });

    it("Should be able to unpause contract when owner (initial deployment)", async () => {
        // given
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        const powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;
        await powerIpor.pause();
        const isPausedBefore = await powerIpor.paused();
        // when
        await powerIpor.unpause();
        // then
        const isPausedAfter = await powerIpor.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.false;
    });

    it("Should be able to unpause contract when Pause Manager", async () => {
        // given
        const [admin, userOne, userThree] = accounts;
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        const powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;
        await powerIpor.pause();
        const isPausedBefore = await powerIpor.paused();

        const oldPauseManager = await powerIpor.getPauseManager();
        await powerIpor.setPauseManager(await userThree.getAddress());

        // when
        await powerIpor.connect(userThree).unpause();
        // then
        const isPausedAfter = await powerIpor.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.false;

        //clean up
        await powerIpor.setPauseManager(oldPauseManager);
    });

    it("Should not be able to unpause contract when no owner", async () => {
        // given
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        const powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;

        const [admin, userOne] = accounts;
        await powerIpor.pause();
        const isPausedBefore = await powerIpor.paused();
        // when
        await expect(powerIpor.connect(userOne).unpause()).to.be.revertedWith("IPOR_704");
        // then
        const isPausedAfter = await powerIpor.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.true;
    });

    it("Should not be able to unpause contract when initial Pause Manager changed", async () => {
        // given
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        const powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;

        const [admin, userOne, userThree] = accounts;
        await powerIpor.pause();
        const isPausedBefore = await powerIpor.paused();
        const oldPauseManager = await powerIpor.getPauseManager();
        await powerIpor.setPauseManager(await userThree.getAddress());

        // when
        await expect(powerIpor.unpause()).to.be.revertedWith("IPOR_704");

        // then
        const isPausedAfter = await powerIpor.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.true;

        //clean up
        await powerIpor.setPauseManager(oldPauseManager);
    });

    it("Should not be able execute receiveRewards because sender is not a John", async () => {
        //given
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        const powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;
        const [admin, userOne, userThree] = accounts;
        //when
        await expect(
            powerIpor.receiveRewardsFromJohn(await userOne.getAddress(), BigNumber.from("123"))
        ).to.be.revertedWith("IPOR_703");
    });
});
