import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { John, IporToken, PowerIpor } from "../../types";
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

describe("John claim", () => {
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

    it("Should not claim when no stake ipTokens", async () => {
        //    given
        //    when
        await expect(john.claim(tokens.ipTokenDai.address)).to.be.revertedWith("IPOR_708");
    });

    it("Should unstake all ipTokens", async () => {
        //    given
        const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

        await powerIpor.connect(userOne).stake(delegatedIporToken);

        await powerIpor
            .connect(userOne)
            .delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);

        const pwIporBalanceBefore = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await john.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const globalParamsBefore = await john.getGlobalParams(tokens.ipTokenDai.address);
        const userParamsBefore = await john
            .connect(userOne)
            .getAccountParams(tokens.ipTokenDai.address);
        const ipTokenBalanceBefore = await tokens.ipTokenDai.balanceOf(await userOne.getAddress());
        //    when
        await john.connect(userOne).unstake(tokens.ipTokenDai.address, stakedIpTokens);
        //    then
        const globalParamsAfter = await john.getGlobalParams(tokens.ipTokenDai.address);
        const userParamsAfter = await john
            .connect(userOne)
            .getAccountParams(tokens.ipTokenDai.address);
        const ipTokenBalanceAfter = await tokens.ipTokenDai.balanceOf(await userOne.getAddress());

        const pwIporBalanceAfter = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        expectGlobalParam(
            extractGlobalParam(globalParamsBefore),
            BigNumber.from("140000000000000000000"),
            ZERO,
            BigNumber.from("7142857142857142857142857"),
            ZERO,
            -1,
            100000000
        );
        expectGlobalParam(
            extractGlobalParam(globalParamsAfter),
            ZERO,
            BigNumber.from("101000000000000000000"),
            ZERO,
            BigNumber.from("721428571428571428571428557"),
            -1,
            100000000
        );

        expectUserParam(
            extractMyParam(userParamsBefore),
            BigNumber.from("1400000000000000000"),
            ZERO,
            BigNumber.from("100000000000000000000"),
            BigNumber.from("100000000000000000000")
        );

        expectUserParam(
            extractMyParam(userParamsAfter),
            ZERO, //powerUp
            BigNumber.from("721428571428571428571428557"), //Cumulative
            ZERO, // ipToken
            BigNumber.from("100000000000000000000") //pwIpor
        );
        expect(ipTokenBalanceBefore).to.be.eq(BigNumber.from("999900000000000000000000"));
        expect(ipTokenBalanceAfter).to.be.eq(BigNumber.from("1000000000000000000000000"));
        expect(pwIporBalanceBefore).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(pwIporBalanceAfter).to.be.equal(BigNumber.from("201000000000000000000"));
    });

    it("Should unstake 3 users", async () => {
        //    given
        const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

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

        //    when
        await john.unstake(tokens.ipTokenDai.address, stakedIpTokens);
        await john.connect(userOne).unstake(tokens.ipTokenDai.address, stakedIpTokens);
        await john.connect(userTwo).unstake(tokens.ipTokenDai.address, stakedIpTokens);
        //    then
        const globalParamsAfter = await john.getGlobalParams(tokens.ipTokenDai.address);
        expectGlobalParam(
            extractGlobalParam(globalParamsAfter),
            ZERO,
            BigNumber.from("309000000000000000000"),
            ZERO,
            BigNumber.from("1354761904761904761904761896"),
            -1,
            100000000
        );

        const rewardsAdmin = await john.calculateAccountRewards(tokens.ipTokenDai.address);
        const rewardsUserOne = await john
            .connect(userOne)
            .calculateAccountRewards(tokens.ipTokenDai.address);
        const rewardsUserTwo = await john
            .connect(userTwo)
            .calculateAccountRewards(tokens.ipTokenDai.address);
        expect(rewardsAdmin.add(rewardsUserOne).add(rewardsUserTwo)).to.be.equal(ZERO);
    });

    it("Should aggregate powerUp should be zero", async () => {
        //    given
        const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

        // Admin
        await powerIpor.stake(delegatedIporToken);
        await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
        await john.stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("100")));
        await hre.network.provider.send("hardhat_mine", ["0x20"]);
        await john.stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("20")));
        await hre.network.provider.send("hardhat_mine", ["0x20"]);
        await john.stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("30")));
        await hre.network.provider.send("hardhat_mine", ["0x20"]);

        // UserOne
        await powerIpor.connect(userOne).stake(delegatedIporToken);
        await powerIpor
            .connect(userOne)
            .delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
        await john
            .connect(userOne)
            .stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("100")));
        await hre.network.provider.send("hardhat_mine", ["0x20"]);

        await john
            .connect(userOne)
            .stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("30")));
        await hre.network.provider.send("hardhat_mine", ["0x20"]);
        await john
            .connect(userOne)
            .stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("20")));
        await hre.network.provider.send("hardhat_mine", ["0x20"]);

        // UserTwo
        await powerIpor.connect(userTwo).stake(delegatedIporToken);
        await powerIpor
            .connect(userTwo)
            .delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);
        await john
            .connect(userTwo)
            .stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("60")));
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await john
            .connect(userTwo)
            .stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("60")));
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await john
            .connect(userTwo)
            .stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("30")));
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when
        await john.unstake(tokens.ipTokenDai.address, stakedIpTokens);
        await john.unstake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("20")));
        await john.unstake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("30")));
        await john.connect(userOne).unstake(tokens.ipTokenDai.address, stakedIpTokens);
        await john
            .connect(userOne)
            .unstake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("50")));
        await john.connect(userTwo).unstake(tokens.ipTokenDai.address, stakedIpTokens);
        await john
            .connect(userTwo)
            .unstake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("10")));
        await john
            .connect(userTwo)
            .unstake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("20")));
        await john
            .connect(userTwo)
            .unstake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("20")));
        //    then
        const globalParamsAfter = await john.getGlobalParams(tokens.ipTokenDai.address);
        expect(extractGlobalParam(globalParamsAfter).aggregatedPowerUp).to.be.equal(ZERO);
    });

    it("Should not add rewards when no ipToken was stake", async () => {
        //    given
        const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

        const accruedRewardsBefore = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
        await powerIpor.connect(userOne).stake(delegatedIporToken);
        await powerIpor
            .connect(userOne)
            .delegateToJohn([tokens.ipTokenDai.address], [delegatedIporToken]);

        const pwIporBalanceBefore = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await john.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await john.connect(userOne).unstake(tokens.ipTokenDai.address, stakedIpTokens);

        const accruedRewardsAfter1Unstake = await john.calculateAccruedRewards(
            tokens.ipTokenDai.address
        );
        const pwIporBalanceAfter1Unstake = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsAfter1UnstakePlus100Mine = await john.calculateAccruedRewards(
            tokens.ipTokenDai.address
        );
        await john.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await john.connect(userOne).unstake(tokens.ipTokenDai.address, stakedIpTokens);
        const accruedRewardsAfter2Unstake = await john.calculateAccruedRewards(
            tokens.ipTokenDai.address
        );

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const accruedRewardsAfter2UnstakePlus100Mine = await john.calculateAccruedRewards(
            tokens.ipTokenDai.address
        );

        //    then

        const accountRewardsAfter = await john.calculateAccountRewards(tokens.ipTokenDai.address);
        const pwIporBalanceAfter = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(accruedRewardsAfter1Unstake).to.be.equal(BigNumber.from("101000000000000000000"));
        expect(accruedRewardsAfter1UnstakePlus100Mine).to.be.equal(
            BigNumber.from("101000000000000000000")
        );
        expect(accruedRewardsAfter2Unstake).to.be.equal(BigNumber.from("202000000000000000000"));
        expect(accruedRewardsAfter2UnstakePlus100Mine).to.be.equal(
            BigNumber.from("202000000000000000000")
        );

        expect(pwIporBalanceBefore).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(pwIporBalanceAfter1Unstake).to.be.equal(BigNumber.from("201000000000000000000"));
        expect(pwIporBalanceAfter).to.be.equal(BigNumber.from("302000000000000000000"));
        expect(accountRewardsAfter).to.be.equal(ZERO);
    });
});
