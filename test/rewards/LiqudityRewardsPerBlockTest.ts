import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityRewards } from "../../types";
import { Tokens, getDeployedTokens, extractGlobalParam } from "../utils/LiquidityRewardsUtils";
import { ZERO } from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

describe("LiquidityRewards Stake and balance", () => {
    const N1_0_8D = BigNumber.from("100000000");
    const N2_0_8D = BigNumber.from("200000000");
    const N0_1_8D = BigNumber.from("10000000");
    let tokens: Tokens;
    let liquidityRewards: LiquidityRewards;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            await admin.getAddress(),
            tokens.ipTokenUsdt.address,
        ])) as LiquidityRewards;
    });

    it("Should set up one asset", async () => {
        //    given
        const rewardsBefore = await liquidityRewards.rewardsPerBlock(tokens.ipTokenUsdc.address);

        //    when
        await liquidityRewards.setRewardsPerBlock(tokens.ipTokenUsdc.address, N2_0_8D);

        //    then
        const rewardsAfter = await liquidityRewards.rewardsPerBlock(tokens.ipTokenUsdc.address);

        expect(rewardsBefore).to.be.equal(N1_0_8D);
        expect(rewardsAfter).to.be.equal(N2_0_8D);
    });

    it("Should not update Accrued rewards when update block rewords", async () => {
        //    given
        const rewardsBefore = await liquidityRewards.rewardsPerBlock(tokens.ipTokenUsdc.address);
        const globalParamsBefore = await liquidityRewards.globalParams(tokens.ipTokenUsdc.address);

        //    when
        await liquidityRewards.setRewardsPerBlock(tokens.ipTokenUsdc.address, N2_0_8D);

        //    then
        const rewardsAfter = await liquidityRewards.rewardsPerBlock(tokens.ipTokenUsdc.address);
        const globalParamsAfter = await liquidityRewards.globalParams(tokens.ipTokenUsdc.address);

        expect(rewardsBefore).to.be.equal(N1_0_8D);
        expect(rewardsAfter).to.be.equal(N2_0_8D);
        expect(extractGlobalParam(globalParamsBefore).accruedRewards).to.be.equal(ZERO);
        expect(extractGlobalParam(globalParamsAfter).accruedRewards).to.be.equal(ZERO);
    });

    it("Should setup 3 asset", async () => {
        //    given
        const rewardsDaiBefore = await liquidityRewards.rewardsPerBlock(tokens.ipTokenDai.address);
        const rewardsUsdcBefore = await liquidityRewards.rewardsPerBlock(
            tokens.ipTokenUsdc.address
        );
        const rewardsUsdtBefore = await liquidityRewards.rewardsPerBlock(
            tokens.ipTokenUsdt.address
        );

        //    when
        await liquidityRewards.setRewardsPerBlock(tokens.ipTokenDai.address, N1_0_8D);
        await liquidityRewards.setRewardsPerBlock(tokens.ipTokenUsdc.address, N2_0_8D);
        await liquidityRewards.setRewardsPerBlock(tokens.ipTokenUsdt.address, N0_1_8D);

        //    then
        const rewardsDaiAfter = await liquidityRewards.rewardsPerBlock(tokens.ipTokenDai.address);
        const rewardsUsdcAfter = await liquidityRewards.rewardsPerBlock(tokens.ipTokenUsdc.address);
        const rewardsUsdtAfter = await liquidityRewards.rewardsPerBlock(tokens.ipTokenUsdt.address);

        expect(rewardsDaiBefore).to.be.equal(N1_0_8D);
        expect(rewardsUsdcBefore).to.be.equal(N1_0_8D);
        expect(rewardsUsdtBefore).to.be.equal(N1_0_8D);

        expect(rewardsDaiAfter).to.be.equal(N1_0_8D);
        expect(rewardsUsdcAfter).to.be.equal(N2_0_8D);
        expect(rewardsUsdtAfter).to.be.equal(N0_1_8D);
    });

    it("Should not be able to update value when not owner", async () => {
        //    given
        const rewardsDaiBefore = await liquidityRewards.rewardsPerBlock(tokens.ipTokenDai.address);

        //    when
        await expect(
            liquidityRewards.connect(userOne).setRewardsPerBlock(tokens.ipTokenDai.address, N2_0_8D)
        ).to.be.revertedWith("Ownable: caller is not the owner");

        //    then
        const rewardsDaiAfter = await liquidityRewards.rewardsPerBlock(tokens.ipTokenDai.address);

        expect(rewardsDaiBefore).to.be.equal(N1_0_8D);
        expect(rewardsDaiAfter).to.be.equal(N1_0_8D);
    });
});
