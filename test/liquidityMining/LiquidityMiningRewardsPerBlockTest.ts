import hre, { network, upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockStakedToken } from "../../types";
import { Tokens, getDeployedTokens, extractGlobalIndicators } from "../utils/LiquidityMiningUtils";
import {
    N1__0_18DEC,
    N1__0_8DEC,
    N2__0_18DEC,
    USD_1_000_000_18DEC,
    ZERO,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

describe("LiquidityMining Rewards per block", () => {
    const N1_0_8D = BigNumber.from("100000000");
    const N2_0_8D = BigNumber.from("200000000");
    const N0_1_8D = BigNumber.from("10000000");
    let tokens: Tokens;
    let liquidityMining: LiquidityMining;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const StakedToken = await ethers.getContractFactory("MockStakedToken");
        const stakedToken = (await StakedToken.deploy(
            "IPOR Token",
            "IPOR",
            await admin.getAddress()
        )) as MockStakedToken;
        const PowerToken = await ethers.getContractFactory("PowerToken");
        const powerToken = (await upgrades.deployProxy(PowerToken, [
            stakedToken.address,
        ])) as PowerToken;

        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMiningForTests");
        liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMiningForTests;

        await liquidityMining.setPowerToken(await admin.getAddress());
    });

    it("Should set up block rewards for lpToken", async () => {
        // given
        const globalIndicatorsUsdcBefore = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenUsdc.address
        );
        const rewardsBefore = globalIndicatorsUsdcBefore.rewardsPerBlock;

        // when
        await liquidityMining.setRewardsPerBlock(tokens.lpTokenUsdc.address, N2_0_8D);

        // then
        const globalIndicatorsUsdcAfter = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenUsdc.address
        );
        const rewardsAfter = globalIndicatorsUsdcAfter.rewardsPerBlock;

        expect(rewardsBefore).to.be.equal(ZERO);
        expect(rewardsAfter).to.be.equal(N2_0_8D);
    });

    it("Should not update accrued rewards when update block rewords", async () => {
        //    given
        const globalIndicatorsUsdcBefore = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenUsdc.address
        );
        const rewardsBefore = globalIndicatorsUsdcBefore.rewardsPerBlock;
        const globalIndicatorsBefore = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenUsdc.address
        );

        //    when
        await liquidityMining.setRewardsPerBlock(tokens.lpTokenUsdc.address, N2_0_8D);

        //    then
        const globalIndicatorsUsdcAfter = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenUsdc.address
        );
        const rewardsAfter = globalIndicatorsUsdcAfter.rewardsPerBlock;

        expect(rewardsBefore).to.be.equal(ZERO);
        expect(rewardsAfter).to.be.equal(N2_0_8D);
        expect(extractGlobalIndicators(globalIndicatorsBefore).accruedRewards).to.be.equal(ZERO);
        expect(extractGlobalIndicators(globalIndicatorsUsdcAfter).accruedRewards).to.be.equal(ZERO);
    });

    it("Should setup block rewards for 3 lpTokens", async () => {
        //    given
        const globalIndicatorsDaiBefore = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenDai.address
        );
        const rewardsDaiBefore = globalIndicatorsDaiBefore.rewardsPerBlock;

        const globalIndicatorsUsdcBefore = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenUsdc.address
        );
        const rewardsUsdcBefore = globalIndicatorsUsdcBefore.rewardsPerBlock;

        const globalIndicatorsUsdtBefore = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenUsdt.address
        );
        const rewardsUsdtBefore = globalIndicatorsUsdtBefore.rewardsPerBlock;

        //    when
        await liquidityMining.setRewardsPerBlock(tokens.lpTokenDai.address, N1_0_8D);
        await liquidityMining.setRewardsPerBlock(tokens.lpTokenUsdc.address, N2_0_8D);
        await liquidityMining.setRewardsPerBlock(tokens.lpTokenUsdt.address, N0_1_8D);

        //    then
        const globalIndicatorsDaiAfter = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenDai.address
        );
        const rewardsDaiAfter = await globalIndicatorsDaiAfter.rewardsPerBlock;

        const globalIndicatorsUsdcAfter = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenUsdc.address
        );
        const rewardsUsdcAfter = globalIndicatorsUsdcAfter.rewardsPerBlock;

        const globalIndicatorsUsdtAfter = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenUsdt.address
        );
        const rewardsUsdtAfter = globalIndicatorsUsdtAfter.rewardsPerBlock;

        expect(rewardsDaiBefore).to.be.equal(ZERO);
        expect(rewardsUsdcBefore).to.be.equal(ZERO);
        expect(rewardsUsdtBefore).to.be.equal(ZERO);

        expect(rewardsDaiAfter).to.be.equal(N1_0_8D);
        expect(rewardsUsdcAfter).to.be.equal(N2_0_8D);
        expect(rewardsUsdtAfter).to.be.equal(N0_1_8D);
    });

    it("Should not be able to update value when not owner", async () => {
        //    given
        const globalIndicatorsBefore = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenDai.address
        );
        const rewardsDaiBefore = globalIndicatorsBefore.rewardsPerBlock;

        //    when
        await expect(
            liquidityMining.connect(userOne).setRewardsPerBlock(tokens.lpTokenDai.address, N2_0_8D)
        ).to.be.revertedWith("Ownable: caller is not the owner");

        //    then
        const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenDai.address
        );
        const rewardsDaiAfter = globalIndicatorsAfter.rewardsPerBlock;

        expect(rewardsDaiBefore).to.be.equal(ZERO);
        expect(rewardsDaiAfter).to.be.equal(ZERO);
    });

    it("Should stop adding new rewards when rewards per block setup to zero", async () => {
        //    given
        const lpDai = tokens.lpTokenDai.address;
        await tokens.lpTokenDai.mint(await admin.getAddress(), USD_1_000_000_18DEC);
        await tokens.lpTokenDai.approve(liquidityMining.address, USD_1_000_000_18DEC);

        await liquidityMining.setRewardsPerBlock(tokens.lpTokenDai.address, N1__0_8DEC);

        await network.provider.send("evm_setAutomine", [false]);
        await liquidityMining.stake(lpDai, N2__0_18DEC);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accountRewardsBefore = await liquidityMining.calculateAccountRewards(
            await admin.getAddress(),
            lpDai
        );
        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(lpDai);
        const globalIndicatorsBefore = await liquidityMining.getGlobalIndicators(lpDai);

        //    when
        await liquidityMining.setRewardsPerBlock(lpDai, ZERO);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    then
        const accountRewardsAfter = await liquidityMining.calculateAccountRewards(
            await admin.getAddress(),
            lpDai
        );
        const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(lpDai);
        const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(lpDai);

        const globalIndicatorsBeforeExtract = extractGlobalIndicators(globalIndicatorsBefore);
        const globalIndicatorsAfterExtract = extractGlobalIndicators(globalIndicatorsAfter);

        await network.provider.send("evm_setAutomine", [true]);
        expect(accountRewardsAfter).to.be.equal(accountRewardsBefore.add(N1__0_18DEC));
        expect(accruedRewardsAfter).to.be.equal(accruedRewardsBefore.add(N1__0_18DEC));

        expect(globalIndicatorsBeforeExtract.rewardsPerBlock).to.be.equal(
            BigNumber.from("100000000")
        );
        expect(globalIndicatorsAfterExtract.rewardsPerBlock).to.be.equal(ZERO);
        expect(globalIndicatorsBeforeExtract.aggregatedPowerUp).to.be.equal(
            globalIndicatorsAfterExtract.aggregatedPowerUp
        );
        expect(globalIndicatorsBeforeExtract.compositeMultiplierInTheBlock).to.be.equal(
            BigNumber.from("2500000000000000000000000000")
        );
        expect(globalIndicatorsAfterExtract.compositeMultiplierInTheBlock).to.be.equal(ZERO);
    });

    it("Should restart grant rewards  when rewards per block setup from zero to one", async () => {
        //    given
        const lpDai = tokens.lpTokenDai.address;
        await tokens.lpTokenDai.mint(await admin.getAddress(), USD_1_000_000_18DEC);
        await tokens.lpTokenDai.approve(liquidityMining.address, USD_1_000_000_18DEC);

        await network.provider.send("evm_setAutomine", [false]);
        await liquidityMining.stake(lpDai, N2__0_18DEC);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await liquidityMining.setRewardsPerBlock(lpDai, ZERO);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accountRewardsBefore = await liquidityMining.calculateAccountRewards(
            await admin.getAddress(),
            lpDai
        );
        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(lpDai);
        const globalIndicatorsBefore = await liquidityMining.getGlobalIndicators(lpDai);

        //    when
        await liquidityMining.setRewardsPerBlock(lpDai, BigNumber.from("100000000"));
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    then
        const accountRewardsAfter = await liquidityMining.calculateAccountRewards(
            await admin.getAddress(),
            lpDai
        );
        const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(lpDai);
        const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(lpDai);
        const globalIndicatorsBeforeExtract = extractGlobalIndicators(globalIndicatorsBefore);
        const globalIndicatorsAfterExtract = extractGlobalIndicators(globalIndicatorsAfter);

        await network.provider.send("evm_setAutomine", [true]);
        expect(accountRewardsBefore).to.be.equal(ZERO);
        expect(accountRewardsAfter).to.be.equal(BigNumber.from("99000000000000000000"));
        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(accruedRewardsAfter).to.be.equal(BigNumber.from("99000000000000000000"));

        expect(globalIndicatorsBeforeExtract.rewardsPerBlock).to.be.equal(ZERO);
        expect(globalIndicatorsAfterExtract.rewardsPerBlock).to.be.equal(
            BigNumber.from("100000000")
        );
        expect(globalIndicatorsBeforeExtract.aggregatedPowerUp).to.be.equal(
            globalIndicatorsAfterExtract.aggregatedPowerUp
        );
        expect(globalIndicatorsAfterExtract.compositeMultiplierInTheBlock).to.be.equal(
            BigNumber.from("2500000000000000000000000000")
        );
        expect(globalIndicatorsBeforeExtract.compositeMultiplierInTheBlock).to.be.equal(ZERO);
    });
});
