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
            N1__0_18DEC.mul(BigNumber.from("100000"))
        );
        await pwIporToken.setLiquidityRewardsAddress(liquidityRewards.address);
    });

    describe("Rebalance on stake pwToken", () => {
        it("Should setup usersParams and global params and returns 100 rewards when 100 blocks was mine", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const initGlobalParamResponse = await liquidityRewards.getGlobalParams(
                tokens.ipTokenDai.address
            );
            const initUserParamResponse = await liquidityRewards.getMyParams(
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
            await liquidityRewards.stake(tokens.ipTokenDai.address, stakedIpTokens);

            const afterDelegatePwTokenGPR = await liquidityRewards.getGlobalParams(
                tokens.ipTokenDai.address
            );
            const afterDelegatePwTokenUPR = await liquidityRewards.getMyParams(
                tokens.ipTokenDai.address
            );

            expectGlobalParam(
                extractGlobalParam(afterDelegatePwTokenGPR),
                BigNumber.from("40000000000000000000"),
                ZERO,
                BigNumber.from("25000000000000000000000000"),
                ZERO,
                -1,
                100000000
            );
            expectUserParam(
                extractMyParam(afterDelegatePwTokenUPR),
                BigNumber.from("400000000000000000"),
                ZERO,
                stakedIpTokens,
                ZERO
            );
            //    when

            await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);

            //    then
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const afterStakeIpTokensGPR = await liquidityRewards.getGlobalParams(
                tokens.ipTokenDai.address
            );
            const afterStakeIpTokensUPR = await liquidityRewards.getMyParams(
                tokens.ipTokenDai.address
            );

            expectGlobalParam(
                extractGlobalParam(afterStakeIpTokensGPR),
                BigNumber.from("140000000000000000000"),
                BigNumber.from("1000000000000000000"),
                BigNumber.from("7142857142857142857142857"),
                BigNumber.from("25000000000000000000000000"),
                -1,
                100000000
            );

            expectUserParam(
                extractMyParam(afterStakeIpTokensUPR),
                BigNumber.from("1400000000000000000"),
                BigNumber.from("25000000000000000000000000"),
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
            await liquidityRewards.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserOne
            await pwIporToken.connect(userOne).stake(delegatedIporToken);
            await liquidityRewards
                .connect(userOne)
                .stake(tokens.ipTokenDai.address, stakedIpTokens);
            await pwIporToken
                .connect(userOne)
                .delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserTwo
            await pwIporToken.connect(userTwo).stake(delegatedIporToken);
            await liquidityRewards
                .connect(userTwo)
                .stake(tokens.ipTokenDai.address, stakedIpTokens);
            await pwIporToken
                .connect(userTwo)
                .delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);
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
                BigNumber.from("305652777777777777777") //TODO check it when we will get unstack ipToken
            );
        });

        it("Should count proper rewards when one user stake pwTokens twice", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            //    when
            await pwIporToken.stake(delegatedIporToken.mul(BigNumber.from("2")));
            await liquidityRewards.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterFirstStake = await liquidityRewards.userRewards(
                tokens.ipTokenDai.address
            );

            await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);

            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterSecondStake = await liquidityRewards.userRewards(
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

            await pwIporToken.stake(delegatedIporToken.mul(BigNumber.from("2")));
            await liquidityRewards.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await pwIporToken.delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const globalParamsBefore = await liquidityRewards.getGlobalParams(
                tokens.ipTokenDai.address
            );

            //    when
            await liquidityRewards.setRewardsPerBlock(tokens.ipTokenDai.address, ZERO);

            // then
            const globalParamsAfter = await liquidityRewards.getGlobalParams(
                tokens.ipTokenDai.address
            );

            expectGlobalParam(
                globalParamsBefore,
                BigNumber.from("140000000000000000000"),
                BigNumber.from("1000000000000000000"),
                BigNumber.from("7142857142857142857142857"),
                BigNumber.from("25000000000000000000000000"),
                -1,
                100000000
            );
            expectGlobalParam(
                globalParamsAfter,
                BigNumber.from("140000000000000000000"),
                BigNumber.from("102000000000000000000"),
                ZERO,
                BigNumber.from("746428571428571428571428557"),
                -1,
                0
            );
        });
    });
});