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
        //    given
        const rewardsBefore = await john.getRewardsPerBlock(tokens.ipTokenUsdc.address);

        //    when
        await john.setRewardsPerBlock(tokens.ipTokenUsdc.address, N2_0_8D);

        //    then
        const rewardsAfter = await john.getRewardsPerBlock(tokens.ipTokenUsdc.address);

        expect(rewardsBefore).to.be.equal(N1_0_8D);
        expect(rewardsAfter).to.be.equal(N2_0_8D);
    });

    it("Should not update Accrued rewards when update block rewords", async () => {
        //    given
        const rewardsBefore = await john.getRewardsPerBlock(tokens.ipTokenUsdc.address);
        const globalParamsBefore = await john.getGlobalParams(tokens.ipTokenUsdc.address);

        //    when
        await john.setRewardsPerBlock(tokens.ipTokenUsdc.address, N2_0_8D);

        //    then
        const rewardsAfter = await john.getRewardsPerBlock(tokens.ipTokenUsdc.address);
        const globalParamsAfter = await john.getGlobalParams(tokens.ipTokenUsdc.address);

        expect(rewardsBefore).to.be.equal(N1_0_8D);
        expect(rewardsAfter).to.be.equal(N2_0_8D);
        expect(extractGlobalParam(globalParamsBefore).accruedRewards).to.be.equal(ZERO);
        expect(extractGlobalParam(globalParamsAfter).accruedRewards).to.be.equal(ZERO);
    });

    it("Should setup 3 asset", async () => {
        //    given
        const rewardsDaiBefore = await john.getRewardsPerBlock(tokens.ipTokenDai.address);
        const rewardsUsdcBefore = await john.getRewardsPerBlock(tokens.ipTokenUsdc.address);
        const rewardsUsdtBefore = await john.getRewardsPerBlock(tokens.ipTokenUsdt.address);

        //    when
        await john.setRewardsPerBlock(tokens.ipTokenDai.address, N1_0_8D);
        await john.setRewardsPerBlock(tokens.ipTokenUsdc.address, N2_0_8D);
        await john.setRewardsPerBlock(tokens.ipTokenUsdt.address, N0_1_8D);

        //    then
        const rewardsDaiAfter = await john.getRewardsPerBlock(tokens.ipTokenDai.address);
        const rewardsUsdcAfter = await john.getRewardsPerBlock(tokens.ipTokenUsdc.address);
        const rewardsUsdtAfter = await john.getRewardsPerBlock(tokens.ipTokenUsdt.address);

        expect(rewardsDaiBefore).to.be.equal(N1_0_8D);
        expect(rewardsUsdcBefore).to.be.equal(N1_0_8D);
        expect(rewardsUsdtBefore).to.be.equal(N1_0_8D);

        expect(rewardsDaiAfter).to.be.equal(N1_0_8D);
        expect(rewardsUsdcAfter).to.be.equal(N2_0_8D);
        expect(rewardsUsdtAfter).to.be.equal(N0_1_8D);
    });

    it("Should not be able to update value when not owner", async () => {
        //    given
        const rewardsDaiBefore = await john.getRewardsPerBlock(tokens.ipTokenDai.address);

        //    when
        await expect(
            john.connect(userOne).setRewardsPerBlock(tokens.ipTokenDai.address, N2_0_8D)
        ).to.be.revertedWith("Ownable: caller is not the owner");

        //    then
        const rewardsDaiAfter = await john.getRewardsPerBlock(tokens.ipTokenDai.address);

        expect(rewardsDaiBefore).to.be.equal(N1_0_8D);
        expect(rewardsDaiAfter).to.be.equal(N1_0_8D);
    });
});
