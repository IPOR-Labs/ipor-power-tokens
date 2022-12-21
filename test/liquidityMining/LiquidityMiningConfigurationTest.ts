import hre, { upgrades } from "hardhat";
import chai from "chai";

import { Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockIporToken, PowerIpor } from "../../types";
import { Tokens, getDeployedTokens } from "../utils/LiquidityMiningUtils";

chai.use(solidity);
const { expect } = chai;

const randomAddress = "0x0B54FA10558caBBdd0D6df5b8667913C43567Bc5";

describe("LiquidityMining configuration, deploy tests", () => {
    let tokens: Tokens;
    let accounts: Signer[];
    let iporToken: MockIporToken;
    let powerIpor: PowerIpor;

    before(async () => {
        accounts = await hre.ethers.getSigners();
        tokens = await getDeployedTokens(accounts);
        const IporToken = await ethers.getContractFactory("MockIporToken");
        iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await accounts[0].getAddress()
        )) as MockIporToken;
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;
    });

    it("Should deploy contract without assets", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        // when
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;
        // then
        expect(liquidityMining.address).to.be.not.undefined;
        expect(liquidityMining.address).to.be.not.null;
        expect(liquidityMining.address).to.be.not.equal("");
    });

    it("Should not be able to deploy contract when Power Ipor Token address is zero", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");

        // when
        await expect(
            upgrades.deployProxy(LiquidityMining, [
                [],
                "0x0000000000000000000000000000000000000000",
                iporToken.address,
            ])
        ).to.be.revertedWith("IPOR_715");
    });

    it("Should not be able to deploy contract when address is not powerIpor", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");

        // when
        await expect(
            upgrades.deployProxy(LiquidityMining, [[], iporToken.address, iporToken.address])
        ).to.be.revertedWith("IPOR_716");
    });

    it("Should not be able to deploy contract when address is not iporToken", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");

        // when
        await expect(
            upgrades.deployProxy(LiquidityMining, [[], powerIpor.address, powerIpor.address])
        ).to.be.revertedWith("IPOR_716");
    });

    it("Should deploy contract with 3 assets", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");

        // when
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;

        // then
        const isDaiActive = await liquidityMining.isIpTokenSupported(tokens.ipTokenDai.address);
        const isUsdcActive = await liquidityMining.isIpTokenSupported(tokens.ipTokenUsdc.address);
        const isUsdtActive = await liquidityMining.isIpTokenSupported(tokens.ipTokenUsdt.address);

        expect(isDaiActive).to.be.true;
        expect(isUsdcActive).to.be.true;
        expect(isUsdtActive).to.be.true;
    });

    it("Should deploy contract with 1 assets", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");

        // when
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.ipTokenDai.address],
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;

        // then
        const isDaiActive = await liquidityMining.isIpTokenSupported(tokens.ipTokenDai.address);
        const isUsdcActive = await liquidityMining.isIpTokenSupported(tokens.ipTokenUsdc.address);
        const isUsdtActive = await liquidityMining.isIpTokenSupported(tokens.ipTokenUsdt.address);

        expect(isDaiActive).to.be.true;
        expect(isUsdcActive).to.be.false;
        expect(isUsdtActive).to.be.false;
    });

    it("Should be able to add new asset by owner", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;
        const isDaiActiveBefore = await liquidityMining.isIpTokenSupported(
            tokens.ipTokenDai.address
        );
        const isUsdcActiveBefore = await liquidityMining.isIpTokenSupported(
            tokens.ipTokenUsdc.address
        );
        const isUsdtActiveBefore = await liquidityMining.isIpTokenSupported(
            tokens.ipTokenUsdt.address
        );

        // when
        await liquidityMining.addIpTokenAsset(tokens.ipTokenUsdc.address);
        await liquidityMining.addIpTokenAsset(tokens.ipTokenUsdt.address);

        // then
        const isDaiActiveAfter = await liquidityMining.isIpTokenSupported(
            tokens.ipTokenDai.address
        );
        const isUsdcActiveAfter = await liquidityMining.isIpTokenSupported(
            tokens.ipTokenUsdc.address
        );
        const isUsdtActiveAfter = await liquidityMining.isIpTokenSupported(
            tokens.ipTokenUsdt.address
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
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;
        const [_, userOne] = accounts;

        // when
        await expect(
            //when
            liquidityMining.connect(userOne).addIpTokenAsset(tokens.ipTokenUsdc.address)
            //then
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should be able to transfer ownership", async () => {
        // given
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        const liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [],
            powerIpor.address,
            iporToken.address,
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
            powerIpor.address,
            iporToken.address,
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
            powerIpor.address,
            iporToken.address,
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
            powerIpor.address,
            iporToken.address,
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
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;

        const [_, userOne] = accounts;
        const isPausedBefore = await liquidityMining.paused();

        // when
        await expect(liquidityMining.connect(userOne).pause()).to.be.revertedWith("IPOR_704");

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
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;

        const [_, userOne] = accounts;
        const isPausedBefore = await liquidityMining.paused();
        const oldPauseManager = await liquidityMining.getPauseManager();

        await liquidityMining.setPauseManager(await userOne.getAddress());

        // when
        await expect(liquidityMining.pause()).to.be.revertedWith("IPOR_704");

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
            powerIpor.address,
            iporToken.address,
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
            powerIpor.address,
            iporToken.address,
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
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;

        const [_, userOne] = accounts;
        await liquidityMining.pause();
        const isPausedBefore = await liquidityMining.paused();

        // when
        await expect(liquidityMining.connect(userOne).unpause()).to.be.revertedWith("IPOR_704");

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
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;

        const [_, userOne, userThree] = accounts;
        await liquidityMining.pause();
        const isPausedBefore = await liquidityMining.paused();

        const oldPauseManager = await liquidityMining.getPauseManager();

        await liquidityMining.setPauseManager(await userThree.getAddress());

        // when
        await expect(liquidityMining.unpause()).to.be.revertedWith("IPOR_704");

        // then
        const isPausedAfter = await liquidityMining.paused();

        expect(isPausedBefore).to.be.true;
        expect(isPausedAfter).to.be.true;

        //clean up
        await liquidityMining.setPauseManager(oldPauseManager);
    });
});
