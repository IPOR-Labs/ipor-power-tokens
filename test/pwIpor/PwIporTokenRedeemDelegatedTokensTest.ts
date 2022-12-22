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
    N0__5_18DEC,
    N2__0_18DEC,
} from "../utils/Constants";
import { it } from "mocha";
import { getDeployedTokens, Tokens } from "../utils/LiquidityMiningUtils";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PowerIpor configuration, deploy tests", () => {
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
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;

        await powerIpor.setLiquidityMining(liquidityMining.address);
    });

    it("Should revert transaction when withdraw zero", async () => {
        //    given
        await powerIpor.stake(N1__0_18DEC);
        //    when
        await expect(
            powerIpor.undelegateFromLiquidityMining([tokens.ipTokenDai.address], [ZERO])
        ).to.be.revertedWith("IPOR_717");
    });

    it("Should revert transaction when no delegate tokens", async () => {
        //    given
        await powerIpor.stake(N1__0_18DEC);
        //    when
        await expect(
            powerIpor.undelegateFromLiquidityMining([tokens.ipTokenDai.address], [N0__1_18DEC])
        ).to.be.revertedWith("IPOR_707");
    });

    it("Should revert transaction when delegate amount is less then withdraw amount", async () => {
        //    given
        await powerIpor.stake(N1__0_18DEC);
        await powerIpor.delegateToLiquidityMining([tokens.ipTokenDai.address], [N0__1_18DEC]);
        //    when
        await expect(
            powerIpor.undelegateFromLiquidityMining([tokens.ipTokenDai.address], [N0__5_18DEC])
        ).to.be.revertedWith("IPOR_707");
    });

    it("Should revert transaction when delegated pwIpor amount is less than staked ipToken amount", async () => {
        //    given
        await powerIpor.stake(N2__0_18DEC);
        await powerIpor.delegateToLiquidityMining(
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        //    when
        await expect(
            powerIpor.undelegateFromLiquidityMining(
                [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address],
                [N1__0_18DEC, N2__0_18DEC]
            )
        ).to.be.revertedWith("IPOR_707");
    });

    it("Should revert transaction when mismatch array length - case 1", async () => {
        //    given
        await powerIpor.stake(N2__0_18DEC);
        await powerIpor.delegateToLiquidityMining(
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        //    when
        await expect(
            powerIpor.undelegateFromLiquidityMining(
                [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address],
                [N1__0_18DEC]
            )
        ).to.be.revertedWith("IPOR_718");
    });

    it("Should revert transaction when mismatch array length - case 2", async () => {
        //    given
        await powerIpor.stake(N2__0_18DEC);
        await powerIpor.delegateToLiquidityMining(
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        //    when
        await expect(
            powerIpor.undelegateFromLiquidityMining(
                [tokens.ipTokenDai.address],
                [N1__0_18DEC, N1__0_18DEC]
            )
        ).to.be.revertedWith("IPOR_718");
    });

    it("Should withdraw tokens when delegate more tokens", async () => {
        //    given

        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const [admin] = accounts;
        await powerIpor.stake(N2__0_18DEC);
        await powerIpor.delegateToLiquidityMining(
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        const delegatedBalanceBefore = await powerIpor.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );
        const exchangeRateBefore = await powerIpor.calculateExchangeRate();
        const pwIporBalanceBefore = await powerIpor.balanceOf(await admin.getAddress());
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when
        await powerIpor.undelegateFromLiquidityMining(
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address],
            [N1__0_18DEC, N0__1_18DEC]
        );

        //    then
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const delegatedBalanceAfter = await powerIpor.delegatedToLiquidityMiningBalanceOf(
            await admin.getAddress()
        );
        const exchangeRateAfter = await powerIpor.calculateExchangeRate();
        const pwIporBalanceAfter = await powerIpor.balanceOf(await admin.getAddress());

        expect(delegatedBalanceBefore).to.be.equal(N2__0_18DEC);
        expect(exchangeRateBefore).to.be.equal(N1__0_18DEC);
        expect(pwIporBalanceBefore).to.be.equal(N2__0_18DEC);

        expect(delegatedBalanceAfter).to.be.equal(N0__1_18DEC.mul(BigNumber.from("9")));
        expect(exchangeRateAfter).to.be.equal(N1__0_18DEC);
        expect(pwIporBalanceAfter).to.be.equal(N2__0_18DEC);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(N2__0_18DEC)
        );
    });
});
