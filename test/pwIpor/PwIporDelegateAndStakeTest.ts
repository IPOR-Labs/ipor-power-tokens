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
        const ipTokenBalanceAfter = await john.balanceOf(tokens.ipTokenDai.address);

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
        const globalParamsBefore = await john.getGlobalParams(tokens.ipTokenDai.address);
        const accountParamsBefore = await john.getAccountParams(tokens.ipTokenDai.address);

        //    when
        await powerIpor.delegateAndStakeToJohn(
            [tokens.ipTokenDai.address],
            [N1__0_18DEC],
            [N1__0_18DEC]
        );

        //    then
        const delegatedBalanceAfter = await powerIpor.delegatedBalanceOf(await admin.getAddress());
        const ipTokenBalanceAfter = await john.balanceOf(tokens.ipTokenDai.address);
        const globalParamsAfter = await john.getGlobalParams(tokens.ipTokenDai.address);
        const accountParamsAfter = await john.getAccountParams(tokens.ipTokenDai.address);

        expectGlobalParam(
            extractGlobalParam(globalParamsBefore),
            ZERO,
            ZERO,
            ZERO,
            ZERO,
            -1,
            100000000
        );
        expectGlobalParam(
            extractGlobalParam(globalParamsAfter),
            BigNumber.from("1400000000000000000"),
            ZERO,
            BigNumber.from("714285714285714285714285714"),
            ZERO,
            -1,
            100000000
        );

        expectUserParam(extractAccountParam(accountParamsBefore), ZERO, ZERO, ZERO, ZERO);
        expectUserParam(
            extractAccountParam(accountParamsAfter),
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
        const globalParamsDaiBefore = await john.getGlobalParams(tokens.ipTokenDai.address);
        const accountParamsDaiBefore = await john.getAccountParams(tokens.ipTokenDai.address);
        const globalParamsUsdcBefore = await john.getGlobalParams(tokens.ipTokenUsdc.address);
        const accountParamsUsdcBefore = await john.getAccountParams(tokens.ipTokenUsdc.address);
        //    when
        await powerIpor.delegateAndStakeToJohn(
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC],
            [N1__0_18DEC, N1__0_18DEC]
        );
        //    then
        const delegatedBalanceAfter = await powerIpor.delegatedBalanceOf(await admin.getAddress());
        const globalParamsDaiAfter = await john.getGlobalParams(tokens.ipTokenDai.address);
        const accountParamsDaiAfter = await john.getAccountParams(tokens.ipTokenDai.address);
        const globalParamsUsdcAfter = await john.getGlobalParams(tokens.ipTokenUsdc.address);
        const accountParamsUsdcAfter = await john.getAccountParams(tokens.ipTokenUsdc.address);

        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(N2__0_18DEC);

        expectGlobalParam(
            extractGlobalParam(globalParamsDaiBefore),
            ZERO,
            ZERO,
            ZERO,
            ZERO,
            -1,
            100000000
        );
        expectGlobalParam(
            extractGlobalParam(globalParamsDaiAfter),
            BigNumber.from("1400000000000000000"),
            ZERO,
            BigNumber.from("714285714285714285714285714"),
            ZERO,
            -1,
            100000000
        );

        expectGlobalParam(
            extractGlobalParam(globalParamsUsdcBefore),
            ZERO,
            ZERO,
            ZERO,
            ZERO,
            -1,
            100000000
        );
        expectGlobalParam(
            extractGlobalParam(globalParamsUsdcAfter),
            BigNumber.from("1400000000000000000"),
            ZERO,
            BigNumber.from("714285714285714285714285714"),
            ZERO,
            -1,
            100000000
        );
        expectUserParam(extractAccountParam(accountParamsDaiBefore), ZERO, ZERO, ZERO, ZERO);
        expectUserParam(
            extractAccountParam(accountParamsDaiAfter),
            BigNumber.from("1400000000000000000"),
            ZERO,
            N1__0_18DEC,
            N1__0_18DEC
        );
        expectUserParam(extractAccountParam(accountParamsUsdcBefore), ZERO, ZERO, ZERO, ZERO);
        expectUserParam(
            extractAccountParam(accountParamsUsdcAfter),
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
        const globalParamsDaiBefore = await john.getGlobalParams(tokens.ipTokenDai.address);
        const accountParamsDaiBefore = await john.getAccountParams(tokens.ipTokenDai.address);
        const globalParamsUsdcBefore = await john.getGlobalParams(tokens.ipTokenUsdc.address);
        const accountParamsUsdcBefore = await john.getAccountParams(tokens.ipTokenUsdc.address);
        //    when
        await powerIpor.delegateAndStakeToJohn(
            [tokens.ipTokenDai.address, tokens.ipTokenDai.address, tokens.ipTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC, N2__0_18DEC],
            [N1__0_18DEC, N1__0_18DEC, N2__0_18DEC]
        );
        //    then
        const delegatedBalanceAfter = await powerIpor.delegatedBalanceOf(await admin.getAddress());
        const globalParamsDaiAfter = await john.getGlobalParams(tokens.ipTokenDai.address);
        const accountParamsDaiAfter = await john.getAccountParams(tokens.ipTokenDai.address);
        const globalParamsUsdcAfter = await john.getGlobalParams(tokens.ipTokenUsdc.address);
        const accountParamsUsdcAfter = await john.getAccountParams(tokens.ipTokenUsdc.address);

        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(N1__0_18DEC.mul(BigNumber.from("4")));

        expect(extractGlobalParam(globalParamsDaiBefore).aggregatePowerUp).to.be.equal(
            extractGlobalParam(globalParamsUsdcBefore).aggregatePowerUp
        );
        expect(extractGlobalParam(globalParamsDaiBefore).accruedRewards).to.be.equal(
            extractGlobalParam(globalParamsUsdcBefore).accruedRewards
        );
        expect(
            extractGlobalParam(globalParamsDaiBefore).compositeMultiplierCumulativeBeforeBlock
        ).to.be.equal(
            extractGlobalParam(globalParamsUsdcBefore).compositeMultiplierCumulativeBeforeBlock
        );
        expect(extractGlobalParam(globalParamsDaiBefore).compositeMultiplierInTheBlock).to.be.equal(
            extractGlobalParam(globalParamsUsdcBefore).compositeMultiplierInTheBlock
        );

        expect(extractGlobalParam(globalParamsDaiAfter).aggregatePowerUp).to.be.equal(
            extractGlobalParam(globalParamsUsdcAfter).aggregatePowerUp
        );
        expect(extractGlobalParam(globalParamsDaiAfter).accruedRewards).to.be.equal(
            extractGlobalParam(globalParamsUsdcAfter).accruedRewards
        );
        expect(
            extractGlobalParam(globalParamsDaiAfter).compositeMultiplierCumulativeBeforeBlock
        ).to.be.equal(
            extractGlobalParam(globalParamsUsdcAfter).compositeMultiplierCumulativeBeforeBlock
        );
        expect(extractGlobalParam(globalParamsDaiAfter).compositeMultiplierInTheBlock).to.be.equal(
            extractGlobalParam(globalParamsUsdcAfter).compositeMultiplierInTheBlock
        );

        expect(extractAccountParam(accountParamsDaiBefore).powerUp).to.be.equal(
            extractAccountParam(accountParamsUsdcBefore).powerUp
        );
        expect(
            extractAccountParam(accountParamsDaiBefore).compositeMultiplierCumulative
        ).to.be.equal(extractAccountParam(accountParamsUsdcBefore).compositeMultiplierCumulative);
        expect(extractAccountParam(accountParamsDaiBefore).delegatedPowerTokenBalance).to.be.equal(
            extractAccountParam(accountParamsUsdcBefore).delegatedPowerTokenBalance
        );
        expect(extractAccountParam(accountParamsDaiBefore).ipTokenBalance).to.be.equal(
            extractAccountParam(accountParamsUsdcBefore).ipTokenBalance
        );

        expect(extractAccountParam(accountParamsDaiAfter).powerUp).to.be.equal(
            extractAccountParam(accountParamsUsdcAfter).powerUp
        );
        expect(
            extractAccountParam(accountParamsDaiAfter).compositeMultiplierCumulative
        ).to.be.equal(extractAccountParam(accountParamsUsdcAfter).compositeMultiplierCumulative);
        expect(extractAccountParam(accountParamsDaiAfter).delegatedPowerTokenBalance).to.be.equal(
            extractAccountParam(accountParamsUsdcAfter).delegatedPowerTokenBalance
        );
        expect(extractAccountParam(accountParamsDaiAfter).ipTokenBalance).to.be.equal(
            extractAccountParam(accountParamsUsdcAfter).ipTokenBalance
        );
    });
});
