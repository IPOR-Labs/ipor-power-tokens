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
    expectGlobalParam,
    expectUserParam,
    extractGlobalParam,
    extractAccountParam,
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
        const [admin] = accounts;
        await powerIpor.stake(N1__0_18DEC);
        const delegatedBalanceBefore = await powerIpor.delegatedBalanceOf(await admin.getAddress());

        //    when
        await powerIpor.delegateAndStakeToJohn([tokens.ipTokenDai.address], [N0__1_18DEC], [ZERO]);

        //    then
        const delegatedBalanceAfter = await powerIpor.delegatedBalanceOf(await admin.getAddress());
        const ipTokenBalanceAfter = await john.balanceOf(
            await admin.getAddress(),
            tokens.ipTokenDai.address
        );

        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(N0__1_18DEC);
        expect(ipTokenBalanceAfter).to.be.equal(ZERO);
    });

    it("Should be able to delegate into one asset and stake ipToken when pass one asset", async () => {
        //    given
        const [admin] = accounts;
        await powerIpor.stake(N1__0_18DEC);
        const delegatedBalanceBefore = await powerIpor.delegatedBalanceOf(await admin.getAddress());
        await tokens.ipTokenDai.approve(john.address, TOTAL_SUPPLY_18_DECIMALS);
        const globalIndicatorsBefore = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const accountIndicatorsBefore = await john.getAccountIndicators(tokens.ipTokenDai.address);

        //    when
        await powerIpor.delegateAndStakeToJohn(
            [tokens.ipTokenDai.address],
            [N1__0_18DEC],
            [N1__0_18DEC]
        );

        //    then
        const delegatedBalanceAfter = await powerIpor.delegatedBalanceOf(await admin.getAddress());
        const ipTokenBalanceAfter = await john.balanceOf(
            await admin.getAddress(),
            tokens.ipTokenDai.address
        );
        const globalIndicatorsAfter = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const accountIndicatorsAfter = await john.getAccountIndicators(tokens.ipTokenDai.address);

        expectGlobalParam(
            extractGlobalParam(globalIndicatorsBefore),
            ZERO,
            ZERO,
            ZERO,
            ZERO,
            -1,
            100000000
        );
        expectGlobalParam(
            extractGlobalParam(globalIndicatorsAfter),
            BigNumber.from("1400000000000000000"),
            ZERO,
            BigNumber.from("714285714285714285714285714"),
            ZERO,
            -1,
            100000000
        );

        expectUserParam(extractAccountParam(accountIndicatorsBefore), ZERO, ZERO, ZERO, ZERO);
        expectUserParam(
            extractAccountParam(accountIndicatorsAfter),
            BigNumber.from("1400000000000000000"),
            ZERO,
            N1__0_18DEC,
            N1__0_18DEC
        );
        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(N1__0_18DEC);
        expect(ipTokenBalanceAfter).to.be.equal(N1__0_18DEC);
    });

    it("Should be able to stake and delegate two asset when pass two asset", async () => {
        //    given
        const [admin] = accounts;
        await powerIpor.stake(N2__0_18DEC);
        await tokens.ipTokenDai.approve(john.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenUsdc.approve(john.address, TOTAL_SUPPLY_18_DECIMALS);

        const delegatedBalanceBefore = await powerIpor.delegatedBalanceOf(await admin.getAddress());
        const globalIndicatorsDaiBefore = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const accountIndicatorsDaiBefore = await john.getAccountIndicators(
            tokens.ipTokenDai.address
        );
        const globalIndicatorsUsdcBefore = await john.getGlobalIndicators(
            tokens.ipTokenUsdc.address
        );
        const accountIndicatorsUsdcBefore = await john.getAccountIndicators(
            tokens.ipTokenUsdc.address
        );
        //    when
        await powerIpor.delegateAndStakeToJohn(
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC],
            [N1__0_18DEC, N1__0_18DEC]
        );
        //    then
        const delegatedBalanceAfter = await powerIpor.delegatedBalanceOf(await admin.getAddress());
        const globalIndicatorsDaiAfter = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const accountIndicatorsDaiAfter = await john.getAccountIndicators(
            tokens.ipTokenDai.address
        );
        const globalIndicatorsUsdcAfter = await john.getGlobalIndicators(
            tokens.ipTokenUsdc.address
        );
        const accountIndicatorsUsdcAfter = await john.getAccountIndicators(
            tokens.ipTokenUsdc.address
        );

        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(N2__0_18DEC);

        expectGlobalParam(
            extractGlobalParam(globalIndicatorsDaiBefore),
            ZERO,
            ZERO,
            ZERO,
            ZERO,
            -1,
            100000000
        );
        expectGlobalParam(
            extractGlobalParam(globalIndicatorsDaiAfter),
            BigNumber.from("1400000000000000000"),
            ZERO,
            BigNumber.from("714285714285714285714285714"),
            ZERO,
            -1,
            100000000
        );

        expectGlobalParam(
            extractGlobalParam(globalIndicatorsUsdcBefore),
            ZERO,
            ZERO,
            ZERO,
            ZERO,
            -1,
            100000000
        );
        expectGlobalParam(
            extractGlobalParam(globalIndicatorsUsdcAfter),
            BigNumber.from("1400000000000000000"),
            ZERO,
            BigNumber.from("714285714285714285714285714"),
            ZERO,
            -1,
            100000000
        );
        expectUserParam(extractAccountParam(accountIndicatorsDaiBefore), ZERO, ZERO, ZERO, ZERO);
        expectUserParam(
            extractAccountParam(accountIndicatorsDaiAfter),
            BigNumber.from("1400000000000000000"),
            ZERO,
            N1__0_18DEC,
            N1__0_18DEC
        );
        expectUserParam(extractAccountParam(accountIndicatorsUsdcBefore), ZERO, ZERO, ZERO, ZERO);
        expectUserParam(
            extractAccountParam(accountIndicatorsUsdcAfter),
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

        const delegatedBalanceBefore = await powerIpor.delegatedBalanceOf(await admin.getAddress());
        const globalIndicatorsDaiBefore = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const accountIndicatorsDaiBefore = await john.getAccountIndicators(
            tokens.ipTokenDai.address
        );
        const globalIndicatorsUsdcBefore = await john.getGlobalIndicators(
            tokens.ipTokenUsdc.address
        );
        const accountIndicatorsUsdcBefore = await john.getAccountIndicators(
            tokens.ipTokenUsdc.address
        );
        //    when
        await powerIpor.delegateAndStakeToJohn(
            [tokens.ipTokenDai.address, tokens.ipTokenDai.address, tokens.ipTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC, N2__0_18DEC],
            [N1__0_18DEC, N1__0_18DEC, N2__0_18DEC]
        );
        //    then
        const delegatedBalanceAfter = await powerIpor.delegatedBalanceOf(await admin.getAddress());
        const globalIndicatorsDaiAfter = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const accountIndicatorsDaiAfter = await john.getAccountIndicators(
            tokens.ipTokenDai.address
        );
        const globalIndicatorsUsdcAfter = await john.getGlobalIndicators(
            tokens.ipTokenUsdc.address
        );
        const accountIndicatorsUsdcAfter = await john.getAccountIndicators(
            tokens.ipTokenUsdc.address
        );

        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(N1__0_18DEC.mul(BigNumber.from("4")));

        expect(extractGlobalParam(globalIndicatorsDaiBefore).aggregatedPowerUp).to.be.equal(
            extractGlobalParam(globalIndicatorsUsdcBefore).aggregatedPowerUp
        );
        expect(extractGlobalParam(globalIndicatorsDaiBefore).accruedRewards).to.be.equal(
            extractGlobalParam(globalIndicatorsUsdcBefore).accruedRewards
        );
        expect(
            extractGlobalParam(globalIndicatorsDaiBefore).compositeMultiplierCumulativePrevBlock
        ).to.be.equal(
            extractGlobalParam(globalIndicatorsUsdcBefore).compositeMultiplierCumulativePrevBlock
        );
        expect(
            extractGlobalParam(globalIndicatorsDaiBefore).compositeMultiplierInTheBlock
        ).to.be.equal(extractGlobalParam(globalIndicatorsUsdcBefore).compositeMultiplierInTheBlock);

        expect(extractGlobalParam(globalIndicatorsDaiAfter).aggregatedPowerUp).to.be.equal(
            extractGlobalParam(globalIndicatorsUsdcAfter).aggregatedPowerUp
        );
        expect(extractGlobalParam(globalIndicatorsDaiAfter).accruedRewards).to.be.equal(
            extractGlobalParam(globalIndicatorsUsdcAfter).accruedRewards
        );
        expect(
            extractGlobalParam(globalIndicatorsDaiAfter).compositeMultiplierCumulativePrevBlock
        ).to.be.equal(
            extractGlobalParam(globalIndicatorsUsdcAfter).compositeMultiplierCumulativePrevBlock
        );
        expect(
            extractGlobalParam(globalIndicatorsDaiAfter).compositeMultiplierInTheBlock
        ).to.be.equal(extractGlobalParam(globalIndicatorsUsdcAfter).compositeMultiplierInTheBlock);

        expect(extractAccountParam(accountIndicatorsDaiBefore).powerUp).to.be.equal(
            extractAccountParam(accountIndicatorsUsdcBefore).powerUp
        );
        expect(
            extractAccountParam(accountIndicatorsDaiBefore).compositeMultiplierCumulative
        ).to.be.equal(
            extractAccountParam(accountIndicatorsUsdcBefore).compositeMultiplierCumulative
        );
        expect(
            extractAccountParam(accountIndicatorsDaiBefore).delegatedPowerTokenBalance
        ).to.be.equal(extractAccountParam(accountIndicatorsUsdcBefore).delegatedPowerTokenBalance);
        expect(extractAccountParam(accountIndicatorsDaiBefore).ipTokenBalance).to.be.equal(
            extractAccountParam(accountIndicatorsUsdcBefore).ipTokenBalance
        );

        expect(extractAccountParam(accountIndicatorsDaiAfter).powerUp).to.be.equal(
            extractAccountParam(accountIndicatorsUsdcAfter).powerUp
        );
        expect(
            extractAccountParam(accountIndicatorsDaiAfter).compositeMultiplierCumulative
        ).to.be.equal(
            extractAccountParam(accountIndicatorsUsdcAfter).compositeMultiplierCumulative
        );
        expect(
            extractAccountParam(accountIndicatorsDaiAfter).delegatedPowerTokenBalance
        ).to.be.equal(extractAccountParam(accountIndicatorsUsdcAfter).delegatedPowerTokenBalance);
        expect(extractAccountParam(accountIndicatorsDaiAfter).ipTokenBalance).to.be.equal(
            extractAccountParam(accountIndicatorsUsdcAfter).ipTokenBalance
        );
    });
});
