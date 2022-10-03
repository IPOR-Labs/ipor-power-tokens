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
    it.skip("Should calculate rewards", async () => {
        const block1 = BigNumber.from("1");
        const rewardsPerBlock = BigNumber.from("300000000");
        const N3_0_D18 = BigNumber.from("3000000000000000000");
        const accountOneIpToken = BigNumber.from("100").mul(D18);
        const accountOnePwIpor = BigNumber.from("100").mul(D18);
        const accountTwoIpToken = BigNumber.from("100").mul(D18);
        const accountTwoPwIpor = BigNumber.from("100").mul(D18);
        const accountThreeIpToken = BigNumber.from("300").mul(D18);
        const accountThreePwIpor = BigNumber.from("100").mul(D18);
        //Block 1 calculation
        const account1compositeMultiplierCumulativeBefore = 0;
        const accruedRewards = await miningCalculation.calculateAccruedRewards(
            block1,
            zero,
            rewardsPerBlock,
            zero
        );
        expect(accruedRewards).to.be.equal(N3_0_D18);

        const accountPowerUp = await miningCalculation.calculateAccountPowerUp(
            accountOnePwIpor,
            accountOneIpToken,
            verticalShift,
            horizontalShift
        );
        expect(accountPowerUp).to.be.equal(BigNumber.from("1400000000000000000"));

        const aggregateBoost = await miningCalculation.calculateAggregatePowerUp(
            accountPowerUp,
            accountOneIpToken,
            zero,
            zero,
            0
        );

        expect(aggregateBoost).to.be.equal(BigNumber.from("140000000000000000000"));

        const compositeMultiplier = await miningCalculation.compositeMultiplier(
            rewardsPerBlock,
            aggregateBoost
        );

        expect(compositeMultiplier).to.be.equal(BigNumber.from("21428571428571428571428571"));

        // const compositeMultiplierCumulative = await miningCalculation.compositeMultiplierCumulative(
        //     zero,
        //     one,
        //     zero,
        //     zero,
        //     compositeMultiplier
        // );
        // expect(compositeMultiplierCumulative).to.be.equal(
        //     BigNumber.from("21428571428571428571428571")
        // );
        // const block1CompositeMultiplierCumulative = compositeMultiplierCumulative; // accountOne
        // const rewardsInBlock = await miningCalculation.calculateAccountRewards(
        //     accountOneIpToken,
        //     accountPowerUp,
        //     account1compositeMultiplierCumulativeBefore,
        //     compositeMultiplierCumulative
        // );
        // expect(rewardsInBlock).to.be.equal(BigNumber.from("3000000000000000000"));

        // //Block 2 calculation
        // const block2 = BigNumber.from("2");
        // const compositeMultiplierCumulativeBlock2 =
        //     await miningCalculation.compositeMultiplierCumulative(
        //         one,
        //         block2,
        //         block1CompositeMultiplierCumulative,
        //         compositeMultiplier,
        //         compositeMultiplier
        //     );
        // const rewardsInBlock2AccountOne = await miningCalculation.calculateAccountRewards(
        //     accountOneIpToken,
        //     accountPowerUp,
        //     account1compositeMultiplierCumulativeBefore,
        //     compositeMultiplierCumulativeBlock2
        // );

        // expect(rewardsInBlock2AccountOne, "Rewords accountOne in block 2").to.be.equal(
        //     BigNumber.from("6000000000000000000")
        // );

        //Block 3 calculation
        //Account one rewards
        const block3 = BigNumber.from("3");

        //    accountTwo 100 ipToken pwIpor 100

        const accruedRewardsBlok3 = await miningCalculation.calculateAccruedRewards(
            block3,
            block1,
            rewardsPerBlock,
            accruedRewards
        );
        expect(accruedRewardsBlok3).to.be.equal(BigNumber.from("9").mul(D18));

        const accountPowerUpAccountTwo = await miningCalculation.calculateAccountPowerUp(
            accountTwoPwIpor,
            accountTwoIpToken,
            verticalShift,
            horizontalShift
        );
        expect(accountPowerUpAccountTwo).to.be.equal(BigNumber.from("1400000000000000000"));

        const aggregateBoostBlock3 = await miningCalculation.calculateAggregatePowerUp(
            accountPowerUp,
            accountTwoIpToken,
            zero,
            zero,
            aggregateBoost
        );

        expect(aggregateBoostBlock3).to.be.equal(BigNumber.from("280000000000000000000"));

        const compositeMultiplierBlock3 = await miningCalculation.compositeMultiplier(
            rewardsPerBlock,
            aggregateBoostBlock3
        );

        expect(compositeMultiplierBlock3).to.be.equal(BigNumber.from("10714285714285714285714286"));

        // const compositeMultiplierCumulativeBlock3 =
        //     await miningCalculation.compositeMultiplierCumulative(
        //         block1,
        //         block3,
        //         compositeMultiplierCumulative,
        //         compositeMultiplier,
        //         compositeMultiplierBlock3
        //     ); // account2

        // expect(compositeMultiplierCumulativeBlock3).to.be.equal(
        //     BigNumber.from("53571428571428571428571428")
        // );

        // const account2compositeMultiplierCumulativeBefore = compositeMultiplierCumulativeBlock2;
        // const rewardsInBlock3Account2 = await miningCalculation.calculateAccountRewards(
        //     accountOneIpToken,
        //     accountPowerUp,
        //     account2compositeMultiplierCumulativeBefore,
        //     compositeMultiplierCumulativeBlock3
        // );
        // expect(rewardsInBlock3Account2).to.be.equal(BigNumber.from("1500000000000000000"));

        // const rewardsInBlock3AccountOne = await miningCalculation.calculateAccountRewards(
        //     accountOneIpToken,
        //     accountPowerUp,
        //     account1compositeMultiplierCumulativeBefore,
        //     compositeMultiplierCumulativeBlock3
        // );

        // expect(rewardsInBlock3AccountOne, "Rewords accountOne in block 3").to.be.equal(
        //     BigNumber.from("7500000000000000000")
        // );

        // //Block 4 calculation
        // const block4 = BigNumber.from("4");
        // const compositeMultiplierCumulativeBlock4 =
        //     await miningCalculation.compositeMultiplierCumulative(
        //         block3,
        //         block4,
        //         compositeMultiplierCumulativeBlock3,
        //         compositeMultiplierBlock3,
        //         compositeMultiplierBlock3
        //     );

        // const rewardsInBlock4AccountOne = await miningCalculation.calculateAccountRewards(
        //     accountOneIpToken,
        //     accountPowerUp,
        //     account1compositeMultiplierCumulativeBefore,
        //     compositeMultiplierCumulativeBlock4
        // );

        // const rewardsInBlock4AccountTwo = await miningCalculation.calculateAccountRewards(
        //     accountOneIpToken,
        //     accountPowerUp,
        //     account2compositeMultiplierCumulativeBefore,
        //     compositeMultiplierCumulativeBlock4
        // );

        // expect(rewardsInBlock4AccountOne, "Rewords accountOne in block 4").to.be.equal(
        //     BigNumber.from("9000000000000000000")
        // );
        // expect(rewardsInBlock4AccountTwo, "Rewords accountOne in block 4").to.be.equal(
        //     BigNumber.from("3000000000000000000")
        // );

        //Block 5 calculation
        const block5 = BigNumber.from("5");

        const accruedRewardsBlok5 = await miningCalculation.calculateAccruedRewards(
            block5,
            block3,
            rewardsPerBlock,
            accruedRewardsBlok3
        );
        expect(accruedRewardsBlok5).to.be.equal(BigNumber.from("15").mul(D18));

        const accountPowerUpAccountThree = await miningCalculation.calculateAccountPowerUp(
            accountThreePwIpor,
            accountThreeIpToken,
            verticalShift,
            horizontalShift
        );
        expect(accountPowerUpAccountThree).to.be.equal(BigNumber.from("815037499278843819"));

        const aggregateBoostBlock5 = await miningCalculation.calculateAggregatePowerUp(
            accountPowerUpAccountThree,
            accountThreeIpToken,
            zero,
            zero,
            aggregateBoostBlock3
        );

        expect(aggregateBoostBlock5).to.be.equal(BigNumber.from("524511249783653145700"));

        const compositeMultiplierBlock5 = await miningCalculation.compositeMultiplier(
            rewardsPerBlock,
            aggregateBoostBlock5
        );

        expect(compositeMultiplierBlock5).to.be.equal(BigNumber.from("5719610401564160383976446"));

        // const compositeMultiplierCumulativeBlock5 =
        //     await miningCalculation.compositeMultiplierCumulative(
        //         block3,
        //         block5,
        //         compositeMultiplierCumulativeBlock3,
        //         compositeMultiplierBlock3,
        //         compositeMultiplierBlock5
        //     ); // account2

        // expect(compositeMultiplierCumulativeBlock5).to.be.equal(
        //     BigNumber.from("70005324687278446098262160")
        // );

        // const account3compositeMultiplierCumulativeBefore = compositeMultiplierCumulativeBlock4;
        // const rewardsInBlock5Account3 = await miningCalculation.calculateAccountRewards(
        //     accountThreeIpToken,
        //     accountPowerUpAccountThree,
        //     account3compositeMultiplierCumulativeBefore,
        //     compositeMultiplierCumulativeBlock5
        // );
        // expect(rewardsInBlock5Account3).to.be.equal(BigNumber.from("1398509087562035092"));

        // const rewardsInBlock5AccountOne = await miningCalculation.calculateAccountRewards(
        //     accountOneIpToken,
        //     accountPowerUp,
        //     account1compositeMultiplierCumulativeBefore,
        //     compositeMultiplierCumulativeBlock5
        // );

        // expect(rewardsInBlock5AccountOne, "Rewords accountOne in block 3").to.be.equal(
        //     BigNumber.from("9800745456218982454")
        // );

        // const rewardsInBlock5AccountTwo = await miningCalculation.calculateAccountRewards(
        //     accountOneIpToken,
        //     accountPowerUp,
        //     account2compositeMultiplierCumulativeBefore,
        //     compositeMultiplierCumulativeBlock5
        // );

        // expect(rewardsInBlock5AccountTwo, "Rewords accountOne in block 4").to.be.equal(
        //     BigNumber.from("3800745456218982454")
        // );

        // const sumBlock5 = rewardsInBlock5Account3
        //     .add(rewardsInBlock5AccountOne)
        //     .add(rewardsInBlock5AccountTwo);
        // expect(sumBlock5).to.be.equal(BigNumber.from("15000000000000000000"));
    });
});
