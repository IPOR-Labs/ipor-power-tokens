import hre, { upgrades } from "hardhat";
import chai from "chai";

import { Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockStakedToken, PowerToken } from "../../types";
import { Tokens, getDeployedTokens } from "../utils/LiquidityMiningUtils";

chai.use(solidity);
const { expect } = chai;

const randomAddress = "0x0B54FA10558caBBdd0D6df5b8667913C43567Bc5";

describe("LiquidityMining configuration, deploy tests", () => {
    let tokens: Tokens;
    let accounts: Signer[];
    let stakedToken: MockStakedToken;
    let powerToken: PowerToken;

    before(async () => {
        accounts = await hre.ethers.getSigners();
        tokens = await getDeployedTokens(accounts);
        const StakedToken = await ethers.getContractFactory("MockStakedToken");
        stakedToken = (await StakedToken.deploy(
            "IPOR Token",
            "IPOR",
            await accounts[0].getAddress()
        )) as MockStakedToken;
        const PowerToken = await ethers.getContractFactory("PowerToken");
        powerToken = (await upgrades.deployProxy(PowerToken, [stakedToken.address])) as PowerToken;
    });

    it("Should deploy contract without assets", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        // when
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;
        // then
        expect(liquidityMining.address).to.be.not.undefined;
        expect(liquidityMining.address).to.be.not.null;
        expect(liquidityMining.address).to.be.not.equal("");
    });

    it("Should not be able to deploy contract when Power Token address is zero", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");

        // when
        await expect(
            upgrades.deployProxy(LiquidityMining, [
                [],
                "0x0000000000000000000000000000000000000000",
                stakedToken.address,
            ])
        ).to.be.revertedWith("PT_715");
    });

    it("Should not be able to deploy contract when address is not powerToken", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");

        // when
        await expect(
            upgrades.deployProxy(LiquidityMining, [[], stakedToken.address, stakedToken.address])
        ).to.be.revertedWith("PT_716");
    });

    it("Should not be able to deploy contract when address is not stakedToken", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");

        // when
        await expect(
            upgrades.deployProxy(LiquidityMining, [[], powerToken.address, powerToken.address])
        ).to.be.revertedWith("PT_716");
    });

    it("Should deploy contract with 3 assets", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");

        // when
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        // then
        const isDaiActive = await liquidityMining.isLpTokenSupported(tokens.lpTokenDai.address);
        const isUsdcActive = await liquidityMining.isLpTokenSupported(tokens.lpTokenUsdc.address);
        const isUsdtActive = await liquidityMining.isLpTokenSupported(tokens.lpTokenUsdt.address);

        expect(isDaiActive).to.be.true;
        expect(isUsdcActive).to.be.true;
        expect(isUsdtActive).to.be.true;
    });

    it("Should deploy contract with 1 assets", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");

        // when
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.lpTokenDai.address],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        // then
        const isDaiActive = await liquidityMining.isLpTokenSupported(tokens.lpTokenDai.address);
        const isUsdcActive = await liquidityMining.isLpTokenSupported(tokens.lpTokenUsdc.address);
        const isUsdtActive = await liquidityMining.isLpTokenSupported(tokens.lpTokenUsdt.address);

        expect(isDaiActive).to.be.true;
        expect(isUsdcActive).to.be.false;
        expect(isUsdtActive).to.be.false;
    });

    it("Should be able to add new asset by owner", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;
        const isDaiActiveBefore = await liquidityMining.isLpTokenSupported(
            tokens.lpTokenDai.address
        );
        const isUsdcActiveBefore = await liquidityMining.isLpTokenSupported(
            tokens.lpTokenUsdc.address
        );
        const isUsdtActiveBefore = await liquidityMining.isLpTokenSupported(
            tokens.lpTokenUsdt.address
        );

        // when
        await liquidityMining.addLpTokenAsset(tokens.lpTokenUsdc.address);
        await liquidityMining.addLpTokenAsset(tokens.lpTokenUsdt.address);

        // then
        const isDaiActiveAfter = await liquidityMining.isLpTokenSupported(
            tokens.lpTokenDai.address
        );
        const isUsdcActiveAfter = await liquidityMining.isLpTokenSupported(
            tokens.lpTokenUsdc.address
        );
        const isUsdtActiveAfter = await liquidityMining.isLpTokenSupported(
            tokens.lpTokenUsdt.address
        );

        expect(isDaiActiveBefore).to.be.false;
        expect(isUsdcActiveBefore).to.be.false;
        expect(isUsdtActiveBefore).to.be.false;

        expect(isDaiActiveAfter).to.be.false;
        expect(isUsdcActiveAfter).to.be.true;
        expect(isUsdtActiveAfter).to.be.true;
    });

    it("Should not be able to add new asset by random user", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;
        const [_, userOne] = accounts;

        // when
        await expect(
            //when
            liquidityMining.connect(userOne).addLpTokenAsset(tokens.lpTokenUsdc.address)
            //then
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should be able to transfer ownership", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        const [admin, userOne] = accounts;
        const ownerAddressBefore = await liquidityMining.owner();

        // when
        await liquidityMining.transferOwnership(await userOne.getAddress());
        await liquidityMining.connect(userOne).confirmTransferOwnership();

        // then
        const ownerAddressAfter = await liquidityMining.owner();

        expect(ownerAddressBefore).to.be.equal(await admin.getAddress());
        expect(ownerAddressAfter).to.be.equal(await userOne.getAddress());
    });

    it("Should not be able to transfer ownership when not owner", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        const [_, userOne] = accounts;

        // when
        await expect(
            //when
            liquidityMining.connect(userOne).transferOwnership(await userOne.getAddress())
            //then
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should be able to pause contract when owner (initial deployment)", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        const isPausedBefore = await liquidityMining.paused();

        // when
        await liquidityMining.pause();

        // then
        const isPausedAfter = await liquidityMining.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.true;
    });

    it("Should be able to pause contract when Pause Manager", async () => {
        // given
        const [_, userOne, userThree] = accounts;
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        const isPausedBefore = await liquidityMining.paused();
        const oldPauseManager = await liquidityMining.getPauseManager();

        await liquidityMining.setPauseManager(await userThree.getAddress());

        // when
        await liquidityMining.connect(userThree).pause();

        // then
        const isPausedAfter = await liquidityMining.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.true;

        //clean up
        await liquidityMining.setPauseManager(oldPauseManager);
    });

    it("Should not be able to pause contract when no owner", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        const [_, userOne] = accounts;
        const isPausedBefore = await liquidityMining.paused();

        // when
        await expect(liquidityMining.connect(userOne).pause()).to.be.revertedWith("PT_704");

        // then
        const isPausedAfter = await liquidityMining.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.false;
    });

    it("Should not be able to pause contract when initial Pause Manager changed", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        const [_, userOne] = accounts;
        const isPausedBefore = await liquidityMining.paused();
        const oldPauseManager = await liquidityMining.getPauseManager();

        await liquidityMining.setPauseManager(await userOne.getAddress());

        // when
        await expect(liquidityMining.pause()).to.be.revertedWith("PT_704");

        // then
        const isPausedAfter = await liquidityMining.paused();

        expect(isPausedBefore).to.be.false;
        expect(isPausedAfter).to.be.false;

        //clean up
        await liquidityMining.setPauseManager(oldPauseManager);
    });

    it("Should be able to unpause contract when owner (initial deployment)", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;
        await liquidityMining.pause();
        const isPausedBefore = await liquidityMining.paused();

        // when
        await liquidityMining.unpause();

        // then
        const isPausedAfter = await liquidityMining.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.false;
    });

    it("Should be able to unpause contract when Pause Manager", async () => {
        // given
        const [_, userOne, userThree] = accounts;
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;
        await liquidityMining.pause();
        const isPausedBefore = await liquidityMining.paused();

        const oldPauseManager = await liquidityMining.getPauseManager();

        await liquidityMining.setPauseManager(await userThree.getAddress());

        // when
        await liquidityMining.connect(userThree).unpause();

        // then
        const isPausedAfter = await liquidityMining.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.false;

        //clean up
        await liquidityMining.setPauseManager(oldPauseManager);
    });

    it("Should not be able to unpause contract when no owner", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        const [_, userOne] = accounts;
        await liquidityMining.pause();
        const isPausedBefore = await liquidityMining.paused();

        // when
        await expect(liquidityMining.connect(userOne).unpause()).to.be.revertedWith("PT_704");

        // then
        const isPausedAfter = await liquidityMining.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.true;
    });

    it("Should not be able to unpause contract when initial Pause Manager changed", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        const [_, userOne, userThree] = accounts;
        await liquidityMining.pause();
        const isPausedBefore = await liquidityMining.paused();

        const oldPauseManager = await liquidityMining.getPauseManager();

        await liquidityMining.setPauseManager(await userThree.getAddress());

        // when
        await expect(liquidityMining.unpause()).to.be.revertedWith("PT_704");

        // then
        const isPausedAfter = await liquidityMining.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.true;

        //clean up
        await liquidityMining.setPauseManager(oldPauseManager);
    });
});
