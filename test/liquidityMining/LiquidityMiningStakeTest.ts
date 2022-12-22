import hre, { upgrades } from "hardhat";
import chai from "chai";

import { Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockIporToken } from "../../types";
import { Tokens, getDeployedTokens, extractGlobalIndicators } from "../utils/LiquidityMiningUtils";
import {
    N1__0_18DEC,
    N1__0_6DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

describe("LiquidityMining Stake", () => {
    let tokens: Tokens;
    let liquidityMining: LiquidityMining;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let adminAddress: string, userOneAddress: string;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();
        adminAddress = await admin.getAddress();
        userOneAddress = await userOne.getAddress();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const IporToken = await ethers.getContractFactory("MockIporToken");
        const iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await admin.getAddress()
        )) as MockIporToken;
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        const powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;

        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMiningForTests");
        liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMiningForTests;

        await liquidityMining.setPowerIpor(await admin.getAddress());

        tokens.ipTokenDai.approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        tokens.ipTokenDai
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        tokens.ipTokenDai
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);

        tokens.ipTokenUsdc.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.ipTokenUsdc
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.ipTokenUsdc
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);

        tokens.ipTokenUsdt.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.ipTokenUsdt
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.ipTokenUsdt
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
    });

    it("Should not be able to stake when insufficient allowance on ipToken(Dai) ", async () => {
        // given
        const balanceBefore = await liquidityMining.balanceOf(
            adminAddress,
            tokens.ipTokenDai.address
        );
        // when
        await expect(
            liquidityMining.connect(userThree).stake(tokens.ipTokenDai.address, N1__0_18DEC)
        ).to.be.revertedWith("ERC20: insufficient allowance");

        // then
        const balanceAfter = await liquidityMining.balanceOf(
            adminAddress,
            tokens.ipTokenDai.address
        );
        // we dont
        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
    });

    it("Should be able to stake ipToken(Dai)", async () => {
        // given
        const balanceBefore = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.ipTokenDai.address
        );
        // when
        await liquidityMining.connect(userOne).stake(tokens.ipTokenDai.address, N1__0_18DEC);

        // then
        const balanceAfter = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.ipTokenDai.address
        );

        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(N1__0_18DEC);
    });

    it("Should not be able to stake when IpToken(usdt) is deactivated", async () => {
        // given
        const balanceBefore = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.ipTokenUsdc.address
        );
        await liquidityMining.removeIpTokenAsset(tokens.ipTokenUsdt.address);

        // when
        await expect(
            liquidityMining.connect(userOne).stake(tokens.ipTokenUsdt.address, N1__0_6DEC)
        ).to.be.revertedWith("IPOR_701");

        // then
        const balanceAfter = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.ipTokenUsdc.address
        );

        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
    });

    it("Should not be able to stake when contract is pause", async () => {
        // given
        const balanceBefore = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.ipTokenUsdc.address
        );
        await liquidityMining.pause();

        // when
        await expect(
            liquidityMining.connect(userOne).stake(tokens.ipTokenUsdt.address, N1__0_6DEC)
        ).to.be.revertedWith("Pausable: paused");
        // then
        const balanceAfter = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.ipTokenUsdc.address
        );

        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
    });

    it("Should not be able to stake when amount is zero", async () => {
        // given
        const balanceBefore = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.ipTokenUsdc.address
        );
        // when
        await expect(
            liquidityMining.connect(userOne).stake(tokens.ipTokenUsdt.address, ZERO)
        ).to.be.revertedWith("IPOR_717");

        // then
        const balanceAfter = await liquidityMining.balanceOf(
            userOneAddress,
            tokens.ipTokenUsdc.address
        );

        expect(balanceBefore).to.be.equal(ZERO);
        expect(balanceAfter).to.be.equal(ZERO);
    });
});
