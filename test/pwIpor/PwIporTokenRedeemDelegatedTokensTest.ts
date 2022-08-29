import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { IporToken, PwIporToken, LiquidityRewards } from "../../types";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    N0__1_18DEC,
    N0__5_18DEC,
    N2__0_18DEC,
} from "../utils/Constants";
import { it } from "mocha";
import { getDeployedTokens, Tokens } from "../utils/LiquidityRewardsUtils";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PwIporToken configuration, deploy tests", () => {
    let accounts: Signer[];
    let iporToken: IporToken;
    let pwIporToken: PwIporToken;
    let tokens: Tokens;
    let liquidityRewards: LiquidityRewards;

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
        const PwIporToken = await ethers.getContractFactory("PwIporToken");
        pwIporToken = (await upgrades.deployProxy(PwIporToken, [iporToken.address])) as PwIporToken;
        await iporToken.increaseAllowance(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            pwIporToken.address,
            iporToken.address,
        ])) as LiquidityRewards;

        await pwIporToken.setLiquidityRewardsAddress(liquidityRewards.address);
    });

    it("Should revert transaction when withdraw zero", async () => {
        //    given
        await pwIporToken.stake(N1__0_18DEC);
        //    when
        await expect(
            pwIporToken.withdrawFromDelegation(tokens.ipTokenDai.address, ZERO)
        ).to.be.revertedWith("IPOR_004");
    });

    it("Should revert transaction when no delegate tokens", async () => {
        //    given
        await pwIporToken.stake(N1__0_18DEC);
        //    when
        await expect(
            pwIporToken.withdrawFromDelegation(tokens.ipTokenDai.address, N0__1_18DEC)
        ).to.be.revertedWith("IPOR_710");
    });

    it("Should revert transaction when delegate amount is less then withdraw amont", async () => {
        //    given
        await pwIporToken.stake(N1__0_18DEC);
        await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [N0__1_18DEC]);
        //    when
        await expect(
            pwIporToken.withdrawFromDelegation(tokens.ipTokenDai.address, N0__5_18DEC)
        ).to.be.revertedWith("IPOR_710");
    });

    it("Should withdraw tokens when delegate more tokens", async () => {
        //    given
        const [admin] = accounts;
        await pwIporToken.stake(N2__0_18DEC);
        await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [N1__0_18DEC]);
        const delegatedBalanceBefore = await pwIporToken.delegatedBalanceOf(
            await admin.getAddress()
        );
        const exchangeRateBefore = await pwIporToken.exchangeRate();
        const pwTokenBalanceBefore = await pwIporToken.balanceOf(await admin.getAddress());
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when
        await pwIporToken.withdrawFromDelegation(tokens.ipTokenDai.address, N1__0_18DEC);

        //    then

        const delegatedBalanceAfter = await pwIporToken.delegatedBalanceOf(
            await admin.getAddress()
        );
        const exchangeRateAfter = await pwIporToken.exchangeRate();
        const pwTokenBalanceAfter = await pwIporToken.balanceOf(await admin.getAddress());

        expect(delegatedBalanceBefore).to.be.equal(N1__0_18DEC);
        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(pwTokenBalanceBefore).to.be.equal(N2__0_18DEC);

        expect(delegatedBalanceAfter).to.be.equal(ZERO);
        expect(exchangeRateAfter).to.be.equal(N1__0_18DEC);
        expect(pwTokenBalanceAfter).to.be.equal(N2__0_18DEC);
    });
});
