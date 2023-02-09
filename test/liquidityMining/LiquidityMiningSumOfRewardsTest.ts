import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockStakedToken, PowerToken } from "../../types";
import {
    Tokens,
    getDeployedTokens,
    extractGlobalIndicators,
    expectGlobalIndicators,
    expectAccountIndicators,
    extractAccountIndicators,
} from "../utils/LiquidityMiningUtils";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
    N1__0_8DEC,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

describe("LiquidityMining sum of rewards", () => {
    let tokens: Tokens;
    let liquidityMining: LiquidityMining;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let stakedToken: MockStakedToken;
    let powerToken: PowerToken;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const StakedToken = await hre.ethers.getContractFactory("MockStakedToken");
        stakedToken = (await StakedToken.deploy(
            "IPOR Token",
            "IPOR",
            await admin.getAddress()
        )) as MockStakedToken;
        const PowerToken = await hre.ethers.getContractFactory("PowerToken");
        powerToken = (await upgrades.deployProxy(PowerToken, [stakedToken.address])) as PowerToken;

        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
            powerToken.address,
            stakedToken.address,
        ])) as LiquidityMining;

        await liquidityMining.setRewardsPerBlock(tokens.lpTokenDai.address, N1__0_8DEC);
        await liquidityMining.setRewardsPerBlock(tokens.lpTokenUsdc.address, N1__0_8DEC);
        await liquidityMining.setRewardsPerBlock(tokens.lpTokenUsdt.address, N1__0_8DEC);

        await tokens.lpTokenDai.approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.lpTokenDai
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.lpTokenDai
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);

        await tokens.lpTokenUsdc.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdc
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdc
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);

        await tokens.lpTokenUsdt.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdt
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdt
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);

        await stakedToken.approve(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await stakedToken.connect(userOne).approve(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);

        await stakedToken.connect(userTwo).approve(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await stakedToken.transfer(
            await userOne.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await stakedToken.transfer(
            await userTwo.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await stakedToken.transfer(
            liquidityMining.address,
            N1__0_18DEC.mul(BigNumber.from("100000"))
        );
        await powerToken.setLiquidityMining(liquidityMining.address);
    });

    it("Should not claim when no stake lpTokens", async () => {
        //    given
        //    when
        await expect(liquidityMining.claim(tokens.lpTokenDai.address)).to.be.revertedWith("PT_709");
    });

    it("Should unstake all lpTokens", async () => {
        //    given
        const delegatedStakedToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

        await powerToken.connect(userOne).stake(delegatedStakedToken);

        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedStakedToken]);

        const pwTokenBalanceBefore = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await liquidityMining.connect(userOne).stake(tokens.lpTokenDai.address, stakedLpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const globalIndicatorsBefore = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenDai.address
        );
        const userParamsBefore = await liquidityMining.getAccountIndicators(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );
        const lpTokenBalanceBefore = await tokens.lpTokenDai.balanceOf(await userOne.getAddress());

        //    when
        await liquidityMining.connect(userOne).unstake(tokens.lpTokenDai.address, stakedLpTokens);

        //    then
        const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenDai.address
        );
        const userParamsAfter = await liquidityMining.getAccountIndicators(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );
        const lpTokenBalanceAfter = await tokens.lpTokenDai.balanceOf(await userOne.getAddress());

        const pwTokenBalanceAfter = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        expectGlobalIndicators(
            extractGlobalIndicators(globalIndicatorsBefore),
            BigNumber.from("272192809488736234700"),
            ZERO,
            BigNumber.from("3673866337168548782569648"),
            ZERO,
            -1,
            100000000
        );
        expectGlobalIndicators(
            extractGlobalIndicators(globalIndicatorsAfter),
            ZERO,
            BigNumber.from("101000000000000000000"),
            ZERO,
            BigNumber.from("371060500054023427039534448"),
            -1,
            100000000
        );

        expectAccountIndicators(
            extractAccountIndicators(userParamsBefore),
            BigNumber.from("2721928094887362347"),
            ZERO,
            BigNumber.from("100000000000000000000"),
            BigNumber.from("100000000000000000000")
        );

        expectAccountIndicators(
            extractAccountIndicators(userParamsAfter),
            ZERO, //powerUp
            BigNumber.from("371060500054023427039534448"), //Cumulative
            ZERO, // lpToken
            BigNumber.from("100000000000000000000") //pwToken
        );
        expect(lpTokenBalanceBefore).to.be.eq(BigNumber.from("999900000000000000000000"));
        expect(lpTokenBalanceAfter).to.be.eq(BigNumber.from("1000000000000000000000000"));
        expect(pwTokenBalanceBefore).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(pwTokenBalanceAfter).to.be.equal(BigNumber.from("201000000000000000000"));
    });

    it("Should unstake 3 users", async () => {
        //    given
        const delegatedStakedToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);

        // Admin
        await powerToken.stake(delegatedStakedToken);
        await powerToken.delegateToLiquidityMining(
            [tokens.lpTokenDai.address],
            [delegatedStakedToken]
        );
        await liquidityMining.stake(tokens.lpTokenDai.address, stakedLpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        // UserOne
        await powerToken.connect(userOne).stake(delegatedStakedToken);
        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedStakedToken]);
        await liquidityMining.connect(userOne).stake(tokens.lpTokenDai.address, stakedLpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        // UserTwo
        await powerToken.connect(userTwo).stake(delegatedStakedToken);
        await powerToken
            .connect(userTwo)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedStakedToken]);
        await liquidityMining.connect(userTwo).stake(tokens.lpTokenDai.address, stakedLpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when
        await liquidityMining.unstake(tokens.lpTokenDai.address, stakedLpTokens);
        await liquidityMining.connect(userOne).unstake(tokens.lpTokenDai.address, stakedLpTokens);
        await liquidityMining.connect(userTwo).unstake(tokens.lpTokenDai.address, stakedLpTokens);
        //    then
        const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenDai.address
        );
        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);

        expectGlobalIndicators(
            extractGlobalIndicators(globalIndicatorsAfter),
            ZERO,
            BigNumber.from("309000000000000000000"),
            ZERO,
            BigNumber.from("696809981949634752427376537"),
            -1,
            100000000
        );

        const rewardsAdmin = await liquidityMining.calculateAccountRewards(
            await admin.getAddress(),
            tokens.lpTokenDai.address
        );
        const rewardsUserOne = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );
        const rewardsUserTwo = await liquidityMining.calculateAccountRewards(
            await userTwo.getAddress(),
            tokens.lpTokenDai.address
        );
        expect(rewardsAdmin.add(rewardsUserOne).add(rewardsUserTwo)).to.be.equal(ZERO);

        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(liquidityMiningIpDaiBalanceBefore);
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(BigNumber.from("609000000000000000001"))
        );
    });

    it("Should unstake 3 users - DAI is not supported before unstake", async () => {
        //    given
        const delegatedStakedToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);

        // Admin
        await powerToken.stake(delegatedStakedToken);
        await powerToken.delegateToLiquidityMining(
            [tokens.lpTokenDai.address],
            [delegatedStakedToken]
        );
        await liquidityMining.stake(tokens.lpTokenDai.address, stakedLpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        // UserOne
        await powerToken.connect(userOne).stake(delegatedStakedToken);
        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedStakedToken]);
        await liquidityMining.connect(userOne).stake(tokens.lpTokenDai.address, stakedLpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        // UserTwo
        await powerToken.connect(userTwo).stake(delegatedStakedToken);
        await powerToken
            .connect(userTwo)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedStakedToken]);
        await liquidityMining.connect(userTwo).stake(tokens.lpTokenDai.address, stakedLpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //turn off support
        await liquidityMining.removeLpToken(tokens.lpTokenDai.address);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when
        await liquidityMining.unstake(tokens.lpTokenDai.address, stakedLpTokens);
        await liquidityMining.connect(userOne).unstake(tokens.lpTokenDai.address, stakedLpTokens);
        await liquidityMining.connect(userTwo).unstake(tokens.lpTokenDai.address, stakedLpTokens);
        //    then
        const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenDai.address
        );
        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);

        expectGlobalIndicators(
            extractGlobalIndicators(globalIndicatorsAfter),
            ZERO,
            BigNumber.from("307000000000000000000"),
            ZERO,
            BigNumber.from("691299182443881929253522065"),
            -1,
            0
        );

        const rewardsAdmin = await liquidityMining.calculateAccountRewards(
            await admin.getAddress(),
            tokens.lpTokenDai.address
        );
        const rewardsUserOne = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );
        const rewardsUserTwo = await liquidityMining.calculateAccountRewards(
            await userTwo.getAddress(),
            tokens.lpTokenDai.address
        );
        expect(rewardsAdmin.add(rewardsUserOne).add(rewardsUserTwo)).to.be.equal(ZERO);

        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(liquidityMiningIpDaiBalanceBefore);
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(BigNumber.from("607000000000000000001"))
        );
    });

    it("Should aggregate powerUp be equal zero", async () => {
        //    given
        const delegatedStakedToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);

        // Admin
        await powerToken.stake(delegatedStakedToken);
        await powerToken.delegateToLiquidityMining(
            [tokens.lpTokenDai.address],
            [delegatedStakedToken]
        );
        await liquidityMining.stake(
            tokens.lpTokenDai.address,
            N1__0_18DEC.mul(BigNumber.from("100"))
        );
        await hre.network.provider.send("hardhat_mine", ["0x20"]);
        await liquidityMining.stake(
            tokens.lpTokenDai.address,
            N1__0_18DEC.mul(BigNumber.from("20"))
        );
        await hre.network.provider.send("hardhat_mine", ["0x20"]);
        await liquidityMining.stake(
            tokens.lpTokenDai.address,
            N1__0_18DEC.mul(BigNumber.from("30"))
        );
        await hre.network.provider.send("hardhat_mine", ["0x20"]);

        // UserOne
        await powerToken.connect(userOne).stake(delegatedStakedToken);
        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedStakedToken]);
        await liquidityMining
            .connect(userOne)
            .stake(tokens.lpTokenDai.address, N1__0_18DEC.mul(BigNumber.from("100")));
        await hre.network.provider.send("hardhat_mine", ["0x20"]);

        await liquidityMining
            .connect(userOne)
            .stake(tokens.lpTokenDai.address, N1__0_18DEC.mul(BigNumber.from("30")));
        await hre.network.provider.send("hardhat_mine", ["0x20"]);
        await liquidityMining
            .connect(userOne)
            .stake(tokens.lpTokenDai.address, N1__0_18DEC.mul(BigNumber.from("20")));
        await hre.network.provider.send("hardhat_mine", ["0x20"]);

        // UserTwo
        await powerToken.connect(userTwo).stake(delegatedStakedToken);
        await powerToken
            .connect(userTwo)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedStakedToken]);
        await liquidityMining
            .connect(userTwo)
            .stake(tokens.lpTokenDai.address, N1__0_18DEC.mul(BigNumber.from("60")));
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await liquidityMining
            .connect(userTwo)
            .stake(tokens.lpTokenDai.address, N1__0_18DEC.mul(BigNumber.from("60")));
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await liquidityMining
            .connect(userTwo)
            .stake(tokens.lpTokenDai.address, N1__0_18DEC.mul(BigNumber.from("30")));
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when
        await liquidityMining.unstake(tokens.lpTokenDai.address, stakedLpTokens);
        await liquidityMining.unstake(
            tokens.lpTokenDai.address,
            N1__0_18DEC.mul(BigNumber.from("20"))
        );
        await liquidityMining.unstake(
            tokens.lpTokenDai.address,
            N1__0_18DEC.mul(BigNumber.from("30"))
        );
        await liquidityMining.connect(userOne).unstake(tokens.lpTokenDai.address, stakedLpTokens);
        await liquidityMining
            .connect(userOne)
            .unstake(tokens.lpTokenDai.address, N1__0_18DEC.mul(BigNumber.from("50")));
        await liquidityMining.connect(userTwo).unstake(tokens.lpTokenDai.address, stakedLpTokens);
        await liquidityMining
            .connect(userTwo)
            .unstake(tokens.lpTokenDai.address, N1__0_18DEC.mul(BigNumber.from("10")));
        await liquidityMining
            .connect(userTwo)
            .unstake(tokens.lpTokenDai.address, N1__0_18DEC.mul(BigNumber.from("20")));
        await liquidityMining
            .connect(userTwo)
            .unstake(tokens.lpTokenDai.address, N1__0_18DEC.mul(BigNumber.from("20")));
        //    then

        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(
            tokens.lpTokenDai.address
        );
        expect(extractGlobalIndicators(globalIndicatorsAfter).aggregatedPowerUp).to.be.equal(ZERO);
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(liquidityMiningIpDaiBalanceBefore);
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(BigNumber.from("812999999999999999999"))
        );
    });

    it("Should not add rewards when no lpToken was stake", async () => {
        //    given
        const delegatedStakedToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedLpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);

        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        await powerToken.connect(userOne).stake(delegatedStakedToken);
        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [delegatedStakedToken]);

        const pwTokenBalanceBefore = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await liquidityMining.connect(userOne).stake(tokens.lpTokenDai.address, stakedLpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await liquidityMining.connect(userOne).unstake(tokens.lpTokenDai.address, stakedLpTokens);

        const accruedRewardsAfter1Unstake = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const pwTokenBalanceAfter1Unstake = await powerToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsAfter1UnstakePlus100Mine =
            await liquidityMining.calculateAccruedRewards(tokens.lpTokenDai.address);
        await liquidityMining.connect(userOne).stake(tokens.lpTokenDai.address, stakedLpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await liquidityMining.connect(userOne).unstake(tokens.lpTokenDai.address, stakedLpTokens);
        const accruedRewardsAfter2Unstake = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const accruedRewardsAfter2UnstakePlus100Mine =
            await liquidityMining.calculateAccruedRewards(tokens.lpTokenDai.address);

        //    then

        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);
        const accountRewardsAfter = await liquidityMining.calculateAccountRewards(
            await admin.getAddress(),
            tokens.lpTokenDai.address
        );
        const pwTokenBalanceAfter = await powerToken
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

        expect(pwTokenBalanceBefore).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(pwTokenBalanceAfter1Unstake).to.be.equal(BigNumber.from("201000000000000000000"));
        expect(pwTokenBalanceAfter).to.be.equal(BigNumber.from("302000000000000000000"));
        expect(accountRewardsAfter).to.be.equal(ZERO);
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(liquidityMiningIpDaiBalanceBefore);
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(BigNumber.from("302").mul(N1__0_18DEC))
        );
    });
});
