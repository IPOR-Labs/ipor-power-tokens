import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { John, IporToken, PowerIpor } from "../../types";
import {
    Tokens,
    getDeployedTokens,
    extractGlobalIndicators,
    expectGlobalIndicators,
    expectAccountIndicators,
    extractAccountIndicators,
} from "../utils/JohnUtils";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

const randomAddress = "0x0B54FA10558caBBdd0D6df5b8667913C43567Bc5";

describe("John Stake and balance", () => {
    let tokens: Tokens;
    let john: John;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let adminAddress: string, userOneAddress: string, userTwoAddress: string;
    let iporToken: IporToken;
    let powerIpor: PowerIpor;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();
        adminAddress = await admin.getAddress();
        userOneAddress = await userOne.getAddress();
        userTwoAddress = await userTwo.getAddress();

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
        await iporToken.transfer(john.address, N1__0_18DEC.mul(BigNumber.from("10000")));
        await powerIpor.setJohn(john.address);
    });

    describe("Rebalance on stake iToken", () => {
        it("Should setup usersParams and global params and returns 100 rewards when 100 blocks was mine", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const initGlobalParamResponse = await john.getGlobalIndicators(
                tokens.ipTokenDai.address
            );
            const initUserParamResponse = await john.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );
            expectGlobalIndicators(
                extractGlobalIndicators(initGlobalParamResponse),
                ZERO,
                ZERO,
                ZERO,
                ZERO,
                0,
                100000000
            );
            expectAccountIndicators(
                extractAccountIndicators(initUserParamResponse),
                ZERO,
                ZERO,
                ZERO,
                ZERO
            );

            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);

            const afterDelegatePwIporGPR = await john.getGlobalIndicators(
                tokens.ipTokenDai.address
            );
            const afterDelegatePwIporUPR = await john.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );

            expectGlobalIndicators(
                extractGlobalIndicators(afterDelegatePwIporGPR),
                ZERO,
                ZERO,
                ZERO,
                ZERO,
                0,
                100000000
            );
            expectAccountIndicators(
                extractAccountIndicators(afterDelegatePwIporUPR),
                ZERO,
                ZERO,
                ZERO,
                delegatedIporToken
            );
            //    when
            await john.stake(tokens.ipTokenDai.address, stakedIpTokens);
            //    then
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const afterStakeIpTokensGPR = await john.getGlobalIndicators(tokens.ipTokenDai.address);
            const afterStakeIpTokensUPR = await john.getAccountIndicators(
                await admin.getAddress(),
                tokens.ipTokenDai.address
            );

            expectGlobalIndicators(
                extractGlobalIndicators(afterStakeIpTokensGPR),
                BigNumber.from("140000000000000000000"),
                ZERO,
                BigNumber.from("7142857142857142857142857"),
                ZERO,
                -1,
                100000000
            );

            expectAccountIndicators(
                extractAccountIndicators(afterStakeIpTokensUPR),
                BigNumber.from("1400000000000000000"),
                ZERO,
                stakedIpTokens,
                delegatedIporToken
            );

            const rewards = await john.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );
            expect(rewards).to.be.equal(BigNumber.from("100000000000000000000"));
        });

        it("Should sum of rewards for 3 users should be equal all rewards when all users staked ipTokens and pwIpor tokens ", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            //    when
            // Admin
            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await john.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserOne
            await powerIpor.connect(userOne).stake(delegatedIporToken);
            await powerIpor
                .connect(userOne)
                .delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await john.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserTwo
            await powerIpor.connect(userTwo).stake(delegatedIporToken);
            await powerIpor
                .connect(userTwo)
                .delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await john.connect(userTwo).stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            //    then
            const rewardsAdmin = await john.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );
            const rewardsUserOne = await john.calculateAccountRewards(
                userOneAddress,
                tokens.ipTokenDai.address
            );
            const rewardsUserTwo = await john.calculateAccountRewards(
                userTwoAddress,
                tokens.ipTokenDai.address
            );
            expect(rewardsAdmin.add(rewardsUserOne).add(rewardsUserTwo)).to.be.equal(
                BigNumber.from("305999999999999999999")
            );
        });

        it("Should count proper rewards when one user stake ipTokens twice", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            //    when
            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await john.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterFirstStake = await john.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );

            await john.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterSecondStake = await john.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );
            //    then
            expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(rewardsAfterSecondStake).to.be.equal(BigNumber.from("100000000000000000000"));
        });

        it("should not be able to set new block reward when asset not active", async () => {
            //    given
            //    when
            await expect(john.setRewardsPerBlock(randomAddress, ZERO)).to.be.revertedWith(
                "IPOR_701"
            );
        });

        it("Should recalculate global params when block rewards changed ", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));
            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await john.stake(tokens.ipTokenDai.address, stakedIpTokens);
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
                BigNumber.from("140000000000000000000"),
                ZERO,
                BigNumber.from("7142857142857142857142857"),
                ZERO,
                -1,
                100000000
            );
            expectGlobalIndicators(
                globalIndicatorsAfter,
                BigNumber.from("140000000000000000000"),
                BigNumber.from("101000000000000000000"),
                ZERO,
                BigNumber.from("721428571428571428571428557"),
                -1,
                0
            );
        });

        it("Should propre calculate reward when block rewards increase", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));
            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await john.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const accruedRewardsBefore = await john.calculateAccruedRewards(
                tokens.ipTokenDai.address
            );
            const accountRewardsBefore = await john.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );

            //    when
            await john.setRewardsPerBlock(tokens.ipTokenDai.address, BigNumber.from("200000000"));
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // then
            const accruedRewardsAfter = await john.calculateAccruedRewards(
                tokens.ipTokenDai.address
            );
            const accountRewardsAfter = await john.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );

            expect(accruedRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(accountRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(accountRewardsAfter).to.be.equal(BigNumber.from("301000000000000000000"));
            expect(accruedRewardsAfter).to.be.equal(BigNumber.from("301000000000000000000"));
        });

        it("Should propre calculate reward when block rewards decrease", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));
            await powerIpor.stake(delegatedIporToken);
            await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await john.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const accruedRewardsBefore = await john.calculateAccruedRewards(
                tokens.ipTokenDai.address
            );
            const accountRewardsBefore = await john.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );

            //    when
            await john.setRewardsPerBlock(tokens.ipTokenDai.address, BigNumber.from("50000000"));
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // then
            const accruedRewardsAfter = await john.calculateAccruedRewards(
                tokens.ipTokenDai.address
            );
            const accountRewardsAfter = await john.calculateAccountRewards(
                adminAddress,
                tokens.ipTokenDai.address
            );

            expect(accruedRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(accountRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(accountRewardsAfter).to.be.equal(BigNumber.from("151000000000000000000"));
            expect(accruedRewardsAfter).to.be.equal(BigNumber.from("151000000000000000000"));
        });
    });
});
