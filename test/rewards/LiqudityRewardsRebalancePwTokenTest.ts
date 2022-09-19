import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { John, IporToken, PwIporToken } from "../../types";
import {
    Tokens,
    getDeployedTokens,
    extractGlobalParam,
    expectGlobalParam,
    expectUserParam,
    extractMyParam,
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

        const John = await hre.ethers.getContractFactory("John");
        john = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            pwIporToken.address,
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
        await iporToken.transfer(john.address, N1__0_18DEC.mul(BigNumber.from("100000")));
        await pwIporToken.setJohn(john.address);
    });

    describe("Rebalance on stake pwToken", () => {
        it("Should setup usersParams and global params and returns 100 rewards when 100 blocks was mine", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            const initGlobalParamResponse = await john.getGlobalParams(tokens.ipTokenDai.address);
            const initUserParamResponse = await john.getAccountParams(tokens.ipTokenDai.address);
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
            await john.stake(tokens.ipTokenDai.address, stakedIpTokens);

            const afterDelegatePwTokenGPR = await john.getGlobalParams(tokens.ipTokenDai.address);
            const afterDelegatePwTokenUPR = await john.getAccountParams(tokens.ipTokenDai.address);

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

            await pwIporToken.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);

            //    then
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const afterStakeIpTokensGPR = await john.getGlobalParams(tokens.ipTokenDai.address);
            const afterStakeIpTokensUPR = await john.getAccountParams(tokens.ipTokenDai.address);

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

            const rewards = await john.calculateAccountRewards(tokens.ipTokenDai.address);
            expect(rewards).to.be.equal(BigNumber.from("100000000000000000000"));
        });

        it("Should sum of rewards for 3 users should be equal all rewards when all users staked ipTokens and pwTokens ", async () => {
            //    given
            const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
            const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

            //    when
            // Admin
            await pwIporToken.stake(delegatedIporToken);
            await john.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await pwIporToken.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserOne
            await pwIporToken.connect(userOne).stake(delegatedIporToken);
            await john.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);
            await pwIporToken
                .connect(userOne)
                .delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            // UserTwo
            await pwIporToken.connect(userTwo).stake(delegatedIporToken);
            await john.connect(userTwo).stake(tokens.ipTokenDai.address, stakedIpTokens);
            await pwIporToken
                .connect(userTwo)
                .delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            //    then

            const rewardsAdmin = await john.calculateAccountRewards(tokens.ipTokenDai.address);
            const rewardsUserOne = await john
                .connect(userOne)
                .calculateAccountRewards(tokens.ipTokenDai.address);
            const rewardsUserTwo = await john
                .connect(userTwo)
                .calculateAccountRewards(tokens.ipTokenDai.address);
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
            await john.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await pwIporToken.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterFirstStake = await john.calculateAccountRewards(
                tokens.ipTokenDai.address
            );

            await pwIporToken.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);

            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            const rewardsAfterSecondStake = await john.calculateAccountRewards(
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
            await john.stake(tokens.ipTokenDai.address, stakedIpTokens);
            await pwIporToken.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            const globalParamsBefore = await john.getGlobalParams(tokens.ipTokenDai.address);

            //    when
            await john.setRewardsPerBlock(tokens.ipTokenDai.address, ZERO);

            // then
            const globalParamsAfter = await john.getGlobalParams(tokens.ipTokenDai.address);

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
