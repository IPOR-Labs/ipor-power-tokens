import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { John } from "../../types";
import { Tokens, getDeployedTokens, extractGlobalParam } from "../utils/JohnUtils";
import { ZERO } from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

describe("John Stake and balance", () => {
    const N1_0_8D = BigNumber.from("100000000");
    const N2_0_8D = BigNumber.from("200000000");
    const N0_1_8D = BigNumber.from("10000000");
    let tokens: Tokens;
    let john: John;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const John = await hre.ethers.getContractFactory("John");
        john = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            await admin.getAddress(),
            tokens.ipTokenUsdt.address,
        ])) as John;
    });

    it("Should set up one asset", async () => {
        // given
        const globalIndicatorsUsdcBefore = await john.getGlobalIndicators(
            tokens.ipTokenUsdc.address
        );
        const rewardsBefore = globalIndicatorsUsdcBefore.rewardsPerBlock;

        // when
        await john.setRewardsPerBlock(tokens.ipTokenUsdc.address, N2_0_8D);

        // then
        const globalIndicatorsUsdcAfter = await john.getGlobalIndicators(
            tokens.ipTokenUsdc.address
        );
        const rewardsAfter = globalIndicatorsUsdcAfter.rewardsPerBlock;

        expect(rewardsBefore).to.be.equal(N1_0_8D);
        expect(rewardsAfter).to.be.equal(N2_0_8D);
    });

    it("Should not update Accrued rewards when update block rewords", async () => {
        //    given
        const globalIndicatorsUsdcBefore = await john.getGlobalIndicators(
            tokens.ipTokenUsdc.address
        );
        const rewardsBefore = globalIndicatorsUsdcBefore.rewardsPerBlock;
        const globalIndicatorsBefore = await john.getGlobalIndicators(tokens.ipTokenUsdc.address);

        //    when
        await john.setRewardsPerBlock(tokens.ipTokenUsdc.address, N2_0_8D);

        //    then
        const globalIndicatorsUsdcAfter = await john.getGlobalIndicators(
            tokens.ipTokenUsdc.address
        );
        const rewardsAfter = globalIndicatorsUsdcAfter.rewardsPerBlock;

        expect(rewardsBefore).to.be.equal(N1_0_8D);
        expect(rewardsAfter).to.be.equal(N2_0_8D);
        expect(extractGlobalParam(globalIndicatorsBefore).accruedRewards).to.be.equal(ZERO);
        expect(extractGlobalParam(globalIndicatorsUsdcAfter).accruedRewards).to.be.equal(ZERO);
    });

    it("Should setup 3 asset", async () => {
        //    given
        const globalIndicatorsDaiBefore = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const rewardsDaiBefore = globalIndicatorsDaiBefore.rewardsPerBlock;

        const globalIndicatorsUsdcBefore = await john.getGlobalIndicators(
            tokens.ipTokenUsdc.address
        );
        const rewardsUsdcBefore = globalIndicatorsUsdcBefore.rewardsPerBlock;

        const globalIndicatorsUsdtBefore = await john.getGlobalIndicators(
            tokens.ipTokenUsdt.address
        );
        const rewardsUsdtBefore = globalIndicatorsUsdtBefore.rewardsPerBlock;

        //    when
        await john.setRewardsPerBlock(tokens.ipTokenDai.address, N1_0_8D);
        await john.setRewardsPerBlock(tokens.ipTokenUsdc.address, N2_0_8D);
        await john.setRewardsPerBlock(tokens.ipTokenUsdt.address, N0_1_8D);

        //    then
        const globalIndicatorsDaiAfter = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const rewardsDaiAfter = await globalIndicatorsDaiAfter.rewardsPerBlock;

        const globalIndicatorsUsdcAfter = await john.getGlobalIndicators(
            tokens.ipTokenUsdc.address
        );
        const rewardsUsdcAfter = globalIndicatorsUsdcAfter.rewardsPerBlock;

        const globalIndicatorsUsdtAfter = await john.getGlobalIndicators(
            tokens.ipTokenUsdt.address
        );
        const rewardsUsdtAfter = globalIndicatorsUsdtAfter.rewardsPerBlock;

        expect(rewardsDaiBefore).to.be.equal(N1_0_8D);
        expect(rewardsUsdcBefore).to.be.equal(N1_0_8D);
        expect(rewardsUsdtBefore).to.be.equal(N1_0_8D);

        expect(rewardsDaiAfter).to.be.equal(N1_0_8D);
        expect(rewardsUsdcAfter).to.be.equal(N2_0_8D);
        expect(rewardsUsdtAfter).to.be.equal(N0_1_8D);
    });

    it("Should not be able to update value when not owner", async () => {
        //    given
        const globalIndicatorsBefore = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const rewardsDaiBefore = globalIndicatorsBefore.rewardsPerBlock;

        //    when
        await expect(
            john.connect(userOne).setRewardsPerBlock(tokens.ipTokenDai.address, N2_0_8D)
        ).to.be.revertedWith("Ownable: caller is not the owner");

        //    then
        const globalIndicatorsAfter = await john.getGlobalIndicators(tokens.ipTokenDai.address);
        const rewardsDaiAfter = globalIndicatorsAfter.rewardsPerBlock;

        expect(rewardsDaiBefore).to.be.equal(N1_0_8D);
        expect(rewardsDaiAfter).to.be.equal(N1_0_8D);
    });
});
