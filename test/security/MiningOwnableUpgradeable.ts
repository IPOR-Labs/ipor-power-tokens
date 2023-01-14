// @ts-ignore
const hre = require("hardhat");
import chai from "chai";
import { constants, Signer } from "ethers";
import { solidity } from "ethereum-waffle";
chai.use(solidity);
const { expect } = chai;

import { MiningOwnableUpgradeable } from "../../types";
describe("MiningOwnableUpgradeable", () => {
    let admin: Signer, userOne: Signer, userTwo: Signer;
    let miningOwnable: MiningOwnableUpgradeable;

    beforeEach(async () => {
        [admin, userOne, userTwo] = await hre.ethers.getSigners();

        const MiningOwnableUpgradeable = await hre.ethers.getContractFactory(
            "MockOwnableUpgradeable"
        );
        miningOwnable = (await MiningOwnableUpgradeable.deploy()) as MiningOwnableUpgradeable;
    });

    it("Should 0x00 address be owner when deployed without initialize", async () => {
        // given
        // when
        // then
        const owner = await miningOwnable.owner();
        expect(owner, "should be 0x00 address").to.be.equal(constants.AddressZero);
    });

    it("Should deployer be owner of contract", async () => {
        // given
        // @ts-ignore
        await miningOwnable.initialize();
        // when
        // then
        const owner = await miningOwnable.owner();
        expect(owner, "Admin should be owner").to.be.equal(await admin.getAddress());
    });

    it("Should not be possible to transfer 0x00 address", async () => {
        // given
        // @ts-ignore
        await miningOwnable.initialize();
        // when
        await expect(
            miningOwnable.transferOwnership(constants.AddressZero),
            "Should revert when 0x00 addres pass"
        ).revertedWith("PT_715");
    });

    it("should not be possible to confirm the transfer ownership for different address", async () => {
        // given
        // @ts-ignore
        await miningOwnable.initialize();
        await miningOwnable.transferOwnership(await userOne.getAddress());
        await expect(
            miningOwnable.connect(userTwo).confirmTransferOwnership(),
            "Should revert when pass userTwo address"
        ).revertedWith("PT_719");
    });

    it("Should be able to transfer ownership to userOne", async () => {
        // when
        // @ts-ignore
        await miningOwnable.initialize();
        await miningOwnable.transferOwnership(await userOne.getAddress());
        await miningOwnable.connect(userOne).confirmTransferOwnership();
        // then
        const owner = await miningOwnable.owner();

        expect(owner, "userOne should be owner").to.be.equal(await userOne.getAddress());
    });

    it("Should zero address is the owner when renounceOwnership was execute ", async () => {
        //    given
        // @ts-ignore
        await miningOwnable.initialize();
        const ownerBefore = await miningOwnable.owner();

        //    when
        await miningOwnable.renounceOwnership();

        //    then
        const ownerAfter = await miningOwnable.owner();

        expect(ownerBefore).to.be.equal(await admin.getAddress());
        expect(ownerAfter).to.be.equal(constants.AddressZero);
    });

    it("Should not be able to renounceOwnership when user is not owner", async () => {
        //    given
        // @ts-ignore
        await miningOwnable.initialize();
        const ownerBefore = await miningOwnable.owner();

        //    when
        await expect(miningOwnable.connect(userTwo).renounceOwnership()).revertedWith(
            "Ownable: caller is not the owner"
        );

        //    then
        const ownerAfter = await miningOwnable.owner();

        expect(ownerBefore).to.be.equal(await admin.getAddress());
        expect(ownerAfter).to.be.equal(await admin.getAddress());
    });

    it("Should not be able to confirm transfer ownership when renounce ownership", async () => {
        //    given
        // @ts-ignore
        await miningOwnable.initialize();
        const ownerBefore = await miningOwnable.owner();
        await miningOwnable.transferOwnership(await userOne.getAddress());
        await miningOwnable.renounceOwnership();
        //    when
        await expect(miningOwnable.connect(userOne).confirmTransferOwnership()).revertedWith(
            "PT_719"
        );

        //    then
        const ownerAfter = await miningOwnable.owner();

        expect(ownerBefore).to.be.equal(await admin.getAddress());
        expect(ownerAfter).to.be.equal(constants.AddressZero);
    });
});
