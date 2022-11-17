const hre = require("hardhat");
import chai from "chai";
import { constants, Signer } from "ethers";
import { solidity } from "ethereum-waffle";
chai.use(solidity);
const { expect } = chai;

import { IporOwnable } from "../../types";

describe("IporOwnable", () => {
    let admin: Signer, userOne: Signer, userTwo: Signer;
    let iporOwnable: IporOwnable;

    beforeEach(async () => {
        [admin, userOne, userTwo] = await hre.ethers.getSigners();

        const IporOwnable = await hre.ethers.getContractFactory("IporOwnable");
        iporOwnable = await IporOwnable.deploy();
    });

    it("Should deployer be owner of contract", async () => {
        // given
        // when
        // then
        const owner = await iporOwnable.owner();
        expect(owner, "Admin should be owner").to.be.equal(await admin.getAddress());
    });

    it("Should not be possible to transfer 0x00 address", async () => {
        // given
        // when
        await expect(
            iporOwnable.transferOwnership(constants.AddressZero),
            "Should revert when 0x00 addres pass"
        ).revertedWith("IPOR_000");
    });

    it("should not be possible to confirm the transfer ownership for different address", async () => {
        // given
        await iporOwnable.transferOwnership(await userOne.getAddress());
        // when
        await expect(
            iporOwnable.connect(userTwo).confirmTransferOwnership(),
            "Should revert when pass userTwo address"
        ).revertedWith("IPOR_007");
    });

    it("Should be able to transfer ownership to userOne", async () => {
        // when
        await iporOwnable.transferOwnership(await userOne.getAddress());
        await iporOwnable.connect(userOne).confirmTransferOwnership();
        // then
        const owner = await iporOwnable.owner();

        expect(owner, "userOne should be owner").to.be.equal(await userOne.getAddress());
    });

    it("Should zero address is the owner when renounceOwnership was execute ", async () => {
        //    given
        const ownerBefore = await iporOwnable.owner();

        //    when
        await iporOwnable.renounceOwnership();

        //    then
        const ownerAfter = await iporOwnable.owner();

        expect(ownerBefore).to.be.equal(await admin.getAddress());
        expect(ownerAfter).to.be.equal(constants.AddressZero);
    });

    it("Should not be able to renounceOwnership when user is not owner", async () => {
        //    given
        const ownerBefore = await iporOwnable.owner();

        //    when
        await expect(iporOwnable.connect(userTwo).renounceOwnership()).revertedWith(
            "Ownable: caller is not the owner"
        );

        //    then
        const ownerAfter = await iporOwnable.owner();

        expect(ownerBefore).to.be.equal(await admin.getAddress());
        expect(ownerAfter).to.be.equal(await admin.getAddress());
    });

    it("Should not be able to confirm transfer ownership when renounce ownership", async () => {
        //    given
        const ownerBefore = await iporOwnable.owner();
        await iporOwnable.transferOwnership(await userOne.getAddress());
        await iporOwnable.renounceOwnership();
        //    when
        await expect(iporOwnable.connect(userOne).confirmTransferOwnership()).revertedWith(
            "IPOR_007"
        );

        //    then
        const ownerAfter = await iporOwnable.owner();

        expect(ownerBefore).to.be.equal(await admin.getAddress());
        expect(ownerAfter).to.be.equal(constants.AddressZero);
    });
});
