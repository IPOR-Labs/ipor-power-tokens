import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockMiningCalculation } from "../../types";

chai.use(solidity);
const { expect } = chai;

describe("John Stake and balance", () => {
    const one = BigNumber.from(1);
    const zero = BigNumber.from(0);
    const D18 = BigNumber.from("1000000000000000000");
    const verticalShift = BigNumber.from("400000000000000000");
    const horizontalShift = D18;
    let miningCalculation: MockMiningCalculation;

    before(async () => {
        const MiningCalculation = await hre.ethers.getContractFactory("MockMiningCalculation");
        miningCalculation = (await MiningCalculation.deploy()) as MockMiningCalculation;
    });

    //flow based on Łukasz's excel file
    it("Should calculate rewards", async () => {
        const block1 = BigNumber.from("1");
        const blockRewards = BigNumber.from("300000000");
        const N3_0_D18 = BigNumber.from("3000000000000000000");
        const userOneIpToken = BigNumber.from("100").mul(D18);
        const userOnePwIpor = BigNumber.from("100").mul(D18);
        const userTwoIpToken = BigNumber.from("100").mul(D18);
        const userTwoPwIpor = BigNumber.from("100").mul(D18);
        const userThreeIpToken = BigNumber.from("300").mul(D18);
        const userThreePwIpor = BigNumber.from("100").mul(D18);
        //Block 1 calculation
        const user1compositeMultiplierCumulativeBefore = 0;
        const accruedRewards = await miningCalculation.calculateAccruedRewards(
            block1,
            zero,
            blockRewards,
            zero
        );
        expect(accruedRewards).to.be.equal(N3_0_D18);

        const userPowerUp = await miningCalculation.calculateAccountPowerUp(
            userOnePwIpor,
            userOneIpToken,
            verticalShift,
            horizontalShift
        );
        expect(userPowerUp).to.be.equal(BigNumber.from("1400000000000000000"));

        const aggregateBoost = await miningCalculation.calculateAggregatePowerUp(
            userPowerUp,
            userOneIpToken,
            zero,
            zero,
            0
        );

        expect(aggregateBoost).to.be.equal(BigNumber.from("140000000000000000000"));

        const compositeMultiplier = await miningCalculation.compositeMultiplier(
            blockRewards,
            aggregateBoost
        );

        expect(compositeMultiplier).to.be.equal(BigNumber.from("21428571428571428571428571"));

        const compositeMultiplierCumulative = await miningCalculation.compositeMultiplierCumulative(
            zero,
            one,
            zero,
            zero,
            compositeMultiplier
        );
        expect(compositeMultiplierCumulative).to.be.equal(
            BigNumber.from("21428571428571428571428571")
        );
        const block1CompositeMultiplierCumulative = compositeMultiplierCumulative; // userOne
        const rewardsInBlock = await miningCalculation.calculateUserRewards(
            userOneIpToken,
            userPowerUp,
            compositeMultiplierCumulative,
            user1compositeMultiplierCumulativeBefore
        );
        expect(rewardsInBlock).to.be.equal(BigNumber.from("3000000000000000000"));

        //Block 2 calculation
        const block2 = BigNumber.from("2");
        const compositeMultiplierCumulativeBlock2 =
            await miningCalculation.compositeMultiplierCumulative(
                one,
                block2,
                block1CompositeMultiplierCumulative,
                compositeMultiplier,
                compositeMultiplier
            );
        const rewardsInBlock2UserOne = await miningCalculation.calculateUserRewards(
            userOneIpToken,
            userPowerUp,
            compositeMultiplierCumulativeBlock2,
            user1compositeMultiplierCumulativeBefore
        );

        expect(rewardsInBlock2UserOne, "Rewords userOne in block 2").to.be.equal(
            BigNumber.from("6000000000000000000")
        );

        //Block 3 calculation
        //User one rewards
        const block3 = BigNumber.from("3");

        //    userTwo 100 ipToken pwIpor 100

        const accruedRewardsBlok3 = await miningCalculation.calculateAccruedRewards(
            block3,
            block1,
            blockRewards,
            accruedRewards
        );
        expect(accruedRewardsBlok3).to.be.equal(BigNumber.from("9").mul(D18));

        const userPowerUpUserTwo = await miningCalculation.calculateAccountPowerUp(
            userTwoPwIpor,
            userTwoIpToken,
            verticalShift,
            horizontalShift
        );
        expect(userPowerUpUserTwo).to.be.equal(BigNumber.from("1400000000000000000"));

        const aggregateBoostBlock3 = await miningCalculation.calculateAggregatePowerUp(
            userPowerUp,
            userTwoIpToken,
            zero,
            zero,
            aggregateBoost
        );

        expect(aggregateBoostBlock3).to.be.equal(BigNumber.from("280000000000000000000"));

        const compositeMultiplierBlock3 = await miningCalculation.compositeMultiplier(
            blockRewards,
            aggregateBoostBlock3
        );

        expect(compositeMultiplierBlock3).to.be.equal(BigNumber.from("10714285714285714285714286"));

        const compositeMultiplierCumulativeBlock3 =
            await miningCalculation.compositeMultiplierCumulative(
                block1,
                block3,
                compositeMultiplierCumulative,
                compositeMultiplier,
                compositeMultiplierBlock3
            ); // user2

        expect(compositeMultiplierCumulativeBlock3).to.be.equal(
            BigNumber.from("53571428571428571428571428")
        );

        const user2compositeMultiplierCumulativeBefore = compositeMultiplierCumulativeBlock2;
        const rewardsInBlock3User2 = await miningCalculation.calculateUserRewards(
            userOneIpToken,
            userPowerUp,
            compositeMultiplierCumulativeBlock3,
            user2compositeMultiplierCumulativeBefore
        );
        expect(rewardsInBlock3User2).to.be.equal(BigNumber.from("1500000000000000000"));

        const rewardsInBlock3UserOne = await miningCalculation.calculateUserRewards(
            userOneIpToken,
            userPowerUp,
            compositeMultiplierCumulativeBlock3,
            user1compositeMultiplierCumulativeBefore
        );

        expect(rewardsInBlock3UserOne, "Rewords userOne in block 3").to.be.equal(
            BigNumber.from("7500000000000000000")
        );

        //Block 4 calculation
        const block4 = BigNumber.from("4");
        const compositeMultiplierCumulativeBlock4 =
            await miningCalculation.compositeMultiplierCumulative(
                block3,
                block4,
                compositeMultiplierCumulativeBlock3,
                compositeMultiplierBlock3,
                compositeMultiplierBlock3
            );

        const rewardsInBlock4UserOne = await miningCalculation.calculateUserRewards(
            userOneIpToken,
            userPowerUp,
            compositeMultiplierCumulativeBlock4,
            user1compositeMultiplierCumulativeBefore
        );

        const rewardsInBlock4UserTwo = await miningCalculation.calculateUserRewards(
            userOneIpToken,
            userPowerUp,
            compositeMultiplierCumulativeBlock4,
            user2compositeMultiplierCumulativeBefore
        );

        expect(rewardsInBlock4UserOne, "Rewords userOne in block 4").to.be.equal(
            BigNumber.from("9000000000000000000")
        );
        expect(rewardsInBlock4UserTwo, "Rewords userOne in block 4").to.be.equal(
            BigNumber.from("3000000000000000000")
        );

        //Block 5 calculation
        const block5 = BigNumber.from("5");

        const accruedRewardsBlok5 = await miningCalculation.calculateAccruedRewards(
            block5,
            block3,
            blockRewards,
            accruedRewardsBlok3
        );
        expect(accruedRewardsBlok5).to.be.equal(BigNumber.from("15").mul(D18));

        const userPowerUpUserThree = await miningCalculation.calculateAccountPowerUp(
            userThreePwIpor,
            userThreeIpToken,
            verticalShift,
            horizontalShift
        );
        expect(userPowerUpUserThree).to.be.equal(BigNumber.from("815037499278843819"));

        const aggregateBoostBlock5 = await miningCalculation.calculateAggregatePowerUp(
            userPowerUpUserThree,
            userThreeIpToken,
            zero,
            zero,
            aggregateBoostBlock3
        );

        expect(aggregateBoostBlock5).to.be.equal(BigNumber.from("524511249783653145700"));

        const compositeMultiplierBlock5 = await miningCalculation.compositeMultiplier(
            blockRewards,
            aggregateBoostBlock5
        );

        expect(compositeMultiplierBlock5).to.be.equal(BigNumber.from("5719610401564160383976446"));

        const compositeMultiplierCumulativeBlock5 =
            await miningCalculation.compositeMultiplierCumulative(
                block3,
                block5,
                compositeMultiplierCumulativeBlock3,
                compositeMultiplierBlock3,
                compositeMultiplierBlock5
            ); // user2

        expect(compositeMultiplierCumulativeBlock5).to.be.equal(
            BigNumber.from("70005324687278446098262160")
        );

        const user3compositeMultiplierCumulativeBefore = compositeMultiplierCumulativeBlock4;
        const rewardsInBlock5User3 = await miningCalculation.calculateUserRewards(
            userThreeIpToken,
            userPowerUpUserThree,
            compositeMultiplierCumulativeBlock5,
            user3compositeMultiplierCumulativeBefore
        );
        expect(rewardsInBlock5User3).to.be.equal(BigNumber.from("1398509087562035092"));

        const rewardsInBlock5UserOne = await miningCalculation.calculateUserRewards(
            userOneIpToken,
            userPowerUp,
            compositeMultiplierCumulativeBlock5,
            user1compositeMultiplierCumulativeBefore
        );

        expect(rewardsInBlock5UserOne, "Rewords userOne in block 3").to.be.equal(
            BigNumber.from("9800745456218982454")
        );

        const rewardsInBlock5UserTwo = await miningCalculation.calculateUserRewards(
            userOneIpToken,
            userPowerUp,
            compositeMultiplierCumulativeBlock5,
            user2compositeMultiplierCumulativeBefore
        );

        expect(rewardsInBlock5UserTwo, "Rewords userOne in block 4").to.be.equal(
            BigNumber.from("3800745456218982454")
        );

        const sumBlock5 = rewardsInBlock5User3
            .add(rewardsInBlock5UserOne)
            .add(rewardsInBlock5UserTwo);
        expect(sumBlock5).to.be.equal(BigNumber.from("15000000000000000000"));
    });
});
