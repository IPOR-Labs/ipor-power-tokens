import hre from "hardhat";
import chai from "chai";
import { Signer, BigNumber } from "ethers";
import {
    N1__0_18DEC,
    ZERO,
    USD_14_000_18DEC,
    USD_14_000_6DEC,
    TC_TOTAL_AMOUNT_10_000_18DEC,
    PERCENTAGE_3_18DEC,
    N1__0_6DEC,
} from "../utils/Constants";
import {
    MockMiltonSpreadModel,
    MiltonSpreadModels,
    MiltonUsdcCase,
    MiltonUsdtCase,
    MiltonDaiCase,
    prepareMockMiltonSpreadModel,
} from "../utils/MiltonUtils";
import {
    prepareTestData,
    prepareComplexTestDataDaiCase000,
    getStandardDerivativeParamsDAI,
    prepareApproveForUsers,
    setupTokenUsdtInitialValuesForUsers,
    getStandardDerivativeParamsUSDT,
} from "../utils/DataUtils";
import { MockStanleyCase } from "../utils/StanleyUtils";
import { JosephUsdcMockCases, JosephUsdtMockCases, JosephDaiMockCases } from "../utils/JosephUtils";

const { expect } = chai;

describe("Joseph - calculate Exchange Rate when Liquidity Pool", () => {
    let miltonSpreadModel: MockMiltonSpreadModel;
    let admin: Signer,
        userOne: Signer,
        userTwo: Signer,
        userThree: Signer,
        liquidityProvider: Signer;

    before(async () => {
        [admin, userOne, userTwo, userThree, liquidityProvider] = await hre.ethers.getSigners();
        miltonSpreadModel = await prepareMockMiltonSpreadModel(MiltonSpreadModels.CASE1);
    });

    it("should calculate Exchange Rate when Liquidity Pool Balance and ipToken Total Supply is zero", async () => {
        //given
        const testData = await prepareComplexTestDataDaiCase000(
            [admin, userOne, userTwo, userThree, liquidityProvider],
            miltonSpreadModel
        );
        const { josephDai } = testData;
        if (josephDai === undefined) {
            expect(true).to.be.false;
            return;
        }

        const expectedExchangeRate = N1__0_18DEC;

        //when
        const actualExchangeRate = await josephDai.itfCalculateExchangeRate(
            Math.floor(Date.now() / 1000)
        );
        //then
        expect(
            expectedExchangeRate,
            `Incorrect exchange rate for DAI, actual:  ${actualExchangeRate},
        expected: ${expectedExchangeRate}`
        ).to.be.eql(actualExchangeRate);
    });

    it("should calculate Exchange Rate when Liquidity Pool Balance is NOT zero and ipToken Total Supply is NOT zero, DAI 18 decimals", async () => {
        //given
        const testData = await prepareComplexTestDataDaiCase000(
            [admin, userOne, userTwo, userThree, liquidityProvider],
            miltonSpreadModel
        );

        const { josephDai, tokenDai } = testData;
        if (josephDai === undefined || tokenDai === undefined) {
            expect(true).to.be.false;
            return;
        }

        const params = getStandardDerivativeParamsDAI(userTwo, tokenDai);

        const expectedExchangeRate = N1__0_18DEC;

        await josephDai
            .connect(liquidityProvider)
            .itfProvideLiquidity(USD_14_000_18DEC, params.openTimestamp);

        //when
        const actualExchangeRate = await josephDai.itfCalculateExchangeRate(params.openTimestamp);
        //then
        expect(
            expectedExchangeRate,
            `Incorrect exchange rate for DAI, actual:  ${actualExchangeRate},
        expected: ${expectedExchangeRate}`
        ).to.be.eql(actualExchangeRate);
    });

    it("should calculate Exchange Rate when Liquidity Pool Balance is NOT zero and ipToken Total Supply is NOT zero, USDT 6 decimals", async () => {
        //given
        const testData = await prepareTestData(
            [admin, userOne, userTwo, userThree, liquidityProvider],
            ["USDT"],
            miltonSpreadModel,
            MiltonUsdcCase.CASE0,
            MiltonUsdtCase.CASE0,
            MiltonDaiCase.CASE0,
            MockStanleyCase.CASE0,
            JosephUsdcMockCases.CASE0,
            JosephUsdtMockCases.CASE0,
            JosephDaiMockCases.CASE0
        );
        const { josephUsdt, tokenUsdt } = testData;
        if (tokenUsdt === undefined || josephUsdt === undefined) {
            expect(true).to.be.false;
            return;
        }
        await prepareApproveForUsers(
            [userOne, userTwo, userThree, liquidityProvider],
            "USDT",
            testData
        );
        await setupTokenUsdtInitialValuesForUsers(
            [admin, userOne, userTwo, userThree, liquidityProvider],
            tokenUsdt
        );
        const params = getStandardDerivativeParamsUSDT(userTwo, tokenUsdt);

        const expectedExchangeRate = N1__0_18DEC;

        await josephUsdt
            .connect(liquidityProvider)
            .itfProvideLiquidity(USD_14_000_6DEC, params.openTimestamp);

        //when
        const actualExchangeRate = await josephUsdt.itfCalculateExchangeRate(params.openTimestamp);
        //then
        expect(
            expectedExchangeRate,
            `Incorrect exchange rate for USDT, actual:  ${actualExchangeRate},
        expected: ${expectedExchangeRate}`
        ).to.be.eql(actualExchangeRate);
    });

    it("should calculate Exchange Rate when Liquidity Pool Balance is zero and ipToken Total Supply is NOT zero", async () => {
        //given
        const testData = await prepareComplexTestDataDaiCase000(
            [admin, userOne, userTwo, userThree, liquidityProvider],
            miltonSpreadModel
        );

        const { josephDai, tokenDai, miltonStorageDai } = testData;
        if (tokenDai === undefined || josephDai === undefined || miltonStorageDai === undefined) {
            expect(true).to.be.false;
            return;
        }

        const params = getStandardDerivativeParamsDAI(userTwo, tokenDai);

        const expectedExchangeRate = ZERO;

        await josephDai
            .connect(liquidityProvider)
            .itfProvideLiquidity(TC_TOTAL_AMOUNT_10_000_18DEC, params.openTimestamp);

        //simulation that Liquidity Pool Balance equal 0, but ipToken is not burned

        await miltonStorageDai.setJoseph(await userOne.getAddress());
        await miltonStorageDai.connect(userOne).subtractLiquidity(TC_TOTAL_AMOUNT_10_000_18DEC);
        await miltonStorageDai.setJoseph(josephDai.address);

        //when
        const actualExchangeRate = await josephDai.itfCalculateExchangeRate(params.openTimestamp);
        //then
        expect(
            expectedExchangeRate,
            `Incorrect exchange rate for DAI, actual:  ${actualExchangeRate},
      expected: ${expectedExchangeRate}`
        ).to.be.eql(actualExchangeRate);
    });

    it("should calculate Exchange Rate, Exchange Rate greater than 1, DAI 18 decimals", async () => {
        //given
        const testData = await prepareComplexTestDataDaiCase000(
            [admin, userOne, userTwo, userThree, liquidityProvider],
            miltonSpreadModel
        );

        const { josephDai, tokenDai, miltonStorageDai, warren, miltonDai } = testData;
        if (
            tokenDai === undefined ||
            josephDai === undefined ||
            miltonStorageDai === undefined ||
            miltonDai === undefined
        ) {
            expect(true).to.be.false;
            return;
        }

        const params = getStandardDerivativeParamsDAI(userTwo, tokenDai);

        const expectedExchangeRate = BigNumber.from("1000074977506747976");

        await warren
            .connect(userOne)
            .itfUpdateIndex(params.asset, PERCENTAGE_3_18DEC, params.openTimestamp);
        await josephDai
            .connect(liquidityProvider)
            .itfProvideLiquidity(BigNumber.from("40").mul(N1__0_18DEC), params.openTimestamp);

        //open position to have something in Liquidity Pool
        await miltonDai
            .connect(userTwo)
            .itfOpenSwapPayFixed(
                params.openTimestamp,
                BigNumber.from("40").mul(N1__0_18DEC),
                params.toleratedQuoteValue,
                params.leverage
            );

        //when
        const actualExchangeRate = await josephDai.itfCalculateExchangeRate(params.openTimestamp);

        //then
        expect(
            expectedExchangeRate,
            `Incorrect exchange rate for DAI, actual:  ${actualExchangeRate},
        expected: ${expectedExchangeRate}`
        ).to.be.eql(actualExchangeRate);
    });

    it("should calculate Exchange Rate when Liquidity Pool Balance is NOT zero and ipToken Total Supply is zero", async () => {
        //given
        const testData = await prepareComplexTestDataDaiCase000(
            [admin, userOne, userTwo, userThree, liquidityProvider],
            miltonSpreadModel
        );

        const { josephDai, tokenDai, miltonStorageDai, ipTokenDai, miltonDai } = testData;
        if (
            tokenDai === undefined ||
            josephDai === undefined ||
            miltonStorageDai === undefined ||
            miltonDai === undefined ||
            ipTokenDai === undefined
        ) {
            expect(true).to.be.false;
            return;
        }

        const params = getStandardDerivativeParamsDAI(userTwo, tokenDai);

        const expectedExchangeRate = N1__0_18DEC;

        await testData.warren
            .connect(userOne)
            .itfUpdateIndex(params.asset, PERCENTAGE_3_18DEC, params.openTimestamp);

        //BEGIN HACK - provide liquidity without mint ipToken
        await miltonStorageDai.setJoseph(await admin.getAddress());
        await miltonStorageDai.addLiquidity(BigNumber.from("2000").mul(N1__0_18DEC));
        await tokenDai.transfer(miltonDai.address, BigNumber.from("2000").mul(N1__0_18DEC));
        await miltonStorageDai.setJoseph(josephDai.address);
        //END HACK - provide liquidity without mint ipToken

        const balance = await miltonDai.getAccruedBalance();

        const expectedIpTokenDaiBalance = ZERO;

        const actualIpTokenDaiBalance = await tokenDai.balanceOf(ipTokenDai.address);
        const actualLiquidityPoolBalance = balance.liquidityPool;

        //when
        let actualExchangeRate = await josephDai.itfCalculateExchangeRate(params.openTimestamp);
        //then
        expect(expectedIpTokenDaiBalance).to.be.eql(actualIpTokenDaiBalance);
        expect(actualLiquidityPoolBalance).to.be.gte(ZERO);

        expect(
            expectedExchangeRate,
            `Incorrect exchange rate for DAI, actual:  ${actualExchangeRate},
        expected: ${expectedExchangeRate}`
        ).to.be.eql(actualExchangeRate);
    });

    it("should calculate Exchange Rate, Exchange Rate greater than 1, USDT 6 decimals", async () => {
        //given
        const testData = await prepareTestData(
            [admin, userOne, userTwo, userThree, liquidityProvider],
            ["USDT"],
            miltonSpreadModel,
            MiltonUsdcCase.CASE0,
            MiltonUsdtCase.CASE0,
            MiltonDaiCase.CASE0,
            MockStanleyCase.CASE0,
            JosephUsdcMockCases.CASE0,
            JosephUsdtMockCases.CASE0,
            JosephDaiMockCases.CASE0
        );
        await prepareApproveForUsers(
            [userOne, userTwo, userThree, liquidityProvider],
            "USDT",
            testData
        );

        const { josephUsdt, tokenUsdt, warren, miltonUsdt } = testData;
        if (tokenUsdt === undefined || josephUsdt === undefined || miltonUsdt === undefined) {
            expect(true).to.be.false;
            return;
        }

        await setupTokenUsdtInitialValuesForUsers(
            [admin, userOne, userTwo, userThree, liquidityProvider],
            tokenUsdt
        );
        const params = getStandardDerivativeParamsUSDT(userTwo, tokenUsdt);

        const expectedExchangeRate = BigNumber.from("1000074977506747976");

        await warren
            .connect(userOne)
            .itfUpdateIndex(params.asset, PERCENTAGE_3_18DEC, params.openTimestamp);
        await josephUsdt
            .connect(liquidityProvider)
            .itfProvideLiquidity(BigNumber.from("40").mul(N1__0_6DEC), params.openTimestamp);

        //open position to have something in Liquidity Pool
        await miltonUsdt
            .connect(userTwo)
            .itfOpenSwapPayFixed(
                params.openTimestamp,
                BigNumber.from("40").mul(N1__0_6DEC),
                params.toleratedQuoteValue,
                params.leverage
            );

        //when
        const actualExchangeRate = await josephUsdt.itfCalculateExchangeRate(params.openTimestamp);
        //then
        expect(
            expectedExchangeRate,
            `Incorrect exchange rate for USDT, actual:  ${actualExchangeRate},
            expected: ${expectedExchangeRate}`
        ).to.be.eql(actualExchangeRate);
    });
});