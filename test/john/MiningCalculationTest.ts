import hre from "hardhat";
import chai from "chai";

import { BigNumber, Bytes, utils } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockMiningCalculation } from "../../types";
import { N1__0_18DEC, ZERO, N0__1_18DEC, N2__0_18DEC } from "../utils/Constants";
import linearFunctionTestData from "../asset/testDataForLinearFunction.json";

chai.use(solidity);
const { expect } = chai;

const itParam = require("mocha-param");

describe.only("John Stake and balance", () => {
    let miningCalculation: MockMiningCalculation;

    before(async () => {
        const MiningCalculation = await hre.ethers.getContractFactory("MockMiningCalculation");
        miningCalculation = (await MiningCalculation.deploy()) as MockMiningCalculation;
    });

    it("Should return zero when ipTokenAmount  = 0 ", async () => {
        //    given
        const { pwIporAmount, ipTokenAmount, verticalShift, horizontalShift } = getValues(
            "2",
            "0",
            "0x3ffd99999999999999e36310e0e2a848",
            "0x3fff0000000000000000000000000000"
        );
        //    when
        const result = await miningCalculation.calculateAccountPowerUp(
            pwIporAmount,
            ipTokenAmount,
            verticalShift,
            horizontalShift
        );
        //    then
        expect(result).to.be.equal(ZERO);
    });

    it("Should return verticalShift when pwIporAmount  = 0 ", async () => {
        //    given
        const { pwIporAmount, ipTokenAmount, verticalShift, horizontalShift } = getValues(
            "0",
            N1__0_18DEC.toString(),
            "0x3ffd99999999999999e36310e0e2a848",
            "0x3fff0000000000000000000000000000"
        );
        const expectedResult = "400000000000000000";

        //    when
        const actualResult = await miningCalculation.calculateAccountPowerUp(
            pwIporAmount,
            ipTokenAmount,
            verticalShift,
            horizontalShift
        );

        //    then
        expect(actualResult).to.be.equal(expectedResult);
    });

    it("Should return 0 when ipToken < 1", async () => {
        //    given
        const { pwIporAmount, ipTokenAmount, verticalShift, horizontalShift } = getValues(
            "0",
            "999999999999999999",
            "0x3ffd99999999999999e36310e0e2a848",
            "0x3fff0000000000000000000000000000"
        );
        //    when
        const result = await miningCalculation.calculateAccountPowerUp(
            pwIporAmount,
            ipTokenAmount,
            verticalShift,
            horizontalShift
        );
        //    then
        expect(result).to.be.equal(ZERO);
    });

    it("Should calculate simple case 1 ", async () => {
        //    given
        const { pwIporAmount, ipTokenAmount, verticalShift, horizontalShift } = getValues(
            N1__0_18DEC.toString(),
            N1__0_18DEC.toString(),
            "0x3ffd99999999999999e36310e0e2a848",
            "0x3fff0000000000000000000000000000"
        );
        //    when
        const result = await miningCalculation.calculateAccountPowerUp(
            pwIporAmount,
            ipTokenAmount,
            verticalShift,
            horizontalShift
        );
        //    then
        expect(result).to.be.equal(BigNumber.from("1400000000000000000"));
    });

    it("Should throw IPOR_711 - aggregate power up is negative", async () => {
        //given
        const accountPowerUp = BigNumber.from("900").mul(N1__0_18DEC);
        const accountIpTokenAmount = BigNumber.from("1").mul(N1__0_18DEC);
        const previousAccountPowerUp = BigNumber.from("1000").mul(N1__0_18DEC);
        const previousAccountIpTokenAmount = BigNumber.from("10").mul(N1__0_18DEC);
        const previousAggregatedPowerUp = BigNumber.from("900").mul(N1__0_18DEC);

        //when
        await expect(
            miningCalculation.calculateAggregatedPowerUp(
                accountPowerUp,
                accountIpTokenAmount,
                previousAccountPowerUp,
                previousAccountIpTokenAmount,
                previousAggregatedPowerUp
            )
        ).to.be.revertedWith("IPOR_711");
    });

    it("Should throw IPOR_712 - block number lower than previous block number", async () => {
        //given
        const blockNumber = BigNumber.from("900").mul(N1__0_18DEC);
        const lastRebalanceBlockNumber = BigNumber.from("1000").mul(N1__0_18DEC);
        const rewardsPerBlock = N1__0_18DEC;
        const previousAccruedRewards = BigNumber.from("900").mul(N1__0_18DEC);

        //when
        await expect(
            miningCalculation.calculateAccruedRewards(
                blockNumber,
                lastRebalanceBlockNumber,
                rewardsPerBlock,
                previousAccruedRewards
            )
        ).to.be.revertedWith("IPOR_712");
    });

    it("Should throw IPOR_713 - composite multiplier lower than account composite multiplier ", async () => {
        //given
        const accountIpTokenAmount = BigNumber.from("1000").mul(N1__0_18DEC);
        const accountPowerUp = BigNumber.from("1000").mul(N1__0_18DEC);
        const accountCompositeMultiplierCumulativePrevBlock =
            BigNumber.from("1000").mul(N1__0_18DEC);
        const compositeMultiplierCumulativePrevBlock = BigNumber.from("900").mul(N1__0_18DEC);

        //when
        await expect(
            miningCalculation.calculateAccountRewards(
                accountIpTokenAmount,
                accountPowerUp,
                accountCompositeMultiplierCumulativePrevBlock,
                compositeMultiplierCumulativePrevBlock
            )
        ).to.be.revertedWith("IPOR_713");
    });

    it("Should not calculate any rewards when IP Token amount = 0", async () => {
        //given
        const accountIpTokenAmount = ZERO;
        const accountPowerUp = BigNumber.from("1000").mul(N1__0_18DEC);
        const accountCompositeMultiplierCumulativePrevBlock =
            BigNumber.from("1000").mul(N1__0_18DEC);
        const compositeMultiplierCumulativePrevBlock = BigNumber.from("2000").mul(N1__0_18DEC);

        //when
        const result = await miningCalculation.calculateAccountRewards(
            accountIpTokenAmount,
            accountPowerUp,
            accountCompositeMultiplierCumulativePrevBlock,
            compositeMultiplierCumulativePrevBlock
        );

        //then
        expect(result).to.be.equal(ZERO);
    });

    type TestData = { ipTokenAmount: string; pwIporAmount: string; result: string };

    const powerUpTestData: TestData[] = [
        {
            ipTokenAmount: N1__0_18DEC.toString(),
            pwIporAmount: N1__0_18DEC.toString(),
            result: "1400000000000000000",
        },
        {
            ipTokenAmount: N1__0_18DEC.toString(),
            pwIporAmount: N2__0_18DEC.toString(),
            result: "1984962500721156182",
        },
        {
            ipTokenAmount: N2__0_18DEC.toString(),
            pwIporAmount: N1__0_18DEC.toString(),
            result: "984962500721156182",
        },
        {
            ipTokenAmount: N1__0_18DEC.mul(BigNumber.from("10")).toString(),
            pwIporAmount: N1__0_18DEC.toString(),
            result: "537503523749934909",
        },
        {
            ipTokenAmount: N1__0_18DEC.mul(BigNumber.from("10")).toString(),
            pwIporAmount: N1__0_18DEC.mul(BigNumber.from("123")).toString(),
            result: "4133354340613827254",
        },
        {
            ipTokenAmount: N1__0_18DEC.mul(BigNumber.from("33")).toString(),
            pwIporAmount: N1__0_18DEC.mul(BigNumber.from("44")).toString(),
            result: "1622392421336447926",
        },
    ];

    itParam("Should calculate proper accountPowerUp", powerUpTestData, async (item: TestData) => {
        //    given
        const { pwIporAmount, ipTokenAmount, verticalShift, horizontalShift } = getValues(
            item.pwIporAmount,
            item.ipTokenAmount,
            "0x3ffd99999999999999e36310e0e2a848",
            "0x3fff0000000000000000000000000000"
        );

        //    when
        const actualResult = await miningCalculation.calculateAccountPowerUp(
            pwIporAmount,
            ipTokenAmount,
            verticalShift,
            horizontalShift
        );
        //    then
        expect(actualResult).to.be.equal(BigNumber.from(item.result));
    });
});

const getValues = (
    pwIporAmount: string,
    ipTokenAmount: string,
    verticalShift: string,
    horizontalShift: string
): {
    pwIporAmount: BigNumber;
    ipTokenAmount: BigNumber;
    verticalShift: string;
    horizontalShift: string;
} => {
    return {
        pwIporAmount: BigNumber.from(pwIporAmount),
        ipTokenAmount: BigNumber.from(ipTokenAmount),
        verticalShift: verticalShift,
        horizontalShift: horizontalShift,
    };
};
