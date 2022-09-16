import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { IporToken, PwIporToken } from "../../types";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PwIporToken comnfiguration, deploy tests", () => {
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
        const PwIporToken = await ethers.getContractFactory("PwIporToken");
        // when
        const pwIporToken = (await upgrades.deployProxy(PwIporToken, [
            iporToken.address,
        ])) as PwIporToken;
        // then
        expect(await pwIporToken.name()).to.be.equal("Power IPOR");
        expect(await pwIporToken.symbol()).to.be.equal("pwIPOR");
        expect(await pwIporToken.decimals()).to.be.equal(BigNumber.from("18"));
    });

    it("Should not be able to deploy contract when no iporToken address", async () => {
        // given
        const PwIporToken = await ethers.getContractFactory("PwIporToken");
        // when
        await expect(
            upgrades.deployProxy(PwIporToken, ["0x0000000000000000000000000000000000000000"])
        ).to.be.revertedWith("IPOR_000");
        // then
    });

    it("Should be able to transfer ownership", async () => {
        // given
        const PwIporToken = await ethers.getContractFactory("PwIporToken");
        const pwIporToken = (await upgrades.deployProxy(PwIporToken, [
            iporToken.address,
        ])) as PwIporToken;

        const [admin, userOne] = accounts;
        const ownerAddressBefore = await pwIporToken.owner();
        // when
        await pwIporToken.transferOwnership(await userOne.getAddress());
        await pwIporToken.connect(userOne).confirmTransferOwnership();
        // then
        const ownerAddressAfter = await pwIporToken.owner();

        expect(ownerAddressBefore).to.be.equal(await admin.getAddress());
        expect(ownerAddressAfter).to.be.equal(await userOne.getAddress());
    });

    it("Should not be able to transfer ownership when not owner", async () => {
        // given
        const PwIporToken = await ethers.getContractFactory("PwIporToken");
        const pwIporToken = (await upgrades.deployProxy(PwIporToken, [
            iporToken.address,
        ])) as PwIporToken;

        const [admin, userOne] = accounts;
        const ownerAddressBefore = await pwIporToken.owner();
        // when
        await expect(
            //when
            pwIporToken.connect(userOne).transferOwnership(await userOne.getAddress())
            //then
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should be able to pause contract when owner", async () => {
        // given
        const PwIporToken = await ethers.getContractFactory("PwIporToken");
        const pwIporToken = (await upgrades.deployProxy(PwIporToken, [
            iporToken.address,
        ])) as PwIporToken;

        const [admin, userOne] = accounts;

        const isPausedBefore = await pwIporToken.paused();
        // when
        await pwIporToken.pause();
        // then
        const isPausedAfter = await pwIporToken.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.true;
    });

    it("Should not be able to pause contract when no owner", async () => {
        // given
        const PwIporToken = await ethers.getContractFactory("PwIporToken");
        const pwIporToken = (await upgrades.deployProxy(PwIporToken, [
            iporToken.address,
        ])) as PwIporToken;

        const [admin, userOne] = accounts;
        const isPausedBefore = await pwIporToken.paused();
        // when
        await expect(pwIporToken.connect(userOne).pause()).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
        // then
        const isPausedAfter = await pwIporToken.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.false;
    });

    it("Should be able to unpause contract when owner", async () => {
        // given
        const PwIporToken = await ethers.getContractFactory("PwIporToken");
        const pwIporToken = (await upgrades.deployProxy(PwIporToken, [
            iporToken.address,
        ])) as PwIporToken;
        await pwIporToken.pause();
        const isPausedBefore = await pwIporToken.paused();
        // when
        await pwIporToken.unpause();
        // then
        const isPausedAfter = await pwIporToken.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.false;
    });

    it("Should not be able to unpause contract when no owner", async () => {
        // given
        const PwIporToken = await ethers.getContractFactory("PwIporToken");
        const pwIporToken = (await upgrades.deployProxy(PwIporToken, [
            iporToken.address,
        ])) as PwIporToken;

        const [admin, userOne] = accounts;
        await pwIporToken.pause();
        const isPausedBefore = await pwIporToken.paused();
        // when
        await expect(pwIporToken.connect(userOne).unpause()).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
        // then
        const isPausedAfter = await pwIporToken.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.true;
    });
});
