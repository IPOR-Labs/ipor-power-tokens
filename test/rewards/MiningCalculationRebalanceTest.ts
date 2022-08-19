import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockMiningCalculation } from "../../types";
import {
    N1__0_18DEC,
    N1__0_6DEC,
    ZERO,
    N0__1_18DEC,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

describe("LiquidityRewards Stake and balance", () => {
    const one = BigNumber.from(1);
    const zero = BigNumber.from(0);
    const D18 = BigNumber.from("1000000000000000000");
    const verticalShift = BigNumber.from("400000000000000000");
    const horizontalShift = D18;
    let miningCalculation: MockMiningCalculation;
    let lastBlockNumber = BigNumber.from("823");
    let blockNumber = BigNumber.from("823");
    let blockRewords = BigNumber.from("100000000");

    before(async () => {
        const MiningCalculation = await hre.ethers.getContractFactory("MockMiningCalculation");
        miningCalculation = (await MiningCalculation.deploy()) as MockMiningCalculation;
    });

    const getBlockNumber = (): BigNumber => {
        const newBlockNumber = blockNumber.add(one);
        blockNumber = newBlockNumber;
        return blockNumber;
    };

    // it("Should pass negative CM case", async () => {
    //     let accruedRewards: BigNumber;
    //     let compositeMultiplierGlobal: BigNumber;
    //     let userPowerUp: BigNumber;
    //     let userCompositeMultiplier: BigNumber;
    //     //    SetUp blockReward
    //     console.log("#################SetUp blockReward##################");
    //     accruedRewards = await miningCalculation.calculateAccruedRewards(
    //         blockNumber,
    //         lastBlockNumber,
    //         blockRewords,
    //         zero
    //     );
    //     console.log("###accruedRewards: ", accruedRewards.toString());
    //     console.log("###accruedRewards: ", accruedRewards.div(D18).toString());
    //     compositeMultiplierGlobal = await miningCalculation.calculateCompositeMultiplier(
    //         0,
    //         accruedRewards,
    //         0
    //     );
    //     console.log("###compositeMultiplierGlobal: ", compositeMultiplierGlobal.toString());
    //     console.log(
    //         "###compositeMultiplierGlobal: ",
    //         compositeMultiplierGlobal.div(D18).toString()
    //     );
    //
    //     console.log("#################SDelegate Power Token##################");
    //     let newPowerTokenBalance = BigNumber.from(100).mul(D18);
    //
    //     userPowerUp = await miningCalculation.calculateUserPowerUp(
    //         newPowerTokenBalance,
    //         zero,
    //         verticalShift,
    //         horizontalShift
    //     );
    //     console.log("###userPowerUp: ", userPowerUp.toString());
    //     console.log("###userPowerUp: ", userPowerUp.div(D18).toString());
    //
    //     userCompositeMultiplier = await miningCalculation.calculateUserCompositeMultiplier(
    //         compositeMultiplierGlobal,
    //         blockRewords,
    //         zero
    //     );
    //     console.log("###userCompositeMultiplier: ", userCompositeMultiplier.toString());
    //     console.log("###userCompositeMultiplier: ", userCompositeMultiplier.div(D18).toString());
    // });

    it("Should ", async () => {
        const block1 = BigNumber.from("1");
        const blockRewards = BigNumber.from("300000000");
        const N3_0_D18 = BigNumber.from("3000000000000000000");
        const userOneIpToken = BigNumber.from("100").mul(D18);
        const userOnePwToken = BigNumber.from("100").mul(D18);
        const userTwoIpToken = BigNumber.from("100").mul(D18);
        const userTwoPwToken = BigNumber.from("100").mul(D18);
        const userThreeIpToken = BigNumber.from("300").mul(D18);
        const userThreePwToken = BigNumber.from("100").mul(D18);
        //Block 1 calculation
        const user1compositeMultiplierCumulativeBefore = 0;
        const accruedRewards = await miningCalculation.calculateAccruedRewards(
            block1,
            zero,
            blockRewards,
            zero
        );
        expect(accruedRewards).to.be.equal(N3_0_D18);

        const userPowerUp = await miningCalculation.calculateUserPowerUp(
            userOnePwToken,
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

        expect(compositeMultiplier).to.be.equal(BigNumber.from("21428571428571428"));

        const compositeMultiplierCumulative = await miningCalculation.compositeMultiplierCumulative(
            zero,
            one,
            zero,
            zero,
            compositeMultiplier
        );
        expect(compositeMultiplierCumulative).to.be.equal(BigNumber.from("21428571428571428"));
        const block1CompositeMultiplierCumulative = compositeMultiplierCumulative; // userOne
        const rewardsInBlock = await miningCalculation.calculateUserRewards(
            userOneIpToken,
            userPowerUp,
            compositeMultiplierCumulative,
            user1compositeMultiplierCumulativeBefore
        );
        expect(rewardsInBlock).to.be.equal(BigNumber.from("2999999999999999920"));

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
        console.log(
            "############### compositeMultiplierCumulativeBlock2:  ",
            compositeMultiplierCumulativeBlock2.toString()
        );
        const rewardsInBlock2UserOne = await miningCalculation.calculateUserRewards(
            userOneIpToken,
            userPowerUp,
            compositeMultiplierCumulativeBlock2,
            user1compositeMultiplierCumulativeBefore
        );

        console.log(rewardsInBlock2UserOne.toString());
        expect(rewardsInBlock2UserOne, "Rewords userOne in block 2").to.be.equal(
            BigNumber.from("5999999999999999840")
        );

        //Block 3 calculation
        //User one rewards
        const block3 = BigNumber.from("3");

        //    userTwo 100 ipToken pwToken 100

        const accruedRewardsBlok3 = await miningCalculation.calculateAccruedRewards(
            block3,
            block1,
            blockRewards,
            accruedRewards
        );
        console.log("################: ", accruedRewardsBlok3.toString());
        expect(accruedRewardsBlok3).to.be.equal(BigNumber.from("9").mul(D18));

        const userPowerUpUserTwo = await miningCalculation.calculateUserPowerUp(
            userTwoPwToken,
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

        expect(compositeMultiplierBlock3).to.be.equal(BigNumber.from("10714285714285714"));

        const compositeMultiplierCumulativeBlock3 =
            await miningCalculation.compositeMultiplierCumulative(
                block1,
                block3,
                compositeMultiplierCumulative,
                compositeMultiplier,
                compositeMultiplierBlock3
            ); // user2

        expect(compositeMultiplierCumulativeBlock3).to.be.equal(
            BigNumber.from("53571428571428570")
        );

        const user2compositeMultiplierCumulativeBefore = compositeMultiplierCumulativeBlock2;
        const rewardsInBlock3User2 = await miningCalculation.calculateUserRewards(
            userOneIpToken,
            userPowerUp,
            compositeMultiplierCumulativeBlock3,
            user2compositeMultiplierCumulativeBefore
        );
        expect(rewardsInBlock3User2).to.be.equal(BigNumber.from("1499999999999999960"));

        const rewardsInBlock3UserOne = await miningCalculation.calculateUserRewards(
            userOneIpToken,
            userPowerUp,
            compositeMultiplierCumulativeBlock3,
            user1compositeMultiplierCumulativeBefore
        );

        console.log(rewardsInBlock3UserOne.toString());
        expect(rewardsInBlock3UserOne, "Rewords userOne in block 3").to.be.equal(
            BigNumber.from("7499999999999999800")
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
        console.log(
            "############### compositeMultiplierCumulativeBlock4:  ",
            compositeMultiplierCumulativeBlock4.toString()
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

        console.log(rewardsInBlock4UserTwo.toString());
        expect(rewardsInBlock4UserOne, "Rewords userOne in block 4").to.be.equal(
            BigNumber.from("8999999999999999760")
        );
        expect(rewardsInBlock4UserTwo, "Rewords userOne in block 4").to.be.equal(
            BigNumber.from("2999999999999999920")
        );

        //Block 5 calculation
        const block5 = BigNumber.from("5");

        const accruedRewardsBlok5 = await miningCalculation.calculateAccruedRewards(
            block5,
            block3,
            blockRewards,
            accruedRewardsBlok3
        );
        console.log("################: ", accruedRewardsBlok5.toString());
        expect(accruedRewardsBlok5).to.be.equal(BigNumber.from("15").mul(D18));

        const userPowerUpUserThree = await miningCalculation.calculateUserPowerUp(
            userThreePwToken,
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

        expect(compositeMultiplierBlock5).to.be.equal(BigNumber.from("5719610401564160"));

        const compositeMultiplierCumulativeBlock5 =
            await miningCalculation.compositeMultiplierCumulative(
                block3,
                block5,
                compositeMultiplierCumulativeBlock3,
                compositeMultiplierBlock3,
                compositeMultiplierBlock5
            ); // user2

        expect(compositeMultiplierCumulativeBlock5).to.be.equal(
            BigNumber.from("70005324687278444")
        );

        const user3compositeMultiplierCumulativeBefore = compositeMultiplierCumulativeBlock4;
        const rewardsInBlock5User3 = await miningCalculation.calculateUserRewards(
            userThreeIpToken,
            userPowerUpUserThree,
            compositeMultiplierCumulativeBlock5,
            user3compositeMultiplierCumulativeBefore
        );
        expect(rewardsInBlock5User3).to.be.equal(BigNumber.from("1398509087562034999"));

        const rewardsInBlock5UserOne = await miningCalculation.calculateUserRewards(
            userOneIpToken,
            userPowerUp,
            compositeMultiplierCumulativeBlock5,
            user1compositeMultiplierCumulativeBefore
        );

        console.log(rewardsInBlock5UserOne.toString());
        expect(rewardsInBlock5UserOne, "Rewords userOne in block 3").to.be.equal(
            BigNumber.from("9800745456218982160")
        );

        const rewardsInBlock5UserTwo = await miningCalculation.calculateUserRewards(
            userOneIpToken,
            userPowerUp,
            compositeMultiplierCumulativeBlock5,
            user2compositeMultiplierCumulativeBefore
        );

        console.log(rewardsInBlock5UserTwo.toString());

        expect(rewardsInBlock5UserTwo, "Rewords userOne in block 4").to.be.equal(
            BigNumber.from("3800745456218982320")
        );

        const sumBlock5 = rewardsInBlock5User3
            .add(rewardsInBlock5UserOne)
            .add(rewardsInBlock5UserTwo);
        expect(sumBlock5).to.be.equal(BigNumber.from("14999999999999999479"));
    });
});
