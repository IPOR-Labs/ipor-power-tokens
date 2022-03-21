import { BigNumber, Signer } from "ethers";
const { expect } = require("chai");
import {
    ERC20,
    MiltonFaucet,
    AaveStrategy,
    CompoundStrategy,
    StanleyUsdt,
    MiltonUsdc,
    MiltonUsdt,
    MiltonDai,
    JosephDai,
    JosephUsdc,
    JosephUsdt,
    IpToken,
    IvToken,
} from "../../types";

import { deploy, DeployType, setup } from "./deploy";

import { transferUsdtToAddress, transferUsdcToAddress, transferDaiToAddress } from "./tokens";

// Mainnet Fork and test case for mainnet with hardhat network by impersonate account from mainnet
// work for blockNumber: 14222088,
describe("Josepf rebalance, deposit/withdraw from vault", function () {
    if (process.env.FORK_ENABLED != "true") {
        return;
    }
    let admin: Signer;

    let miltonDai: MiltonDai;
    let miltonUsdc: MiltonUsdc;
    let miltonUsdt: MiltonUsdt;

    let josephDai: JosephDai;
    let josephUsdc: JosephUsdc;
    let josephUsdt: JosephUsdt;

    let stanleyUsdt: StanleyUsdt;

    let strategyAaveDai: AaveStrategy;
    let strategyAaveUsdc: AaveStrategy;

    let strategyCompoundUsdt: CompoundStrategy;

    let dai: ERC20;
    let usdc: ERC20;
    let usdt: ERC20;

    let ipTokenDai: IpToken;
    let ipTokenUsdc: IpToken;
    let ipTokenUsdt: IpToken;

    let ivTokenUsdt: IvToken;

    let miltonFaucet: MiltonFaucet;

    before(async () => {
        [admin] = await hre.ethers.getSigners();

        const deployd: DeployType = await deploy();
        ({
            miltonFaucet,
            usdc,
            usdt,
            dai,
            strategyAaveDai,
            strategyAaveUsdc,
            strategyCompoundUsdt,
            stanleyUsdt,
            miltonDai,
            miltonUsdc,
            miltonUsdt,
            josephDai,
            josephUsdc,
            josephUsdt,
            ipTokenDai,
            ipTokenUsdc,
            ipTokenUsdt,
            ivTokenUsdt,
        } = deployd);

        // #####################################################################
        // ##################          Setup            ########################
        // #####################################################################

        await setup(deployd);
    });

    it("ProvideLiquidity for dai", async () => {
        //given

        const deposit = BigNumber.from("10000000000000000000");
        await transferDaiToAddress(
            miltonFaucet.address,
            await admin.getAddress(),
            BigNumber.from("100000000000000000000")
        );
        await dai
            .connect(admin)
            .approve(josephDai.address, BigNumber.from("1000000000000000000000"));
        //when
        await josephDai.connect(admin).provideLiquidity(deposit);

        //then
        const daiMiltonBalanceAfter = await dai.balanceOf(miltonDai.address);
        expect(daiMiltonBalanceAfter, "daiMiltonBalanceAfter").to.be.equal(deposit);
    });

    it("Should rebalanse and deposit(dai) into vault (aave)", async () => {
        //given
        const aaveStrategyBalance = await strategyAaveDai.balanceOf();
        //when
        await josephDai.rebalance();
        //then
        const aaveStrategyAfter = await strategyAaveDai.balanceOf();
        expect(aaveStrategyBalance.lt(aaveStrategyAfter), "aaveStrategyBalance < aaveStrategyAfter")
            .to.be.true;
    });

    it("Redeem tokens from Joseph(dai)", async () => {
        //given
        const ipTokenDaiBalansBefore = await ipTokenDai.balanceOf(await admin.getAddress());
        const toRedeem = BigNumber.from("100000000000000000");
        //when
        await josephDai.redeem(toRedeem);
        //then
        const ipTokenDaiBalansAfter = await ipTokenDai.balanceOf(await admin.getAddress());
        expect(
            ipTokenDaiBalansAfter.lt(ipTokenDaiBalansBefore),
            "ipTokenDaiBalansAfter < ipTokenDaiBalansBefore"
        ).to.be.true;
    });

    it("Should rebalanse and withdraw(dai) from vault (aave)", async () => {
        //given
        const aaveStrategyBalance = await strategyAaveDai.balanceOf();
        //when
        await josephDai.rebalance();
        //then
        const aaveStrategyAfter = await strategyAaveDai.balanceOf();
        expect(aaveStrategyAfter.lt(aaveStrategyBalance), "aaveStrategyAfter < aaveStrategyBalance")
            .to.be.true;
    });

    it("ProvideLiquidity for usdc", async () => {
        //given

        const deposit = BigNumber.from("1000000000");
        await transferUsdcToAddress(
            miltonFaucet.address,
            await admin.getAddress(),
            BigNumber.from("10000000000")
        );
        await usdc.connect(admin).approve(josephUsdc.address, BigNumber.from("100000000000"));
        //when
        await josephUsdc.connect(admin).provideLiquidity(deposit);

        //then
        const usdcMiltonBalanceAfter = await usdc.balanceOf(miltonUsdc.address);
        expect(usdcMiltonBalanceAfter, "usdcMiltonBalanceAfter").to.be.equal(deposit);
    });

    it("Should rebalanse and deposit(usdc) into vault (aave)", async () => {
        //given
        const aaveStrategyBalance = await strategyAaveUsdc.balanceOf();
        //when
        await josephUsdc.rebalance();
        //then
        const aaveStrategyAfter = await strategyAaveUsdc.balanceOf();
        expect(aaveStrategyBalance.lt(aaveStrategyAfter), "aaveStrategyBalance < aaveStrategyAfter")
            .to.be.true;
    });

    it("Redeem tokens from Joseph(usdc)", async () => {
        //given
        const ipTokenUsdcBalansBefore = await ipTokenUsdc.balanceOf(await admin.getAddress());
        const toRedeem = BigNumber.from("100000000000000000");
        //when
        await josephUsdc.redeem(toRedeem);
        //then
        const ipTokenUsdcBalansAfter = await ipTokenUsdc.balanceOf(await admin.getAddress());
        expect(
            ipTokenUsdcBalansAfter.lt(ipTokenUsdcBalansBefore),
            "ipTokenUsdcBalansAfter < ipTokenUsdcBalansBefore"
        ).to.be.true;
    });

    it("Should rebalanse and withdraw(usdc) from vault (aave)", async () => {
        //given
        const aaveStrategyBalance = await strategyAaveUsdc.balanceOf();
        //when
        await josephUsdc.rebalance();
        //then
        const aaveStrategyAfter = await strategyAaveUsdc.balanceOf();
        expect(aaveStrategyAfter.lt(aaveStrategyBalance), "aaveStrategyAfter < aaveStrategyBalance")
            .to.be.true;
    });

    it("ProvideLiquidity for usdt", async () => {
        //given

        const deposit = BigNumber.from("1000000000");
        await transferUsdtToAddress(
            miltonFaucet.address,
            await admin.getAddress(),
            BigNumber.from("10000000000")
        );
        await usdt.connect(admin).approve(josephUsdt.address, BigNumber.from("100000000000"));
        //when
        await josephUsdt.connect(admin).provideLiquidity(deposit);

        //then
        const usdtMiltonBalanceAfter = await usdt.balanceOf(miltonUsdt.address);
        expect(usdtMiltonBalanceAfter, "usdtMiltonBalanceAfter").to.be.equal(deposit);
    });

    it("Should rebalanse and deposit(usdt) into vault (compound)", async () => {
        //given
        const compoundStrategyBefore = await strategyCompoundUsdt.balanceOf();
        //when
        await josephUsdt.rebalance();
        //then
        const compoundStrategyAfter = await strategyCompoundUsdt.balanceOf();
        expect(
            compoundStrategyBefore.lt(compoundStrategyAfter),
            "compoundStrategyBefore < compoundStrategyAfter"
        ).to.be.true;
    });

    it("Redeem tokens from Joseph(usdt)", async () => {
        //given
        const ipTokenUsdtBalansBefore = await ipTokenUsdt.balanceOf(await admin.getAddress());
        const toRedeem = BigNumber.from("1000000");
        //when
        await josephUsdt.redeem(toRedeem);
        //then
        const ipTokenUsdtBalansAfter = await ipTokenUsdt.balanceOf(await admin.getAddress());
        expect(
            ipTokenUsdtBalansAfter.lt(ipTokenUsdtBalansBefore),
            "ipTokenUsdtBalansAfter < ipTokenUsdtBalansBefore"
        ).to.be.true;
    });

    it("Should not rebalanse and withdraw(usdt) from vault (compound)", async () => {
        //given
        const compoundStrategyBalance = await strategyCompoundUsdt.balanceOf();
        //when
        await expect(josephUsdt.rebalance()).to.be.revertedWith("IPOR_333");
        //then
        const compoundStrategyAfter = await strategyCompoundUsdt.balanceOf();
        expect(
            compoundStrategyAfter.eq(compoundStrategyBalance),
            "compoundStrategyAfter = compoundStrategyBalance"
        ).to.be.true;
    });

    it("Should rebalanse and withdraw(usdt) from vault (compound)", async () => {
        //given
        // this set of acttion generate change on compound balance
        await usdt.connect(admin).approve(stanleyUsdt.address, BigNumber.from("100000000000"));
        await stanleyUsdt.setMilton(await admin.getAddress());
        await stanleyUsdt.deposit(BigNumber.from("1000000"));
        await stanleyUsdt.setMilton(miltonUsdt.address);
        // END this set of acttion generate change on compound balance
        const ivTokenUsdtBalanceBefore = await ivTokenUsdt.balanceOf(miltonUsdt.address);

        // //when
        await josephUsdt.rebalance();
        // //then
        const ivTokenUsdtBalanceAfter = await ivTokenUsdt.balanceOf(miltonUsdt.address);

        expect(
            ivTokenUsdtBalanceAfter.lt(ivTokenUsdtBalanceBefore),
            "ivTokenUsdtBalanceAfter < ivTokenUsdtBalanceBefore"
        ).to.be.true;
    });
});