import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockStakedToken, PowerToken, LiquidityMining } from "../../types";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    N0__1_18DEC,
    N0__5_18DEC,
    N2__0_18DEC,
} from "../utils/Constants";
import { it } from "mocha";
import { getDeployedTokens, Tokens } from "../utils/LiquidityMiningUtils";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PowerToken configuration, deploy tests", () => {
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

    it("Should revert transaction when withdraw zero", async () => {
        //    given
        await powerToken.stake(N1__0_18DEC);
        //    when
        await expect(
            powerToken.undelegateFromLiquidityMining([tokens.lpTokenDai.address], [ZERO])
        ).to.be.revertedWith("PT_717");
    });

    it("Should revert transaction when no delegate tokens", async () => {
        //    given
        await powerToken.stake(N1__0_18DEC);
        //    when
        await expect(
            powerToken.undelegateFromLiquidityMining([tokens.lpTokenDai.address], [N0__1_18DEC])
        ).to.be.revertedWith("PT_707");
    });

    it("Should revert transaction when delegate amount is less then withdraw amount", async () => {
        //    given
        await powerToken.stake(N1__0_18DEC);
        await powerToken.delegateToLiquidityMining([tokens.lpTokenDai.address], [N0__1_18DEC]);
        //    when
        await expect(
            powerToken.undelegateFromLiquidityMining([tokens.lpTokenDai.address], [N0__5_18DEC])
        ).to.be.revertedWith("PT_707");
    });

    it("Should revert transaction when delegated pwToken amount is less than staked lpToken amount", async () => {
        //    given
        await powerToken.stake(N2__0_18DEC);
        await powerToken.delegateToLiquidityMining(
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        //    when
        await expect(
            powerToken.undelegateFromLiquidityMining(
                [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address],
                [N1__0_18DEC, N2__0_18DEC]
            )
        ).to.be.revertedWith("PT_707");
    });

    it("Should revert transaction when mismatch array length - case 1", async () => {
        //    given
        await powerToken.stake(N2__0_18DEC);
        await powerToken.delegateToLiquidityMining(
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        //    when
        await expect(
            powerToken.undelegateFromLiquidityMining(
                [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address],
                [N1__0_18DEC]
            )
        ).to.be.revertedWith("PT_718");
    });

    it("Should revert transaction when mismatch array length - case 2", async () => {
        //    given
        await powerToken.stake(N2__0_18DEC);
        await powerToken.delegateToLiquidityMining(
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        //    when
        await expect(
            powerToken.undelegateFromLiquidityMining(
                [tokens.lpTokenDai.address],
                [N1__0_18DEC, N1__0_18DEC]
            )
        ).to.be.revertedWith("PT_718");
    });

    it("Should withdraw tokens when delegate more tokens", async () => {
        //    given

        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        const [admin] = accounts;
        await powerToken.stake(N2__0_18DEC);
        await powerToken.delegateToLiquidityMining(
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        const delegatedBalanceBefore = await powerToken.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );
        const exchangeRateBefore = await powerToken.calculateExchangeRate();
        const pwTokenBalanceBefore = await powerToken.balanceOf(await admin.getAddress());
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when
        await powerToken.undelegateFromLiquidityMining(
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address],
            [N1__0_18DEC, N0__1_18DEC]
        );

        //    then
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const delegatedBalanceAfter = await powerToken.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );
        const exchangeRateAfter = await powerToken.calculateExchangeRate();
        const pwTokenBalanceAfter = await powerToken.balanceOf(await admin.getAddress());

        expect(delegatedBalanceBefore).to.be.equal(N2__0_18DEC);
        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(pwTokenBalanceBefore).to.be.equal(N2__0_18DEC);

        expect(delegatedBalanceAfter).to.be.equal(N0__1_18DEC.mul(BigNumber.from("9")));
        expect(exchangeRateAfter).to.be.equal(N1__0_18DEC);
        expect(pwTokenBalanceAfter).to.be.equal(N2__0_18DEC);
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(N2__0_18DEC)
        );
    });
});
