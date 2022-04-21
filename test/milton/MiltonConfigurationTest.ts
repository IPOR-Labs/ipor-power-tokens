import hre from "hardhat";
import chai from "chai";
import { Signer, BigNumber } from "ethers";
import { N0__01_18DEC, N1__0_18DEC, N0__1_18DEC, PERCENTAGE_100_18DEC } from "../utils/Constants";

import { MiltonDai, MiltonUsdt, MiltonUsdc, TestERC20 } from "../../types";

const { expect } = chai;

describe("MiltonConfiguration", () => {
    let miltonConfiguration: MiltonDai;
    let admin: Signer,
        userOne: Signer,
        userTwo: Signer,
        userThree: Signer,
        liquidityProvider: Signer;

    before(async () => {
        [admin, userOne, userTwo, userThree, liquidityProvider] = await hre.ethers.getSigners();
        const MiltonConfiguration = await hre.ethers.getContractFactory("MiltonDai");
        miltonConfiguration = (await MiltonConfiguration.deploy()) as MiltonDai;
    });

    it("Should create MiltonUsdt", async () => {
        // when
        const MiltonUsdt = await hre.ethers.getContractFactory("MiltonUsdt");
        const miltonUsdt = (await MiltonUsdt.deploy()) as MiltonUsdt;
        const tokenFactory = await hre.ethers.getContractFactory("TestERC20");
        const usdt = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20;
        await usdt.setDecimals(BigNumber.from("6"));

        await miltonUsdt.initialize(
            usdt.address, // we check only this position the rest could be random
            usdt.address,
            usdt.address,
            usdt.address,
            usdt.address
        );
        // then
        expect(miltonUsdt.address).to.be.not.empty;
        expect(await miltonUsdt.getAsset()).to.be.equal(usdt.address);
    });

    it("Should create MiltonUsdc", async () => {
        // when
        const MiltonUsdc = await hre.ethers.getContractFactory("MiltonUsdc");
        const miltonUsdc = (await MiltonUsdc.deploy()) as MiltonUsdt;
        const tokenFactory = await hre.ethers.getContractFactory("TestERC20");
        const usdc = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20;
        await usdc.setDecimals(BigNumber.from("6"));

        await miltonUsdc.initialize(
            usdc.address, // we check only this position the rest could be random
            usdc.address,
            usdc.address,
            usdc.address,
            usdc.address
        );
        expect(miltonUsdc.address).to.be.not.empty;
        expect(await miltonUsdc.getAsset()).to.be.equal(usdc.address);
    });

    it("Should create MiltonDai", async () => {
        // given
        const MiltonDai = await hre.ethers.getContractFactory("MiltonDai");
        const miltonDai = (await MiltonDai.deploy()) as MiltonDai;
        const tokenFactory = await hre.ethers.getContractFactory("TestERC20");
        const dai = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20;
        await dai.setDecimals(BigNumber.from("18"));
        // when
        await miltonDai.initialize(
            dai.address, // we check only this position the rest could be random
            dai.address,
            dai.address,
            dai.address,
            dai.address
        );
        // then
        expect(miltonDai.address).to.be.not.empty;
        expect(await miltonDai.getAsset()).to.be.equal(dai.address);
    });

    it("Should revert initializer(usdt) when mismatch asset and milton decimals", async () => {
        // when
        const MiltonUsdt = await hre.ethers.getContractFactory("MiltonUsdt");
        const miltonUsdt = (await MiltonUsdt.deploy()) as MiltonUsdt;
        const tokenFactory = await hre.ethers.getContractFactory("TestERC20");
        const usdt = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20;
        await usdt.setDecimals(BigNumber.from("8"));

        await expect(
            miltonUsdt.initialize(
                usdt.address, // we check only this position the rest could be random
                usdt.address,
                usdt.address,
                usdt.address,
                usdt.address
            )
        ).to.be.revertedWith("IPOR_001");
    });

    it("Should revert initializer(usdc) when mismatch asset and milton decimals", async () => {
        // when
        const MiltonUsdc = await hre.ethers.getContractFactory("MiltonUsdc");
        const miltonUsdc = (await MiltonUsdc.deploy()) as MiltonUsdt;
        const tokenFactory = await hre.ethers.getContractFactory("TestERC20");
        const usdc = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20;
        await usdc.setDecimals(BigNumber.from("8"));

        await expect(
            miltonUsdc.initialize(
                usdc.address, // we check only this position the rest could be random
                usdc.address,
                usdc.address,
                usdc.address,
                usdc.address
            )
        ).to.be.revertedWith("IPOR_001");
    });

    it("Should revert initializer for dai when mismatch asset and milton decimals", async () => {
        // when
        const MiltonDai = await hre.ethers.getContractFactory("MiltonDai");
        const miltonDai = (await MiltonDai.deploy()) as MiltonDai;
        const tokenFactory = await hre.ethers.getContractFactory("TestERC20");
        const dai = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20;
        await dai.setDecimals(BigNumber.from("8"));

        await expect(
            miltonDai.initialize(
                dai.address, // we check only this position the rest could be random
                dai.address,
                dai.address,
                dai.address,
                dai.address
            )
        ).to.be.revertedWith("IPOR_001");
    });

    it("Should create MiltonUsdc", async () => {
        const MiltonConfigurationUsdc = await hre.ethers.getContractFactory("MiltonUsdc");
        const miltonConfigurationUsdc = (await MiltonConfigurationUsdc.deploy()) as MiltonUsdc;
        // then
        expect(miltonConfigurationUsdc.address).to.be.not.empty;
    });

    it("should setup init value for Max Swap Total Amount", async () => {
        //when
        const actualValue = await miltonConfiguration.getMaxSwapCollateralAmount();
        //then
        expect(actualValue).to.be.eq(BigNumber.from("100000").mul(N1__0_18DEC));
    });

    it("should setup init value for Max Lp Utilization Percentage", async () => {
        //when
        const actualValue = await miltonConfiguration.getMaxLpUtilizationRate();
        //then
        expect(actualValue).to.be.eq(BigNumber.from("8").mul(N0__1_18DEC));
    });

    it("should setup init value for Max Lp Utilization Per Leg Percentage", async () => {
        //when
        const actualValue = await miltonConfiguration.getMaxLpUtilizationPerLegRate();
        //then
        expect(actualValue).to.be.eq(BigNumber.from("48").mul(N0__01_18DEC));
    });

    it("should setup init value for Income Fee Percentage", async () => {
        //when
        const actualValue = await miltonConfiguration.getIncomeFeeRate();
        //then
        expect(actualValue).to.be.eq(BigNumber.from("1").mul(N0__1_18DEC));
    });

    it("should setup init value for Opening Fee Percentage", async () => {
        //when
        const actualValue = await miltonConfiguration.getOpeningFeeRate();
        //then
        expect(actualValue).to.be.eq(BigNumber.from("1").mul(N0__01_18DEC));
    });
    it("should setup init value for Opening Fee Treasury Percentage", async () => {
        //when
        const actualValue = await miltonConfiguration.getOpeningFeeTreasuryPortionRate();
        //then
        expect(actualValue).to.be.eq(BigNumber.from("0"));
    });

    it("should setup init value for IPOR Publication Fee Amount", async () => {
        //when
        const actualValue = await miltonConfiguration.getIporPublicationFee();
        //then
        expect(actualValue).to.be.eq(BigNumber.from("10").mul(N1__0_18DEC));
    });
    it("should setup init value for Liquidation Deposit Amount", async () => {
        //when
        const actualValue = await miltonConfiguration.getLiquidationDepositAmount();
        //then
        expect(actualValue).to.be.eq(BigNumber.from("20").mul(N1__0_18DEC));
    });
    it("should setup init value for Max Leveragey Value", async () => {
        //when
        const actualValue = await miltonConfiguration.getMaxLeverage();
        //then
        expect(actualValue).to.be.eq(BigNumber.from("1000").mul(N1__0_18DEC));
    });

    it("should setup init value for Min Leveragey Value", async () => {
        //when
        const actualValue = await miltonConfiguration.getMinLeverage();
        //then
        expect(actualValue).to.be.eq(BigNumber.from("10").mul(N1__0_18DEC));
    });

    it("should init value for Opening Fee Treasury Percentage lower than 100%", async () => {
        //when
        const actualValue = await miltonConfiguration.getOpeningFeeTreasuryPortionRate();
        //then
        expect(actualValue.lte(PERCENTAGE_100_18DEC)).to.be.true;
    });

    it("should init value for Income Fee Percentage lower than 100%", async () => {
        //when
        const actualValue = await miltonConfiguration.getIncomeFeeRate();
        //then
        expect(actualValue.lte(PERCENTAGE_100_18DEC)).to.be.true;
    });
});