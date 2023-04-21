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

    it("Should return zero when lpTokenAmount  = 0 ", async () => {
        //    given
        const { pwTokenAmount, lpTokenAmount, verticalShift, horizontalShift } = getValues(
            "2",
            "0",
            "0x3ffd99999999999999e36310e0e2a848",
            "0x3fff0000000000000000000000000000"
        );
        //    when
        const result = await miningCalculation.calculateAccountPowerUp(
            pwTokenAmount,
            lpTokenAmount,
            verticalShift,
            horizontalShift
        );
        //    then
        expect(result).to.be.equal(ZERO);
    });

    it("Should return verticalShift when pwTokenAmount  = 0 ", async () => {
        //    given
        const { pwTokenAmount, lpTokenAmount, verticalShift, horizontalShift } = getValues(
            "0",
            N1__0_18DEC.toString(),
            "0x3ffd99999999999999e36310e0e2a848",
            "0x3fff0000000000000000000000000000"
        );
        const expectedResult = "200000000000000000";

        //    when
        const actualResult = await miningCalculation.calculateAccountPowerUp(
            pwTokenAmount,
            lpTokenAmount,
            verticalShift,
            horizontalShift
        );

        //    then
        expect(actualResult).to.be.equal(expectedResult);
    });

    it("Should return ~0.2 when pwTokenAmount  = 0 and HS~0.5 and VS~1.4", async () => {
        //    given
        const { pwTokenAmount, lpTokenAmount, verticalShift, horizontalShift } = getValues(
            "0",
            N1__0_18DEC.toString(),
            "0x3fff6666666666666666666666666666",
            "0x3ffe0000000000000000000000000000"
        );
        const expectedResult = "200000000000000000";

        //    when
        const actualResult = await miningCalculation.calculateAccountPowerUp(
            pwTokenAmount,
            lpTokenAmount,
            verticalShift,
            horizontalShift
        );

        //    then
        expect(actualResult).to.be.equal(expectedResult);
    });

    it("Should return 0 when lpToken < 1", async () => {
        //    given
        const { pwTokenAmount, lpTokenAmount, verticalShift, horizontalShift } = getValues(
            "0",
            "999999999999999999",
            "0x3ffd99999999999999e36310e0e2a848",
            "0x3fff0000000000000000000000000000"
        );
        //    when
        const result = await miningCalculation.calculateAccountPowerUp(
            pwTokenAmount,
            lpTokenAmount,
            verticalShift,
            horizontalShift
        );
        //    then
        expect(result).to.be.equal(ZERO);
    });

    it("Should calculate simple case 1 ", async () => {
        //    given
        const { pwTokenAmount, lpTokenAmount, verticalShift, horizontalShift } = getValues(
            N1__0_18DEC.toString(),
            N1__0_18DEC.toString(),
            "0x3ffd99999999999999e36310e0e2a848",
            "0x3fff0000000000000000000000000000"
        );
        //    when
        const result = await miningCalculation.calculateAccountPowerUp(
            pwTokenAmount,
            lpTokenAmount,
            verticalShift,
            horizontalShift
        );
        //    then
        expect(result).to.be.equal(BigNumber.from("1984962500721156182"));
    });

    it("Should throw PT_711 - aggregate power up is negative", async () => {
        //given
        const accountPowerUp = BigNumber.from("900").mul(N1__0_18DEC);
        const accountLpTokenAmount = BigNumber.from("1").mul(N1__0_18DEC);
        const previousAccountPowerUp = BigNumber.from("1000").mul(N1__0_18DEC);
        const previousAccountLpTokenAmount = BigNumber.from("10").mul(N1__0_18DEC);
        const previousAggregatedPowerUp = BigNumber.from("900").mul(N1__0_18DEC);

        //when
        await expect(
            miningCalculation.calculateAggregatedPowerUp(
                accountPowerUp,
                accountLpTokenAmount,
                previousAccountPowerUp,
                previousAccountLpTokenAmount,
                previousAggregatedPowerUp
            )
        ).to.be.revertedWith("PT_711");
    });

    it("Should throw PT_712 - block number lower than previous block number", async () => {
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
        ).to.be.revertedWith("PT_712");
    });

    it("Should throw PT_713 - composite multiplier lower than account composite multiplier ", async () => {
        //given
        const accountLpTokenAmount = BigNumber.from("1000").mul(N1__0_18DEC);
        const accountPowerUp = BigNumber.from("1000").mul(N1__0_18DEC);
        const accountCompositeMultiplierCumulativePrevBlock =
            BigNumber.from("1000").mul(N1__0_18DEC);
        const compositeMultiplierCumulativePrevBlock = BigNumber.from("900").mul(N1__0_18DEC);

        //when
        await expect(
            miningCalculation.calculateAccountRewards(
                accountLpTokenAmount,
                accountPowerUp,
                accountCompositeMultiplierCumulativePrevBlock,
                compositeMultiplierCumulativePrevBlock
            )
        ).to.be.revertedWith("PT_713");
    });

    it("Should not calculate any rewards when IP Token amount = 0", async () => {
        //given
        const accountLpTokenAmount = ZERO;
        const accountPowerUp = BigNumber.from("1000").mul(N1__0_18DEC);
        const accountCompositeMultiplierCumulativePrevBlock =
            BigNumber.from("1000").mul(N1__0_18DEC);
        const compositeMultiplierCumulativePrevBlock = BigNumber.from("2000").mul(N1__0_18DEC);

        //when
        const result = await miningCalculation.calculateAccountRewards(
            accountLpTokenAmount,
            accountPowerUp,
            accountCompositeMultiplierCumulativePrevBlock,
            compositeMultiplierCumulativePrevBlock
        );

        //then
        expect(result).to.be.equal(ZERO);
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
