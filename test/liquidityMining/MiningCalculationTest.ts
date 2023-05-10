import hre from "hardhat";
import chai from "chai";

import { BigNumber } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockMiningCalculation } from "../../types";
import { N1__0_18DEC, ZERO, N2__0_18DEC } from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

const itParam = require("mocha-param");

describe("LiquidityMining Stake and balance", () => {
    let miningCalculation: MockMiningCalculation;

    before(async () => {
        const MiningCalculation = await hre.ethers.getContractFactory("MockMiningCalculation");
        miningCalculation = (await MiningCalculation.deploy()) as MockMiningCalculation;
    });

    type TestData = { lpTokenAmount: string; pwTokenAmount: string; result: string };

    const powerUpTestData: TestData[] = [
        {
            lpTokenAmount: N1__0_18DEC.toString(),
            pwTokenAmount: N1__0_18DEC.toString(),
            result: "1984962500721156182",
        },
        {
            lpTokenAmount: N1__0_18DEC.toString(),
            pwTokenAmount: N2__0_18DEC.toString(),
            result: "2721928094887362348",
        },
        {
            lpTokenAmount: N2__0_18DEC.toString(),
            pwTokenAmount: N1__0_18DEC.toString(),
            result: "1400000000000000000",
        },
        {
            lpTokenAmount: N1__0_18DEC.mul(BigNumber.from("10")).toString(),
            pwTokenAmount: N1__0_18DEC.toString(),
            result: "663034405833793834",
        },
        {
            lpTokenAmount: N1__0_18DEC.mul(BigNumber.from("10")).toString(),
            pwTokenAmount: N1__0_18DEC.mul(BigNumber.from("123")).toString(),
            result: "5078071905112637653",
        },
        {
            lpTokenAmount: N1__0_18DEC.mul(BigNumber.from("33")).toString(),
            pwTokenAmount: N1__0_18DEC.mul(BigNumber.from("44")).toString(),
            result: "2274469117916141075",
        },
    ];

    itParam("Should calculate proper accountPowerUp", powerUpTestData, async (item: TestData) => {
        //    given
        const { pwTokenAmount, lpTokenAmount, verticalShift, horizontalShift } = getValues(
            item.pwTokenAmount,
            item.lpTokenAmount,
            "0x3ffd99999999999999e36310e0e2a848",
            "0x3fff0000000000000000000000000000"
        );

        //    when
        const actualResult = await miningCalculation.calculateAccountPowerUp(
            pwTokenAmount,
            lpTokenAmount,
            verticalShift,
            horizontalShift
        );
        //    then
        expect(actualResult).to.be.equal(BigNumber.from(item.result));
    });
});

const getValues = (
    pwTokenAmount: string,
    lpTokenAmount: string,
    verticalShift: string,
    horizontalShift: string
): {
    pwTokenAmount: BigNumber;
    lpTokenAmount: BigNumber;
    verticalShift: string;
    horizontalShift: string;
} => {
    return {
        pwTokenAmount: BigNumber.from(pwTokenAmount),
        lpTokenAmount: BigNumber.from(lpTokenAmount),
        verticalShift: verticalShift,
        horizontalShift: horizontalShift,
    };
};
