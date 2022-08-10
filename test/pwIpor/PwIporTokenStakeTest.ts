import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { IporToken, PwIporToken } from "../../types";
import {
    N1__0_18DEC,
    N1__0_6DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PwIporToken comnfiguration, deploy tests", () => {
    let accounts: Signer[];
    let iporToken: IporToken;
    let pwIporToken: PwIporToken;

    before(async () => {
        accounts = await ethers.getSigners();

        const IporToken = await ethers.getContractFactory("IporToken");
        iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await accounts[0].getAddress()
        )) as IporToken;
        const PwIporToken = await ethers.getContractFactory("PwIporToken");
        // when
        pwIporToken = (await upgrades.deployProxy(PwIporToken, [iporToken.address])) as PwIporToken;
    });

    it("Should not be able stake when amount is zero", async () => {
        // given
        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await pwIporToken.balanceOf(adminAddress);
        // when
        await expect(pwIporToken.stake(ZERO)).to.be.revertedWith("IPOR_004");
        // then
        const balanceAfter = await pwIporToken.balanceOf(adminAddress);
        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
    });

    it("Should be able stake", async () => {
        // given
        await iporToken.increaseAllowance(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);

        const adminAddress = await accounts[0].getAddress();
        const balanceBefore = await pwIporToken.balanceOf(adminAddress);

        // when
        await pwIporToken.stake(N1__0_18DEC);
        // then
        const balanceAfter = await pwIporToken.balanceOf(adminAddress);
        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
    });

    // TODO: more tests will be implement in IL-1064
});
