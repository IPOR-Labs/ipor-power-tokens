import hre from "hardhat";
import chai from "chai";

import { BigNumber } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockMiningCalculation } from "../../types";
import { N1__0_18DEC, ZERO, N0__1_18DEC, N2__0_18DEC } from "../utils/Constants";
import linearFunctionTestData from "../asset/testDataForLinearFunction.json";

chai.use(solidity);
const { expect } = chai;

const itParam = require("mocha-param");

describe("John Stake and balance", () => {
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
            "2",
            "2"
        );
        //    when
        const result = await miningCalculation.calculateUserPowerUp(
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
            "4000000000000000000",
            N1__0_18DEC.toString()
        );
        //    when
        const result = await miningCalculation.calculateUserPowerUp(
            pwIporAmount,
            ipTokenAmount,
            verticalShift,
            horizontalShift
        );
        //    then
        expect(result).to.be.equal(verticalShift);
    });

    it("Should return 0 when ipToken < 1", async () => {
        //    given
        const { pwIporAmount, ipTokenAmount, verticalShift, horizontalShift } = getValues(
            "0",
            "999999999999999999",
            "400000000000000000",
            N1__0_18DEC.toString()
        );
        //    when
        const result = await miningCalculation.calculateUserPowerUp(
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
            N1__0_18DEC.toString(),
            N1__0_18DEC.toString()
        );
        //    when
        const result = await miningCalculation.calculateUserPowerUp(
            pwIporAmount,
            ipTokenAmount,
            verticalShift,
            horizontalShift
        );
        //    then
        expect(result).to.be.equal(N1__0_18DEC.mul(BigNumber.from("2")));
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
            "400000000000000000",
            N1__0_18DEC.toString()
        );
        //    when
        const result = await miningCalculation.calculateUserPowerUp(
            pwIporAmount,
            ipTokenAmount,
            verticalShift,
            horizontalShift
        );
        //    then
        expect(result).to.be.equal(BigNumber.from(item.result));
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
    verticalShift: BigNumber;
    horizontalShift: BigNumber;
} => {
    return {
        pwIporAmount: BigNumber.from(pwIporAmount),
        ipTokenAmount: BigNumber.from(ipTokenAmount),
        verticalShift: BigNumber.from(verticalShift),
        horizontalShift: BigNumber.from(horizontalShift),
    };
};
