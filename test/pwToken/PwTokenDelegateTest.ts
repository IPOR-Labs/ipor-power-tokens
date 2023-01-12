import hre, { upgrades } from "hardhat";
import chai from "chai";

import { Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockStakedToken, PowerToken, LiquidityMining } from "../../types";
import { N1__0_18DEC, ZERO, TOTAL_SUPPLY_18_DECIMALS, N0__1_18DEC } from "../utils/Constants";
import { it } from "mocha";
import { getDeployedTokens, Tokens } from "../utils/LiquidityMiningUtils";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PowerToken token delegate", () => {
    let accounts: Signer[];
    let stakedToken: MockStakedToken;
    let powerToken: PowerToken;
    let tokens: Tokens;
    let liquidityMining: LiquidityMining;

    before(async () => {
        accounts = await ethers.getSigners();
        tokens = await getDeployedTokens(accounts);
    });

    beforeEach(async () => {
        const StakedToken = await ethers.getContractFactory("MockStakedToken");
        stakedToken = (await StakedToken.deploy(
            "IPOR Token",
            "IPOR",
            await accounts[0].getAddress()
        )) as MockStakedToken;
        const PowerToken = await ethers.getContractFactory("PowerToken");
        powerToken = (await upgrades.deployProxy(PowerToken, [stakedToken.address])) as PowerToken;
        await stakedToken.increaseAllowance(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        await powerToken.setLiquidityMining(liquidityMining.address);
    });

    it("Should revert transaction when mismatch arrays", async () => {
        //    given
        await powerToken.stake(N1__0_18DEC);
        const [admin, userOne] = accounts;
        //    when
        await expect(
            powerToken.delegateToLiquidityMining(
                [await userOne.getAddress()],
                [N0__1_18DEC, N1__0_18DEC]
            )
        ).to.be.revertedWith("PT_718");
    });

    it("Should revert transaction when insufficient number of tokens to stake", async () => {
        //    given
        await powerToken.stake(N0__1_18DEC);
        const [admin, userOne] = accounts;
        //    when
        await expect(
            powerToken.delegateToLiquidityMining([await admin.getAddress()], [N1__0_18DEC])
        ).to.be.revertedWith("PT_708");
    });

    it("Should revert transaction when insufficient number of tokens to stake, two assets", async () => {
        //    given
        await powerToken.stake(N1__0_18DEC);
        const [admin, userOne] = accounts;
        //    when
        await expect(
            powerToken.delegateToLiquidityMining(
                [tokens.tokenDai.address, tokens.tokenUsdc.address],
                [N1__0_18DEC, N0__1_18DEC]
            )
        ).to.be.revertedWith("PT_708");
    });

    it("Should be able to stake into one asset when pass one asset", async () => {
        //    given
        const [admin] = accounts;
        const pwTokenDelegationAmount = N0__1_18DEC;
        const stakedTokenStakeAmount = N1__0_18DEC;
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        await powerToken.stake(N1__0_18DEC);
        const delegatedBalanceBefore = await powerToken.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );

        //    when
        await powerToken.delegateToLiquidityMining(
            [tokens.lpTokenDai.address],
            [pwTokenDelegationAmount]
        );

        //    then
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const delegatedBalanceAfter = await powerToken.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );

        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(pwTokenDelegationAmount);
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(stakedTokenStakeAmount)
        );
    });

    it("Should be able to stake into two asset when pass two asset", async () => {
        //    given
        const [admin] = accounts;
        const stakedTokenStakeAmount = N1__0_18DEC;
        const pwTokenDelegationAmount = N0__1_18DEC;
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        await powerToken.stake(N1__0_18DEC);
        const delegatedBalanceBefore = await powerToken.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );
        //    when
        await powerToken.delegateToLiquidityMining(
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address],
            [pwTokenDelegationAmount, pwTokenDelegationAmount]
        );
        //    then
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const delegatedBalanceAfter = await powerToken.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );

        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(
            pwTokenDelegationAmount.add(pwTokenDelegationAmount)
        );
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(stakedTokenStakeAmount)
        );
    });
});
