import hre, { network, upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { John } from "../../types";
import { Tokens, getDeployedTokens, extractGlobalParam } from "../utils/JohnUtils";
import { N1__0_18DEC, N2__0_18DEC, USD_1_000_000_18DEC, ZERO } from "../utils/Constants";

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

    it("Should stop adding new rewards when rewards per block setup to zero", async () => {
        //    given
        const ipDai = tokens.ipTokenDai.address;
        await tokens.ipTokenDai.mint(await admin.getAddress(), USD_1_000_000_18DEC);
        await tokens.ipTokenDai.approve(john.address, USD_1_000_000_18DEC);

        await network.provider.send("evm_setAutomine", [false]);
        await john.stake(ipDai, N2__0_18DEC);
        const blockNumberStake = (await hre.ethers.provider.getBlock("latest")).number;
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accountRewardsBefore = await john.calculateAccountRewards(ipDai);
        const accruedRewardsBefore = await john.calculateAccruedRewards(ipDai);
        const globalIndicatorsBefore = await john.getGlobalIndicators(ipDai);
        const blockNumberBefore = (await hre.ethers.provider.getBlock("latest")).number;

        //    when
        await john.setRewardsPerBlock(ipDai, ZERO);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        //    then

        const accountRewardsAfter = await john.calculateAccountRewards(ipDai);
        const accruedRewardsAfter = await john.calculateAccruedRewards(ipDai);
        const globalIndicatorsAfter = await john.getGlobalIndicators(ipDai);
        const blockNumberAfter = (await hre.ethers.provider.getBlock("latest")).number;

        const globalIndicatorsBeforeExtract = extractGlobalParam(globalIndicatorsBefore);
        const globalIndicatorsAfterExtract = extractGlobalParam(globalIndicatorsAfter);

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
            BigNumber.from("1250000000").mul(N1__0_18DEC)
        );
        expect(globalIndicatorsAfterExtract.compositeMultiplierInTheBlock).to.be.equal(ZERO);
    });

    it("Should restart grant rewards  when rewards per block setup from zero to one", async () => {
        //    given
        const ipDai = tokens.ipTokenDai.address;
        await tokens.ipTokenDai.mint(await admin.getAddress(), USD_1_000_000_18DEC);
        await tokens.ipTokenDai.approve(john.address, USD_1_000_000_18DEC);

        await network.provider.send("evm_setAutomine", [false]);
        await john.stake(ipDai, N2__0_18DEC);
        const blockNumberStake = (await hre.ethers.provider.getBlock("latest")).number;
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await john.setRewardsPerBlock(ipDai, ZERO);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accountRewardsBefore = await john.calculateAccountRewards(ipDai);
        const accruedRewardsBefore = await john.calculateAccruedRewards(ipDai);
        const globalIndicatorsBefore = await john.getGlobalIndicators(ipDai);
        const blockNumberBefore = (await hre.ethers.provider.getBlock("latest")).number;

        //    when
        await john.setRewardsPerBlock(ipDai, BigNumber.from("100000000"));
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        //    then

        const accountRewardsAfter = await john.calculateAccountRewards(ipDai);
        const accruedRewardsAfter = await john.calculateAccruedRewards(ipDai);
        const globalIndicatorsAfter = await john.getGlobalIndicators(ipDai);
        const blockNumberAfter = (await hre.ethers.provider.getBlock("latest")).number;

        const globalIndicatorsBeforeExtract = extractGlobalParam(globalIndicatorsBefore);
        const globalIndicatorsAfterExtract = extractGlobalParam(globalIndicatorsAfter);

        await network.provider.send("evm_setAutomine", [true]);
        expect(accountRewardsBefore).to.be.equal(N1__0_18DEC.mul(BigNumber.from("100")));
        expect(accountRewardsAfter).to.be.equal(BigNumber.from("199000000000000000000"));
        expect(accruedRewardsBefore).to.be.equal(N1__0_18DEC.mul(BigNumber.from("100")));
        expect(accruedRewardsAfter).to.be.equal(BigNumber.from("199000000000000000000"));

        expect(globalIndicatorsBeforeExtract.rewardsPerBlock).to.be.equal(ZERO);
        expect(globalIndicatorsAfterExtract.rewardsPerBlock).to.be.equal(
            BigNumber.from("100000000")
        );
        expect(globalIndicatorsBeforeExtract.aggregatedPowerUp).to.be.equal(
            globalIndicatorsAfterExtract.aggregatedPowerUp
        );
        expect(globalIndicatorsAfterExtract.compositeMultiplierInTheBlock).to.be.equal(
            BigNumber.from("1250000000").mul(N1__0_18DEC)
        );
        expect(globalIndicatorsBeforeExtract.compositeMultiplierInTheBlock).to.be.equal(ZERO);
    });
});
