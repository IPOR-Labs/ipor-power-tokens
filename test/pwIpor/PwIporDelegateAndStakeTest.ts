import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockIporToken, PowerIpor, LiquidityMining } from "../../types";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    N0__1_18DEC,
    N2__0_18DEC,
    N1__0_8DEC,
} from "../utils/Constants";
import { it } from "mocha";
import {
    expectGlobalIndicators,
    expectAccountIndicators,
    extractGlobalIndicators,
    extractAccountIndicators,
    getDeployedTokens,
    Tokens,
} from "../utils/LiquidityMiningUtils";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PowerIpor delegateAndStakeToLiquidityMining", () => {
    let accounts: Signer[];
    let iporToken: MockIporToken;
    let powerIpor: PowerIpor;
    let tokens: Tokens;
    let liquidityMining: LiquidityMining;

    before(async () => {
        accounts = await ethers.getSigners();
        tokens = await getDeployedTokens(accounts);
    });

    beforeEach(async () => {
        const IporToken = await ethers.getContractFactory("MockIporToken");
        iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await accounts[0].getAddress()
        )) as MockIporToken;
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;
        await iporToken.increaseAllowance(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;

        await liquidityMining.setRewardsPerBlock(tokens.lpTokenDai.address, N1__0_8DEC);
        await liquidityMining.setRewardsPerBlock(tokens.lpTokenUsdc.address, N1__0_8DEC);
        await liquidityMining.setRewardsPerBlock(tokens.lpTokenUsdt.address, N1__0_8DEC);

        await powerIpor.setLiquidityMining(liquidityMining.address);
    });

    it("Should revert transaction when mismatch arrays - case 1", async () => {
        //    given
        await powerIpor.stake(N1__0_18DEC);
        const [userOne] = accounts;
        //    when
        await expect(
            powerIpor.delegateAndStakeToLiquidityMining(
                [await userOne.getAddress()],
                [N0__1_18DEC, N1__0_18DEC],
                [N0__1_18DEC, N1__0_18DEC]
            )
        ).to.be.revertedWith("IPOR_718");
    });

    it("Should revert transaction when mismatch arrays - case 2", async () => {
        //    given
        await powerIpor.stake(N1__0_18DEC);
        const [userOne] = accounts;
        //    when
        await expect(
            powerIpor.delegateAndStakeToLiquidityMining(
                [await userOne.getAddress(), await userOne.getAddress()],
                [N0__1_18DEC],
                [N0__1_18DEC, N1__0_18DEC]
            )
        ).to.be.revertedWith("IPOR_718");
    });

    it("Should revert transaction when mismatch arrays - case 3", async () => {
        //    given
        await powerIpor.stake(N1__0_18DEC);
        const [userOne] = accounts;
        //    when
        await expect(
            powerIpor.delegateAndStakeToLiquidityMining(
                [await userOne.getAddress(), await userOne.getAddress()],
                [N0__1_18DEC, N1__0_18DEC],
                [N0__1_18DEC]
            )
        ).to.be.revertedWith("IPOR_718");
    });

    it("Should revert transaction when insufficient number of tokens to stake", async () => {
        //    given
        await powerIpor.stake(N0__1_18DEC);
        const [admin, userOne] = accounts;
        //    when
        await expect(
            powerIpor.delegateAndStakeToLiquidityMining(
                [await admin.getAddress()],
                [N1__0_18DEC],
                [N1__0_18DEC]
            )
        ).to.be.revertedWith("IPOR_708");
    });

    it("Should revert transaction when insufficient number of tokens to stake, two assets", async () => {
        //    given
        await powerIpor.stake(N1__0_18DEC);
        //    when
        await expect(
            powerIpor.delegateAndStakeToLiquidityMining(
                [tokens.tokenDai.address, tokens.tokenUsdc.address],
                [N1__0_18DEC, N0__1_18DEC],
                [N1__0_18DEC, N0__1_18DEC]
            )
        ).to.be.revertedWith("IPOR_708");
    });

    it("Should be able to delegate into one asset and no stake lpToken when pass one asset", async () => {
        //    given

        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

        const [admin] = accounts;
        await powerIpor.stake(N1__0_18DEC);
        const delegatedBalanceBefore = await powerIpor.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );

        //    when
        await powerIpor.delegateAndStakeToLiquidityMining(
            [tokens.lpTokenDai.address],
            [N0__1_18DEC],
            [ZERO]
        );

        //    then

        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const delegatedBalanceAfter = await powerIpor.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );
        const lpTokenBalanceAfter = await liquidityMining.balanceOf(
            await admin.getAddress(),
            tokens.lpTokenDai.address
        );

        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(N0__1_18DEC);
        expect(lpTokenBalanceAfter).to.be.equal(ZERO);
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(liquidityMiningIpDaiBalanceBefore);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(N1__0_18DEC)
        );
    });

    it("Should be able to delegate into one asset and stake lpToken when pass one asset", async () => {
        //    given
        const delegatePwTokenToLiquidityMining = N1__0_18DEC;
        const stakeLpTokenToLiquidityMining = N1__0_18DEC;

        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const [admin] = accounts;
        await powerIpor.stake(N1__0_18DEC);
        const delegatedBalanceBefore = await powerIpor.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );
        await tokens.lpTokenDai.approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        const globalIndicatorsBefore = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenDai.address
        );
        const accountIndicatorsBefore = await liquidityMining.getAccountIndicators(
            await admin.getAddress(),
            tokens.lpTokenDai.address
        );

        //    when
        await powerIpor.delegateAndStakeToLiquidityMining(
            [tokens.lpTokenDai.address],
            [delegatePwTokenToLiquidityMining],
            [stakeLpTokenToLiquidityMining]
        );

        //    then

        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const delegatedBalanceAfter = await powerIpor.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );
        const lpTokenBalanceAfter = await liquidityMining.balanceOf(
            await admin.getAddress(),
            tokens.lpTokenDai.address
        );
        const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenDai.address
        );
        const accountIndicatorsAfter = await liquidityMining.getAccountIndicators(
            await admin.getAddress(),
            tokens.lpTokenDai.address
        );

        expectGlobalIndicators(
            extractGlobalIndicators(globalIndicatorsBefore),
            ZERO,
            ZERO,
            ZERO,
            ZERO,
            -1,
            100000000
        );
        expectGlobalIndicators(
            extractGlobalIndicators(globalIndicatorsAfter),
            BigNumber.from("1984962500721156181"),
            ZERO,
            BigNumber.from("503787854751256144452805236"),
            ZERO,
            -1,
            100000000
        );

        expectAccountIndicators(
            extractAccountIndicators(accountIndicatorsBefore),
            ZERO,
            ZERO,
            ZERO,
            ZERO
        );
        expectAccountIndicators(
            extractAccountIndicators(accountIndicatorsAfter),
            BigNumber.from("1984962500721156181"),
            ZERO,
            N1__0_18DEC,
            N1__0_18DEC
        );
        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(N1__0_18DEC);
        expect(lpTokenBalanceAfter).to.be.equal(N1__0_18DEC);
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(stakeLpTokenToLiquidityMining)
        );
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(delegatePwTokenToLiquidityMining)
        );
    });

    it("Should be able to stake and delegate two asset when pass two asset", async () => {
        //    given
        const [admin] = accounts;
        await powerIpor.stake(N2__0_18DEC);
        await tokens.lpTokenDai.approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.lpTokenUsdc.approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);

        const delegatedBalanceBefore = await powerIpor.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );
        const globalIndicatorsDaiBefore = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenDai.address
        );
        const accountIndicatorsDaiBefore = await liquidityMining.getAccountIndicators(
            await admin.getAddress(),
            tokens.lpTokenDai.address
        );
        const globalIndicatorsUsdcBefore = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenUsdc.address
        );
        const accountIndicatorsUsdcBefore = await liquidityMining.getAccountIndicators(
            await admin.getAddress(),
            tokens.lpTokenUsdc.address
        );
        //    when
        await powerIpor.delegateAndStakeToLiquidityMining(
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC],
            [N1__0_18DEC, N1__0_18DEC]
        );
        //    then
        const delegatedBalanceAfter = await powerIpor.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );
        const globalIndicatorsDaiAfter = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenDai.address
        );
        const accountIndicatorsDaiAfter = await liquidityMining.getAccountIndicators(
            await admin.getAddress(),
            tokens.lpTokenDai.address
        );
        const globalIndicatorsUsdcAfter = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenUsdc.address
        );
        const accountIndicatorsUsdcAfter = await liquidityMining.getAccountIndicators(
            await admin.getAddress(),
            tokens.lpTokenUsdc.address
        );

        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(N2__0_18DEC);

        expectGlobalIndicators(
            extractGlobalIndicators(globalIndicatorsDaiBefore),
            ZERO,
            ZERO,
            ZERO,
            ZERO,
            -1,
            100000000
        );
        expectGlobalIndicators(
            extractGlobalIndicators(globalIndicatorsDaiAfter),
            BigNumber.from("1984962500721156181"),
            ZERO,
            BigNumber.from("503787854751256144452805236"),
            ZERO,
            -1,
            100000000
        );

        expectGlobalIndicators(
            extractGlobalIndicators(globalIndicatorsUsdcBefore),
            ZERO,
            ZERO,
            ZERO,
            ZERO,
            -1,
            100000000
        );
        expectGlobalIndicators(
            extractGlobalIndicators(globalIndicatorsUsdcAfter),
            BigNumber.from("1984962500721156181"),
            ZERO,
            BigNumber.from("503787854751256144452805236"),
            ZERO,
            -1,
            100000000
        );
        expectAccountIndicators(
            extractAccountIndicators(accountIndicatorsDaiBefore),
            ZERO,
            ZERO,
            ZERO,
            ZERO
        );
        expectAccountIndicators(
            extractAccountIndicators(accountIndicatorsDaiAfter),
            BigNumber.from("1984962500721156181"),
            ZERO,
            N1__0_18DEC,
            N1__0_18DEC
        );
        expectAccountIndicators(
            extractAccountIndicators(accountIndicatorsUsdcBefore),
            ZERO,
            ZERO,
            ZERO,
            ZERO
        );
        expectAccountIndicators(
            extractAccountIndicators(accountIndicatorsUsdcAfter),
            BigNumber.from("1984962500721156181"),
            ZERO,
            N1__0_18DEC,
            N1__0_18DEC
        );
    });

    it("Should be able to stake and delegate two asset and has the same values when one lpTokens is pass twice and the second once", async () => {
        //    given
        const [admin] = accounts;
        await powerIpor.stake(N1__0_18DEC.mul(BigNumber.from("10")));
        await tokens.lpTokenDai.approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.lpTokenUsdc.approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);

        const delegatedBalanceBefore = await powerIpor.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );
        const globalIndicatorsDaiBefore = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenDai.address
        );
        const accountIndicatorsDaiBefore = await liquidityMining.getAccountIndicators(
            await admin.getAddress(),
            tokens.lpTokenDai.address
        );
        const globalIndicatorsUsdcBefore = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenUsdc.address
        );
        const accountIndicatorsUsdcBefore = await liquidityMining.getAccountIndicators(
            await admin.getAddress(),
            tokens.lpTokenUsdc.address
        );
        //    when
        await powerIpor.delegateAndStakeToLiquidityMining(
            [tokens.lpTokenDai.address, tokens.lpTokenDai.address, tokens.lpTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC, N2__0_18DEC],
            [N1__0_18DEC, N1__0_18DEC, N2__0_18DEC]
        );
        //    then
        const delegatedBalanceAfter = await powerIpor.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );
        const globalIndicatorsDaiAfter = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenDai.address
        );
        const accountIndicatorsDaiAfter = await liquidityMining.getAccountIndicators(
            await admin.getAddress(),
            tokens.lpTokenDai.address
        );
        const globalIndicatorsUsdcAfter = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenUsdc.address
        );
        const accountIndicatorsUsdcAfter = await liquidityMining.getAccountIndicators(
            await admin.getAddress(),
            tokens.lpTokenUsdc.address
        );

        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(N1__0_18DEC.mul(BigNumber.from("4")));

        expect(extractGlobalIndicators(globalIndicatorsDaiBefore).aggregatedPowerUp).to.be.equal(
            extractGlobalIndicators(globalIndicatorsUsdcBefore).aggregatedPowerUp
        );
        expect(extractGlobalIndicators(globalIndicatorsDaiBefore).accruedRewards).to.be.equal(
            extractGlobalIndicators(globalIndicatorsUsdcBefore).accruedRewards
        );
        expect(
            extractGlobalIndicators(globalIndicatorsDaiBefore)
                .compositeMultiplierCumulativePrevBlock
        ).to.be.equal(
            extractGlobalIndicators(globalIndicatorsUsdcBefore)
                .compositeMultiplierCumulativePrevBlock
        );
        expect(
            extractGlobalIndicators(globalIndicatorsDaiBefore).compositeMultiplierInTheBlock
        ).to.be.equal(
            extractGlobalIndicators(globalIndicatorsUsdcBefore).compositeMultiplierInTheBlock
        );

        expect(extractGlobalIndicators(globalIndicatorsDaiAfter).aggregatedPowerUp).to.be.equal(
            extractGlobalIndicators(globalIndicatorsUsdcAfter).aggregatedPowerUp
        );
        expect(extractGlobalIndicators(globalIndicatorsDaiAfter).accruedRewards).to.be.equal(
            extractGlobalIndicators(globalIndicatorsUsdcAfter).accruedRewards
        );
        expect(
            extractGlobalIndicators(globalIndicatorsDaiAfter).compositeMultiplierCumulativePrevBlock
        ).to.be.equal(
            extractGlobalIndicators(globalIndicatorsUsdcAfter)
                .compositeMultiplierCumulativePrevBlock
        );
        expect(
            extractGlobalIndicators(globalIndicatorsDaiAfter).compositeMultiplierInTheBlock
        ).to.be.equal(
            extractGlobalIndicators(globalIndicatorsUsdcAfter).compositeMultiplierInTheBlock
        );

        expect(extractAccountIndicators(accountIndicatorsDaiBefore).powerUp).to.be.equal(
            extractAccountIndicators(accountIndicatorsUsdcBefore).powerUp
        );
        expect(
            extractAccountIndicators(accountIndicatorsDaiBefore)
                .compositeMultiplierCumulativePrevBlock
        ).to.be.equal(
            extractAccountIndicators(accountIndicatorsUsdcBefore)
                .compositeMultiplierCumulativePrevBlock
        );
        expect(
            extractAccountIndicators(accountIndicatorsDaiBefore).delegatedPowerTokenBalance
        ).to.be.equal(
            extractAccountIndicators(accountIndicatorsUsdcBefore).delegatedPowerTokenBalance
        );
        expect(extractAccountIndicators(accountIndicatorsDaiBefore).lpTokenBalance).to.be.equal(
            extractAccountIndicators(accountIndicatorsUsdcBefore).lpTokenBalance
        );

        expect(extractAccountIndicators(accountIndicatorsDaiAfter).powerUp).to.be.equal(
            extractAccountIndicators(accountIndicatorsUsdcAfter).powerUp
        );
        expect(
            extractAccountIndicators(accountIndicatorsDaiAfter)
                .compositeMultiplierCumulativePrevBlock
        ).to.be.equal(
            extractAccountIndicators(accountIndicatorsUsdcAfter)
                .compositeMultiplierCumulativePrevBlock
        );
        expect(
            extractAccountIndicators(accountIndicatorsDaiAfter).delegatedPowerTokenBalance
        ).to.be.equal(
            extractAccountIndicators(accountIndicatorsUsdcAfter).delegatedPowerTokenBalance
        );
        expect(extractAccountIndicators(accountIndicatorsDaiAfter).lpTokenBalance).to.be.equal(
            extractAccountIndicators(accountIndicatorsUsdcAfter).lpTokenBalance
        );
    });
});
