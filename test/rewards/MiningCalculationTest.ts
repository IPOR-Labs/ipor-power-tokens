import hre from "hardhat";
import chai from "chai";

import { BigNumber } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockMiningCalculation } from "../../types";
import { N1__0_18DEC, ZERO, N0__1_18DEC } from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

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
            N0__1_18DEC.toString(),
            "4000000000000000000",
            N1__0_18DEC.toString()
        );
        //    when
        const result = await miningCalculation.calculateAccountPowerUp(
            pwIporAmount,
            ipTokenAmount,
            verticalShift,
            horizontalShift
        );
        //    then
        expect(result).to.be.equal(verticalShift);
    });

    it("Should return verticalShift when pwIporAmount  = 0, lost precision  pass fraction ", async () => {
        //    given
        const { pwIporAmount, ipTokenAmount, verticalShift, horizontalShift } = getValues(
            "0",
            N0__1_18DEC.toString(),
            "400000000000000000",
            N1__0_18DEC.toString()
        );
        //    when
        const result = await miningCalculation.calculateAccountPowerUp(
            pwIporAmount,
            ipTokenAmount,
            verticalShift,
            horizontalShift
        );
        //    then
        expect(result).to.be.equal(BigNumber.from("400000000000000000"));
    });

    it("Should calculate simple case 1 ", async () => {
        //    given
        const { pwIporAmount, ipTokenAmount, verticalShift, horizontalShift } = getValues(
            N0__1_18DEC.toString(),
            N0__1_18DEC.toString(),
            N1__0_18DEC.toString(),
            N1__0_18DEC.toString()
        );
        //    when
        const result = await miningCalculation.calculateAccountPowerUp(
            pwIporAmount,
            ipTokenAmount,
            verticalShift,
            horizontalShift
        );
        //    then
        expect(result).to.be.equal(N1__0_18DEC.mul(BigNumber.from("2")));
    });

    //TODO: more tests which checks logarithm
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
