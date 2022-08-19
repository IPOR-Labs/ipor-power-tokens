import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { IporToken, PwIporToken, LiquidityRewards } from "../../types";
import { N1__0_18DEC, ZERO, TOTAL_SUPPLY_18_DECIMALS, N0__1_18DEC } from "../utils/Constants";
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
        ])) as LiquidityRewards;

        await pwIporToken.setLiquidityRewardsAddress(liquidityRewards.address);
    });

    it("Should revert transaction when mismatch arrays", async () => {
        //    given
        await pwIporToken.stake(N1__0_18DEC);
        const [admin, userOne] = accounts;
        //    when
        await expect(
            pwIporToken.delegateToRewards([await userOne.getAddress()], [N0__1_18DEC, N1__0_18DEC])
        ).to.be.revertedWith("IPOR_005");
    });

    it("Should revert transaction when insufficient number of tokens to stake", async () => {
        //    given
        await pwIporToken.stake(N0__1_18DEC);
        const [admin, userOne] = accounts;
        //    when
        await expect(
            pwIporToken.delegateToRewards([await admin.getAddress()], [N1__0_18DEC])
        ).to.be.revertedWith("IPOR_700");
    });

    it("Should revert transaction when insufficient number of tokens to stake, two assets ", async () => {
        //    given
        await pwIporToken.stake(N1__0_18DEC);
        const [admin, userOne] = accounts;
        //    when
        await expect(
            pwIporToken.delegateToRewards(
                [tokens.tokenDai.address, tokens.tokenUsdc.address],
                [N1__0_18DEC, N0__1_18DEC]
            )
        ).to.be.revertedWith("IPOR_700");
    });

    it("Should be able to stake into one asset when pass one asset", async () => {
        //    given
        const [admin] = accounts;
        await pwIporToken.stake(N1__0_18DEC);
        const delegatedBalanceBefore = await pwIporToken.delegatedBalanceOf(
            await admin.getAddress()
        );
        //    when
        await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [N0__1_18DEC]);
        //    then
        const delegatedBalanceAfter = await pwIporToken.delegatedBalanceOf(
            await admin.getAddress()
        );
        const balance = await liquidityRewards.balanceOfDelegatedPwIpor(await admin.getAddress(), [
            tokens.ipTokenDai.address,
        ]);

        console.log(balance[0][0]["amount"]);
        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(N0__1_18DEC);
    });

    it("Should be able to stake into two asset when pass two asset", async () => {
        //    given
        const [admin] = accounts;
        await pwIporToken.stake(N1__0_18DEC);
        const delegatedBalanceBefore = await pwIporToken.delegatedBalanceOf(
            await admin.getAddress()
        );
        //    when
        await pwIporToken.delegateToRewards(
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address],
            [N0__1_18DEC, N0__1_18DEC]
        );
        //    then
        const delegatedBalanceAfter = await pwIporToken.delegatedBalanceOf(
            await admin.getAddress()
        );

        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(N0__1_18DEC.add(N0__1_18DEC));
    });
});