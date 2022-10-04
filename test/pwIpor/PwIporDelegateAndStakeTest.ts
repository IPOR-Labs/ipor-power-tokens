import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { IporToken, PowerIpor, John } from "../../types";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    N0__1_18DEC,
    N2__0_18DEC,
} from "../utils/Constants";
import { it } from "mocha";
import {
    expectGlobalIndicators,
    expectAccountIndicators,
    extractGlobalIndicators,
    extractAccountIndicators,
    getDeployedTokens,
    Tokens,
} from "../utils/JohnUtils";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PowerIpor delegateAndStakeToJohn", () => {
    let accounts: Signer[];
    let iporToken: IporToken;
    let powerIpor: PowerIpor;
    let tokens: Tokens;
    let john: John;

    before(async () => {
        accounts = await ethers.getSigners();
        tokens = await getDeployedTokens(accounts);
    });

    beforeEach(async () => {
        const IporToken = await ethers.getContractFactory("IporToken");
        iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await accounts[0].getAddress()
        )) as IporToken;
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;
        await iporToken.increaseAllowance(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        const John = await hre.ethers.getContractFactory("John");
        john = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as John;

        await powerIpor.setJohn(john.address);
    });

    it("Should revert transaction when mismatch arrays - case 1", async () => {
        //    given
        await powerIpor.stake(N1__0_18DEC);
        const [userOne] = accounts;
        //    when
        await expect(
            powerIpor.delegateAndStakeToJohn(
                [await userOne.getAddress()],
                [N0__1_18DEC, N1__0_18DEC],
                [N0__1_18DEC, N1__0_18DEC]
            )
        ).to.be.revertedWith("IPOR_005");
    });

    it("Should revert transaction when mismatch arrays - case 2", async () => {
        //    given
        await powerIpor.stake(N1__0_18DEC);
        const [userOne] = accounts;
        //    when
        await expect(
            powerIpor.delegateAndStakeToJohn(
                [await userOne.getAddress(), await userOne.getAddress()],
                [N0__1_18DEC],
                [N0__1_18DEC, N1__0_18DEC]
            )
        ).to.be.revertedWith("IPOR_005");
    });

    it("Should revert transaction when mismatch arrays - case 3", async () => {
        //    given
        await powerIpor.stake(N1__0_18DEC);
        const [userOne] = accounts;
        //    when
        await expect(
            powerIpor.delegateAndStakeToJohn(
                [await userOne.getAddress(), await userOne.getAddress()],
                [N0__1_18DEC, N1__0_18DEC],
                [N0__1_18DEC]
            )
        ).to.be.revertedWith("IPOR_005");
    });

    it("Should revert transaction when insufficient number of tokens to stake", async () => {
        //    given
        await powerIpor.stake(N0__1_18DEC);
        const [admin, userOne] = accounts;
        //    when
        await expect(
            powerIpor.delegateAndStakeToJohn(
                [await admin.getAddress()],
                [N1__0_18DEC],
                [N1__0_18DEC]
            )
        ).to.be.revertedWith("IPOR_705");
    });

    it("Should revert transaction when insufficient number of tokens to stake, two assets", async () => {
        //    given
        await powerIpor.stake(N1__0_18DEC);
        //    when
        await expect(
            powerIpor.delegateAndStakeToJohn(
                [tokens.tokenDai.address, tokens.tokenUsdc.address],
                [N1__0_18DEC, N0__1_18DEC],
                [N1__0_18DEC, N0__1_18DEC]
            )
        ).to.be.revertedWith("IPOR_705");
    });

    it("Should be able to delegate into one asset and no stake ipToken when pass one asset", async () => {
        //    given

        const johnIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(john.address);
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

        const [admin] = accounts;
        await powerIpor.stake(N1__0_18DEC);
        const delegatedBalanceBefore = await powerIpor.delegatedToJohnBalanceOf(
            await admin.getAddress()
        );

        //    when
        await powerIpor.delegateAndStakeToJohn([tokens.ipTokenDai.address], [N0__1_18DEC], [ZERO]);

        //    then

        const johnIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(john.address);
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const delegatedBalanceAfter = await powerIpor.delegatedToJohnBalanceOf(
            await admin.getAddress()
        );
        const ipTokenBalanceAfter = await john.balanceOf(
            await admin.getAddress(),
            tokens.ipTokenDai.address
        );

        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(N0__1_18DEC);
        expect(ipTokenBalanceAfter).to.be.equal(ZERO);
        expect(johnIpDaiBalanceAfter).to.be.equal(johnIpDaiBalanceBefore);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(N1__0_18DEC)
        );
    });

    it("Should be able to delegate into one asset and stake ipToken when pass one asset", async () => {
        //    given

        const johnIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(john.address);
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const [admin] = accounts;
        await powerIpor.stake(N1__0_18DEC);
        const delegatedBalanceBefore = await powerIpor.delegatedToJohnBalanceOf(
            await admin.getAddress()
        );
        await tokens.ipTokenDai.approve(john.address, TOTAL_SUPPLY_18_DECIMALS);
        const globalIndicatorsBefore = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const accountIndicatorsBefore = await john.getAccountIndicators(
            await admin.getAddress(),
            tokens.ipTokenDai.address
        );

        //    when
        await powerIpor.delegateAndStakeToJohn(
            [tokens.ipTokenDai.address],
            [N1__0_18DEC],
            [N1__0_18DEC]
        );

        //    then

        const johnIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(john.address);
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const delegatedBalanceAfter = await powerIpor.delegatedToJohnBalanceOf(
            await admin.getAddress()
        );
        const ipTokenBalanceAfter = await john.balanceOf(
            await admin.getAddress(),
            tokens.ipTokenDai.address
        );
        const globalIndicatorsAfter = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const accountIndicatorsAfter = await john.getAccountIndicators(
            await admin.getAddress(),
            tokens.ipTokenDai.address
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
            BigNumber.from("1400000000000000000"),
            ZERO,
            BigNumber.from("714285714285714285714285714"),
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
            BigNumber.from("1400000000000000000"),
            ZERO,
            N1__0_18DEC,
            N1__0_18DEC
        );
        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(N1__0_18DEC);
        expect(ipTokenBalanceAfter).to.be.equal(N1__0_18DEC);
        expect(johnIpDaiBalanceAfter).to.be.equal(johnIpDaiBalanceBefore.add(N1__0_18DEC));
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(N1__0_18DEC)
        );
    });

    it("Should be able to stake and delegate two asset when pass two asset", async () => {
        //    given
        const [admin] = accounts;
        await powerIpor.stake(N2__0_18DEC);
        await tokens.ipTokenDai.approve(john.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenUsdc.approve(john.address, TOTAL_SUPPLY_18_DECIMALS);

        const delegatedBalanceBefore = await powerIpor.delegatedToJohnBalanceOf(
            await admin.getAddress()
        );
        const globalIndicatorsDaiBefore = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const accountIndicatorsDaiBefore = await john.getAccountIndicators(
            await admin.getAddress(),
            tokens.ipTokenDai.address
        );
        const globalIndicatorsUsdcBefore = await john.getGlobalIndicators(
            tokens.ipTokenUsdc.address
        );
        const accountIndicatorsUsdcBefore = await john.getAccountIndicators(
            await admin.getAddress(),
            tokens.ipTokenUsdc.address
        );
        //    when
        await powerIpor.delegateAndStakeToJohn(
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC],
            [N1__0_18DEC, N1__0_18DEC]
        );
        //    then
        const delegatedBalanceAfter = await powerIpor.delegatedToJohnBalanceOf(
            await admin.getAddress()
        );
        const globalIndicatorsDaiAfter = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const accountIndicatorsDaiAfter = await john.getAccountIndicators(
            await admin.getAddress(),
            tokens.ipTokenDai.address
        );
        const globalIndicatorsUsdcAfter = await john.getGlobalIndicators(
            tokens.ipTokenUsdc.address
        );
        const accountIndicatorsUsdcAfter = await john.getAccountIndicators(
            await admin.getAddress(),
            tokens.ipTokenUsdc.address
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
            BigNumber.from("1400000000000000000"),
            ZERO,
            BigNumber.from("714285714285714285714285714"),
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
            BigNumber.from("1400000000000000000"),
            ZERO,
            BigNumber.from("714285714285714285714285714"),
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
            BigNumber.from("1400000000000000000"),
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
            BigNumber.from("1400000000000000000"),
            ZERO,
            N1__0_18DEC,
            N1__0_18DEC
        );
    });

    it("Should be able to stake and delegate two asset and has the same values when one ipTokens is pass twice and the second once", async () => {
        //    given
        const [admin] = accounts;
        await powerIpor.stake(N1__0_18DEC.mul(BigNumber.from("10")));
        await tokens.ipTokenDai.approve(john.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenUsdc.approve(john.address, TOTAL_SUPPLY_18_DECIMALS);

        const delegatedBalanceBefore = await powerIpor.delegatedToJohnBalanceOf(
            await admin.getAddress()
        );
        const globalIndicatorsDaiBefore = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const accountIndicatorsDaiBefore = await john.getAccountIndicators(
            await admin.getAddress(),
            tokens.ipTokenDai.address
        );
        const globalIndicatorsUsdcBefore = await john.getGlobalIndicators(
            tokens.ipTokenUsdc.address
        );
        const accountIndicatorsUsdcBefore = await john.getAccountIndicators(
            await admin.getAddress(),
            tokens.ipTokenUsdc.address
        );
        //    when
        await powerIpor.delegateAndStakeToJohn(
            [tokens.ipTokenDai.address, tokens.ipTokenDai.address, tokens.ipTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC, N2__0_18DEC],
            [N1__0_18DEC, N1__0_18DEC, N2__0_18DEC]
        );
        //    then
        const delegatedBalanceAfter = await powerIpor.delegatedToJohnBalanceOf(
            await admin.getAddress()
        );
        const globalIndicatorsDaiAfter = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const accountIndicatorsDaiAfter = await john.getAccountIndicators(
            await admin.getAddress(),
            tokens.ipTokenDai.address
        );
        const globalIndicatorsUsdcAfter = await john.getGlobalIndicators(
            tokens.ipTokenUsdc.address
        );
        const accountIndicatorsUsdcAfter = await john.getAccountIndicators(
            await admin.getAddress(),
            tokens.ipTokenUsdc.address
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
            extractAccountIndicators(accountIndicatorsDaiBefore).compositeMultiplierCumulative
        ).to.be.equal(
            extractAccountIndicators(accountIndicatorsUsdcBefore).compositeMultiplierCumulative
        );
        expect(
            extractAccountIndicators(accountIndicatorsDaiBefore).delegatedPowerTokenBalance
        ).to.be.equal(
            extractAccountIndicators(accountIndicatorsUsdcBefore).delegatedPowerTokenBalance
        );
        expect(extractAccountIndicators(accountIndicatorsDaiBefore).ipTokenBalance).to.be.equal(
            extractAccountIndicators(accountIndicatorsUsdcBefore).ipTokenBalance
        );

        expect(extractAccountIndicators(accountIndicatorsDaiAfter).powerUp).to.be.equal(
            extractAccountIndicators(accountIndicatorsUsdcAfter).powerUp
        );
        expect(
            extractAccountIndicators(accountIndicatorsDaiAfter).compositeMultiplierCumulative
        ).to.be.equal(
            extractAccountIndicators(accountIndicatorsUsdcAfter).compositeMultiplierCumulative
        );
        expect(
            extractAccountIndicators(accountIndicatorsDaiAfter).delegatedPowerTokenBalance
        ).to.be.equal(
            extractAccountIndicators(accountIndicatorsUsdcAfter).delegatedPowerTokenBalance
        );
        expect(extractAccountIndicators(accountIndicatorsDaiAfter).ipTokenBalance).to.be.equal(
            extractAccountIndicators(accountIndicatorsUsdcAfter).ipTokenBalance
        );
    });
});
