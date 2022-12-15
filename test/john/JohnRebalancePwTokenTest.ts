import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { John, IporToken, PowerIpor } from "../../types";
import {
    Tokens,
    getDeployedTokens,
    extractGlobalIndicators,
    expectAccountIndicators,
    expectGlobalIndicators,
    extractAccountIndicators,
} from "../utils/JohnUtils";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
    N1__0_8DEC,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

describe("John - Rebalance on delegate pwIpor", () => {
    let tokens: Tokens;
    let john: John;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let iporToken: IporToken;
    let powerIpor: PowerIpor;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const IporToken = await hre.ethers.getContractFactory("IporToken");
        iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await admin.getAddress()
        )) as IporToken;
        const PowerIpor = await hre.ethers.getContractFactory("PowerIpor");
        powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;

        const John = await hre.ethers.getContractFactory("John");
        john = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as John;

        await john.setRewardsPerBlock(tokens.ipTokenDai.address, N1__0_8DEC);
        await john.setRewardsPerBlock(tokens.ipTokenUsdc.address, N1__0_8DEC);
        await john.setRewardsPerBlock(tokens.ipTokenUsdt.address, N1__0_8DEC);

        await tokens.ipTokenDai.approve(john.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenDai.connect(userOne).approve(john.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenDai.connect(userTwo).approve(john.address, TOTAL_SUPPLY_18_DECIMALS);

        await tokens.ipTokenUsdc.approve(john.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdc.connect(userOne).approve(john.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdc.connect(userTwo).approve(john.address, TOTAL_SUPPLY_6_DECIMALS);

        await tokens.ipTokenUsdt.approve(john.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdt.connect(userOne).approve(john.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdt.connect(userTwo).approve(john.address, TOTAL_SUPPLY_6_DECIMALS);

        await iporToken.approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.connect(userOne).approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.connect(userTwo).approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.transfer(
            await userOne.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await iporToken.transfer(
            await userTwo.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await iporToken.transfer(john.address, N1__0_18DEC.mul(BigNumber.from("100000")));
        await powerIpor.setJohn(john.address);
    });

    describe("Rebalance on stake Power Ipor Token", () => {
        it("Should setup accountIndicators and globalIndicators and returns 100 rewards when 100 blocks was mine", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const johnIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(john.address);
            const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

            const initGlobalIndicatorsResponse = await john.getGlobalIndicators(
                tokens.ipTokenDai.address
            );
            const initUserIndicatorsResponse = await john.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );

            await powerIpor.stake(delegatedIporToken);
            await john.stake(tokens.ipTokenDai.address, stakedIpTokens);

            const afterDelegatePwIporGPR = await john.getGlobalIndicators(
                tokens.ipTokenDai.address
            );
            const afterDelegatePwIporUPR = await john.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );

            //    when
            await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);

            //    then
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const afterStakeIpTokensGPR = await john.getGlobalIndicators(tokens.ipTokenDai.address);
            const afterStakeIpTokensUPR = await john.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );

            const johnIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(john.address);
            const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

            expectGlobalIndicators(
                extractGlobalIndicators(initGlobalIndicatorsResponse),
                ZERO,
                ZERO,
                ZERO,
                ZERO,
                -1,
                100000000
            );
            expectAccountIndicators(
                extractAccountIndicators(initUserIndicatorsResponse),
                ZERO,
                ZERO,
                ZERO,
                ZERO
            );

            expectGlobalIndicators(
                extractGlobalIndicators(afterDelegatePwIporGPR),
                BigNumber.from("39999999999999999900"),
                ZERO,
                BigNumber.from("25000000000000000062500000"),
                ZERO,
                -1,
                100000000
            );
            expectAccountIndicators(
                extractAccountIndicators(afterDelegatePwIporUPR),
                BigNumber.from("399999999999999999"),
                ZERO,
                stakedIpTokens,
                ZERO
            );

            expectGlobalIndicators(
                extractGlobalIndicators(afterStakeIpTokensGPR),
                BigNumber.from("198496250072115618100"),
                BigNumber.from("1000000000000000000"),
                BigNumber.from("5037878547512561444528052"),
                BigNumber.from("25000000000000000062500000"),
                -1,
                100000000
            );

            expectAccountIndicators(
                extractAccountIndicators(afterStakeIpTokensUPR),
                BigNumber.from("1984962500721156181"),
                BigNumber.from("25000000000000000062500000"),
                stakedIpTokens,
                delegatedIporToken
            );

            const rewards = await john.calculateAccountRewards(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );
            expect(rewards).to.be.equal(BigNumber.from("100000000000000000000"));

            expect(johnIpDaiBalanceAfter).to.be.equal(johnIpDaiBalanceBefore.add(stakedIpTokens));
            expect(powerIporIporTokenBalanceAfter).to.be.equal(
                powerIporIporTokenBalanceBefore.add(delegatedIporToken).add(N1__0_18DEC)
            );
        });

        it("Should sum of rewards for 3 account should be equal all rewards when all accounts staked ipTokens and Power Ipor Tokens ", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const johnIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(john.address);
            const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

            //    when
            // Admin
            await powerIpor.stake(delegatedIporToken);
            await john.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserOne
            await powerIpor.connect(userOne).stake(delegatedIporToken);
            await john.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);
            await powerIpor
                .connect(userOne)
                .delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserTwo
            await powerIpor.connect(userTwo).stake(delegatedIporToken);
            await john.connect(userTwo).stake(tokens.ipTokenDai.address, stakedIpTokens);
            await powerIpor
                .connect(userTwo)
                .delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            //    then

            const johnIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(john.address);
            const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

            const rewardsAdmin = await john.calculateAccountRewards(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );
            const rewardsUserOne = await john.calculateAccountRewards(
                await userOne.getAddress(),
                tokens.ipTokenDai.address
            );
            const rewardsUserTwo = await john.calculateAccountRewards(
                await userTwo.getAddress(),
                tokens.ipTokenDai.address
            );
            expect(rewardsAdmin.add(rewardsUserOne).add(rewardsUserTwo)).to.be.equal(
                BigNumber.from("305740747726576365693")
            );
            expect(johnIpDaiBalanceAfter).to.be.equal(
                johnIpDaiBalanceBefore.add(stakedIpTokens).add(stakedIpTokens).add(stakedIpTokens)
            );
            expect(powerIporIporTokenBalanceAfter).to.be.equal(
                powerIporIporTokenBalanceBefore
                    .add(delegatedIporToken)
                    .add(delegatedIporToken)
                    .add(delegatedIporToken)
                    .add(BigNumber.from("1259252273423634307"))
            );
        });

        it("Should count proper rewards when one account stake pwIpor tokens twice", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            //    when
            await powerIpor.stake(delegatedIporToken.mul(BigNumber.from("2")));
            await john.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterFirstStake = await john.calculateAccountRewards(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );

            await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);

            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterSecondStake = await john.calculateAccountRewards(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );
            //    then
            expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(rewardsAfterSecondStake).to.be.equal(BigNumber.from("100000000000000000000"));
        });

        it("Should recalculate global params when block rewards changed ", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            await powerIpor.stake(delegatedIporToken.mul(BigNumber.from("2")));
            await john.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const globalIndicatorsBefore = await john.getGlobalIndicators(
                tokens.ipTokenDai.address
            );

            //    when
            await john.setRewardsPerBlock(tokens.ipTokenDai.address, ZERO);

            // then
            const globalIndicatorsAfter = await john.getGlobalIndicators(tokens.ipTokenDai.address);

            expectGlobalIndicators(
                globalIndicatorsBefore,
                BigNumber.from("198496250072115618100"),
                BigNumber.from("1000000000000000000"),
                BigNumber.from("5037878547512561444528052"),
                BigNumber.from("25000000000000000062500000"),
                -1,
                100000000
            );
            expectGlobalIndicators(
                globalIndicatorsAfter,
                BigNumber.from("198496250072115618100"),
                BigNumber.from("102000000000000000000"),
                ZERO,
                BigNumber.from("533825733298768705959833252"),
                -1,
                0
            );
        });
    });
});
