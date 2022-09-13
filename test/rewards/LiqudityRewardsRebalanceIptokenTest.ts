import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityRewards, IporToken, PwIporToken } from "../../types";
import {
    Tokens,
    getDeployedTokens,
    extractGlobalParam,
    expectGlobalParam,
    expectUserParam,
    extractMyParam,
} from "../utils/LiquidityRewardsUtils";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

const randomAddress = "0x0B54FA10558caBBdd0D6df5b8667913C43567Bc5";

describe("LiquidityRewards Stake and balance", () => {
    let tokens: Tokens;
    let liquidityRewards: LiquidityRewards;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let iporToken: IporToken;
    let pwIporToken: PwIporToken;

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
        const PwIporToken = await hre.ethers.getContractFactory("PwIporToken");
        pwIporToken = (await upgrades.deployProxy(PwIporToken, [iporToken.address])) as PwIporToken;

        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            pwIporToken.address,
            iporToken.address,
        ])) as LiquidityRewards;

        await tokens.ipTokenDai.approve(liquidityRewards.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenDai
            .connect(userOne)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenDai
            .connect(userTwo)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_18_DECIMALS);

        await tokens.ipTokenUsdc.approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdc
            .connect(userOne)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdc
            .connect(userTwo)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);

        await tokens.ipTokenUsdt.approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdt
            .connect(userOne)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdt
            .connect(userTwo)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);

        await iporToken.approve(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.connect(userOne).approve(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);

        await iporToken.connect(userTwo).approve(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.transfer(
            await userOne.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await iporToken.transfer(
            await userTwo.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await iporToken.transfer(
            liquidityRewards.address,
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await pwIporToken.setLiquidityRewardsAddress(liquidityRewards.address);
    });

    describe("Rebalance on stake iToken", () => {
        it("Should setup usersParams and global params and returns 100 rewards when 100 blocks was mine", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const initGlobalParamResponse = await liquidityRewards.globalParams(
                tokens.ipTokenDai.address
            );
            const initUserParamResponse = await liquidityRewards.accountParams(
                tokens.ipTokenDai.address
            );
            expectGlobalParam(
                extractGlobalParam(initGlobalParamResponse),
                ZERO,
                ZERO,
                ZERO,
                ZERO,
                0,
                100000000
            );
            expectUserParam(extractMyParam(initUserParamResponse), ZERO, ZERO, ZERO, ZERO);

            await pwIporToken.stake(delegatedIporToken);
            await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);

            const afterDelegatePwTokenGPR = await liquidityRewards.globalParams(
                tokens.ipTokenDai.address
            );
            const afterDelegatePwTokenUPR = await liquidityRewards.accountParams(
                tokens.ipTokenDai.address
            );

            expectGlobalParam(
                extractGlobalParam(afterDelegatePwTokenGPR),
                ZERO,
                ZERO,
                ZERO,
                ZERO,
                0,
                100000000
            );
            expectUserParam(
                extractMyParam(afterDelegatePwTokenUPR),
                ZERO,
                ZERO,
                ZERO,
                delegatedIporToken
            );
            //    when
            await liquidityRewards.stake(tokens.ipTokenDai.address, stakedIpTokens);
            //    then
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const afterStakeIpTokensGPR = await liquidityRewards.globalParams(
                tokens.ipTokenDai.address
            );
            const afterStakeIpTokensUPR = await liquidityRewards.accountParams(
                tokens.ipTokenDai.address
            );

            expectGlobalParam(
                extractGlobalParam(afterStakeIpTokensGPR),
                BigNumber.from("140000000000000000000"),
                ZERO,
                BigNumber.from("7142857142857142857142857"),
                ZERO,
                -1,
                100000000
            );

            expectUserParam(
                extractMyParam(afterStakeIpTokensUPR),
                BigNumber.from("1400000000000000000"),
                ZERO,
                stakedIpTokens,
                delegatedIporToken
            );

            const rewards = await liquidityRewards.userRewards(tokens.ipTokenDai.address);
            expect(rewards).to.be.equal(BigNumber.from("100000000000000000000"));
        });

        it("Should sum of rewards for 3 users should be equal all rewards when all users staked ipTokens and pwTokens ", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            //    when
            // Admin
            await pwIporToken.stake(delegatedIporToken);
            await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);
            await liquidityRewards.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserOne
            await pwIporToken.connect(userOne).stake(delegatedIporToken);
            await pwIporToken
                .connect(userOne)
                .delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);
            await liquidityRewards
                .connect(userOne)
                .stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserTwo
            await pwIporToken.connect(userTwo).stake(delegatedIporToken);
            await pwIporToken
                .connect(userTwo)
                .delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);
            await liquidityRewards
                .connect(userTwo)
                .stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            //    then

            const rewardsAdmin = await liquidityRewards.userRewards(tokens.ipTokenDai.address);
            const rewardsUserOne = await liquidityRewards
                .connect(userOne)
                .userRewards(tokens.ipTokenDai.address);
            const rewardsUserTwo = await liquidityRewards
                .connect(userTwo)
                .userRewards(tokens.ipTokenDai.address);
            expect(rewardsAdmin.add(rewardsUserOne).add(rewardsUserTwo)).to.be.equal(
                BigNumber.from("305999999999999999999")
            );
        });

        it("Should count proper rewards when one user stake ipTokens twice", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            //    when
            await pwIporToken.stake(delegatedIporToken);
            await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);
            await liquidityRewards.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterFirstStake = await liquidityRewards.userRewards(
                tokens.ipTokenDai.address
            );

            await liquidityRewards.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterSecondStake = await liquidityRewards.userRewards(
                tokens.ipTokenDai.address
            );
            //    then
            expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(rewardsAfterSecondStake).to.be.equal(BigNumber.from("100000000000000000000"));
        });

        it("should should not be set new block reward when asset not active", async () => {
            //    given
            //    when
            await expect(
                liquidityRewards.setRewardsPerBlock(randomAddress, ZERO)
            ).to.be.revertedWith("IPOR_702");
        });

        it("Should recalculate global params when block rewards changed ", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));
            await pwIporToken.stake(delegatedIporToken);
            await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);
            await liquidityRewards.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const globalParamsBefore = await liquidityRewards.globalParams(
                tokens.ipTokenDai.address
            );

            //    when
            await liquidityRewards.setRewardsPerBlock(tokens.ipTokenDai.address, ZERO);

            // then
            const globalParamsAfter = await liquidityRewards.globalParams(
                tokens.ipTokenDai.address
            );

            expectGlobalParam(
                globalParamsBefore,
                BigNumber.from("140000000000000000000"),
                ZERO,
                BigNumber.from("7142857142857142857142857"),
                ZERO,
                -1,
                100000000
            );
            expectGlobalParam(
                globalParamsAfter,
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
            await pwIporToken.stake(delegatedIporToken);
            await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);
            await liquidityRewards.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const accruedRewardsBefore = await liquidityRewards.accruedRewards(
                tokens.ipTokenDai.address
            );
            const userRewardsBefore = await liquidityRewards.userRewards(tokens.ipTokenDai.address);

            //    when
            await liquidityRewards.setRewardsPerBlock(
                tokens.ipTokenDai.address,
                BigNumber.from("200000000")
            );
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // then
            const accruedRewardsAfter = await liquidityRewards.accruedRewards(
                tokens.ipTokenDai.address
            );
            const userRewardsAfter = await liquidityRewards.userRewards(tokens.ipTokenDai.address);

            expect(accruedRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(userRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(userRewardsAfter).to.be.equal(BigNumber.from("301000000000000000000"));
            expect(accruedRewardsAfter).to.be.equal(BigNumber.from("301000000000000000000"));
        });

        it("Should propre calculate reward when block rewards decrease", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));
            await pwIporToken.stake(delegatedIporToken);
            await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);
            await liquidityRewards.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const accruedRewardsBefore = await liquidityRewards.accruedRewards(
                tokens.ipTokenDai.address
            );
            const userRewardsBefore = await liquidityRewards.userRewards(tokens.ipTokenDai.address);

            //    when
            await liquidityRewards.setRewardsPerBlock(
                tokens.ipTokenDai.address,
                BigNumber.from("50000000")
            );
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // then
            const accruedRewardsAfter = await liquidityRewards.accruedRewards(
                tokens.ipTokenDai.address
            );
            const userRewardsAfter = await liquidityRewards.userRewards(tokens.ipTokenDai.address);

            expect(accruedRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(userRewardsBefore).to.be.equal(BigNumber.from("100000000000000000000"));
            expect(userRewardsAfter).to.be.equal(BigNumber.from("151000000000000000000"));
            expect(accruedRewardsAfter).to.be.equal(BigNumber.from("151000000000000000000"));
        });
    });
});
