import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockIporToken, PowerIpor } from "../../types";
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
    let iporToken: MockIporToken;
    let powerIpor: PowerIpor;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const IporToken = await hre.ethers.getContractFactory("MockIporToken");
        iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await admin.getAddress()
        )) as MockIporToken;
        const PowerIpor = await hre.ethers.getContractFactory("PowerIpor");
        powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;

        const LiquidityMining = await hre.ethers.getContractFactory("LiquidityMining");
        liquidityMining = (await upgrades.deployProxy(LiquidityMining, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as LiquidityMining;

        await liquidityMining.setRewardsPerBlock(tokens.ipTokenDai.address, N1__0_8DEC);
        await liquidityMining.setRewardsPerBlock(tokens.ipTokenUsdc.address, N1__0_8DEC);
        await liquidityMining.setRewardsPerBlock(tokens.ipTokenUsdt.address, N1__0_8DEC);

        await tokens.ipTokenDai.approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenDai
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenDai
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);

        await tokens.ipTokenUsdc.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdc
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdc
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);

        await tokens.ipTokenUsdt.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdt
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdt
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);

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
        await iporToken.transfer(
            liquidityMining.address,
            N1__0_18DEC.mul(BigNumber.from("100000"))
        );
        await powerIpor.setLiquidityMining(liquidityMining.address);
    });

    it("Should not claim when no stake ipTokens", async () => {
        //    given
        //    when
        await expect(liquidityMining.claim(tokens.ipTokenDai.address)).to.be.revertedWith(
            "IPOR_709"
        );
    });

    it("Should unstake all ipTokens", async () => {
        //    given
        const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

        await powerIpor.connect(userOne).stake(delegatedIporToken);

        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedIporToken]);

        const pwIporBalanceBefore = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await liquidityMining.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const globalIndicatorsBefore = await liquidityMining.getGlobalIndicators(
            tokens.ipTokenDai.address
        );
        const userParamsBefore = await liquidityMining.getAccountIndicators(
            await userOne.getAddress(),
            tokens.ipTokenDai.address
        );
        const ipTokenBalanceBefore = await tokens.ipTokenDai.balanceOf(await userOne.getAddress());

        //    when
        await liquidityMining.connect(userOne).unstake(tokens.ipTokenDai.address, stakedIpTokens);

        //    then
        const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(
            tokens.ipTokenDai.address
        );
        const userParamsAfter = await liquidityMining.getAccountIndicators(
            await userOne.getAddress(),
            tokens.ipTokenDai.address
        );
        const ipTokenBalanceAfter = await tokens.ipTokenDai.balanceOf(await userOne.getAddress());

        const pwIporBalanceAfter = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        expectGlobalIndicators(
            extractGlobalIndicators(globalIndicatorsBefore),
            BigNumber.from("198496250072115618100"),
            ZERO,
            BigNumber.from("5037878547512561444528052"),
            ZERO,
            -1,
            100000000
        );
        expectGlobalIndicators(
            extractGlobalIndicators(globalIndicatorsAfter),
            ZERO,
            BigNumber.from("101000000000000000000"),
            ZERO,
            BigNumber.from("508825733298768705897333252"),
            -1,
            100000000
        );

        expectAccountIndicators(
            extractAccountIndicators(userParamsBefore),
            BigNumber.from("1984962500721156181"),
            ZERO,
            BigNumber.from("100000000000000000000"),
            BigNumber.from("100000000000000000000")
        );

        expectAccountIndicators(
            extractAccountIndicators(userParamsAfter),
            ZERO, //powerUp
            BigNumber.from("508825733298768705897333252"), //Cumulative
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

        const liquidityMiningIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

        // Admin
        await powerIpor.stake(delegatedIporToken);
        await powerIpor.delegateToLiquidityMining(
            [tokens.ipTokenDai.address],
            [delegatedIporToken]
        );
        await liquidityMining.stake(tokens.ipTokenDai.address, stakedIpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        // UserOne
        await powerIpor.connect(userOne).stake(delegatedIporToken);
        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedIporToken]);
        await liquidityMining.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        // UserTwo
        await powerIpor.connect(userTwo).stake(delegatedIporToken);
        await powerIpor
            .connect(userTwo)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedIporToken]);
        await liquidityMining.connect(userTwo).stake(tokens.ipTokenDai.address, stakedIpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when
        await liquidityMining.unstake(tokens.ipTokenDai.address, stakedIpTokens);
        await liquidityMining.connect(userOne).unstake(tokens.ipTokenDai.address, stakedIpTokens);
        await liquidityMining.connect(userTwo).unstake(tokens.ipTokenDai.address, stakedIpTokens);
        //    then
        const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(
            tokens.ipTokenDai.address
        );
        const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

        expectGlobalIndicators(
            extractGlobalIndicators(globalIndicatorsAfter),
            ZERO,
            BigNumber.from("309000000000000000000"),
            ZERO,
            BigNumber.from("955517631178215820645487196"),
            -1,
            100000000
        );

        const rewardsAdmin = await liquidityMining.calculateAccountRewards(
            await admin.getAddress(),
            tokens.ipTokenDai.address
        );
        const rewardsUserOne = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.ipTokenDai.address
        );
        const rewardsUserTwo = await liquidityMining.calculateAccountRewards(
            await userTwo.getAddress(),
            tokens.ipTokenDai.address
        );
        expect(rewardsAdmin.add(rewardsUserOne).add(rewardsUserTwo)).to.be.equal(ZERO);

        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(liquidityMiningIpDaiBalanceBefore);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(BigNumber.from("609000000000000000001"))
        );
    });

    it("Should unstake 3 users - DAI is not supported before unstake", async () => {
        //    given
        const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

        const liquidityMiningIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

        // Admin
        await powerIpor.stake(delegatedIporToken);
        await powerIpor.delegateToLiquidityMining(
            [tokens.ipTokenDai.address],
            [delegatedIporToken]
        );
        await liquidityMining.stake(tokens.ipTokenDai.address, stakedIpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        // UserOne
        await powerIpor.connect(userOne).stake(delegatedIporToken);
        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedIporToken]);
        await liquidityMining.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        // UserTwo
        await powerIpor.connect(userTwo).stake(delegatedIporToken);
        await powerIpor
            .connect(userTwo)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedIporToken]);
        await liquidityMining.connect(userTwo).stake(tokens.ipTokenDai.address, stakedIpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //turn off support
        await liquidityMining.removeIpTokenAsset(tokens.ipTokenDai.address);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when
        await liquidityMining.unstake(tokens.ipTokenDai.address, stakedIpTokens);
        await liquidityMining.connect(userOne).unstake(tokens.ipTokenDai.address, stakedIpTokens);
        await liquidityMining.connect(userTwo).unstake(tokens.ipTokenDai.address, stakedIpTokens);
        //    then
        const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(
            tokens.ipTokenDai.address
        );
        const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

        expectGlobalIndicators(
            extractGlobalIndicators(globalIndicatorsAfter),
            ZERO,
            BigNumber.from("307000000000000000000"),
            ZERO,
            BigNumber.from("947960813356946978478695118"),
            -1,
            0
        );

        const rewardsAdmin = await liquidityMining.calculateAccountRewards(
            await admin.getAddress(),
            tokens.ipTokenDai.address
        );
        const rewardsUserOne = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.ipTokenDai.address
        );
        const rewardsUserTwo = await liquidityMining.calculateAccountRewards(
            await userTwo.getAddress(),
            tokens.ipTokenDai.address
        );
        expect(rewardsAdmin.add(rewardsUserOne).add(rewardsUserTwo)).to.be.equal(ZERO);

        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(liquidityMiningIpDaiBalanceBefore);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(BigNumber.from("607000000000000000001"))
        );
    });

    it("Should aggregate powerUp be equal zero", async () => {
        //    given
        const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

        const liquidityMiningIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

        // Admin
        await powerIpor.stake(delegatedIporToken);
        await powerIpor.delegateToLiquidityMining(
            [tokens.ipTokenDai.address],
            [delegatedIporToken]
        );
        await liquidityMining.stake(
            tokens.ipTokenDai.address,
            N1__0_18DEC.mul(BigNumber.from("100"))
        );
        await hre.network.provider.send("hardhat_mine", ["0x20"]);
        await liquidityMining.stake(
            tokens.ipTokenDai.address,
            N1__0_18DEC.mul(BigNumber.from("20"))
        );
        await hre.network.provider.send("hardhat_mine", ["0x20"]);
        await liquidityMining.stake(
            tokens.ipTokenDai.address,
            N1__0_18DEC.mul(BigNumber.from("30"))
        );
        await hre.network.provider.send("hardhat_mine", ["0x20"]);

        // UserOne
        await powerIpor.connect(userOne).stake(delegatedIporToken);
        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedIporToken]);
        await liquidityMining
            .connect(userOne)
            .stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("100")));
        await hre.network.provider.send("hardhat_mine", ["0x20"]);

        await liquidityMining
            .connect(userOne)
            .stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("30")));
        await hre.network.provider.send("hardhat_mine", ["0x20"]);
        await liquidityMining
            .connect(userOne)
            .stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("20")));
        await hre.network.provider.send("hardhat_mine", ["0x20"]);

        // UserTwo
        await powerIpor.connect(userTwo).stake(delegatedIporToken);
        await powerIpor
            .connect(userTwo)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedIporToken]);
        await liquidityMining
            .connect(userTwo)
            .stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("60")));
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await liquidityMining
            .connect(userTwo)
            .stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("60")));
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await liquidityMining
            .connect(userTwo)
            .stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("30")));
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when
        await liquidityMining.unstake(tokens.ipTokenDai.address, stakedIpTokens);
        await liquidityMining.unstake(
            tokens.ipTokenDai.address,
            N1__0_18DEC.mul(BigNumber.from("20"))
        );
        await liquidityMining.unstake(
            tokens.ipTokenDai.address,
            N1__0_18DEC.mul(BigNumber.from("30"))
        );
        await liquidityMining.connect(userOne).unstake(tokens.ipTokenDai.address, stakedIpTokens);
        await liquidityMining
            .connect(userOne)
            .unstake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("50")));
        await liquidityMining.connect(userTwo).unstake(tokens.ipTokenDai.address, stakedIpTokens);
        await liquidityMining
            .connect(userTwo)
            .unstake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("10")));
        await liquidityMining
            .connect(userTwo)
            .unstake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("20")));
        await liquidityMining
            .connect(userTwo)
            .unstake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("20")));
        //    then

        const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(
            tokens.ipTokenDai.address
        );
        expect(extractGlobalIndicators(globalIndicatorsAfter).aggregatedPowerUp).to.be.equal(ZERO);
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(liquidityMiningIpDaiBalanceBefore);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(BigNumber.from("813000000000000000001"))
        );
    });

    it("Should not add rewards when no ipToken was stake", async () => {
        //    given
        const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

        const liquidityMiningIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(
            tokens.ipTokenDai.address
        );
        await powerIpor.connect(userOne).stake(delegatedIporToken);
        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.ipTokenDai.address], [delegatedIporToken]);

        const pwIporBalanceBefore = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await liquidityMining.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await liquidityMining.connect(userOne).unstake(tokens.ipTokenDai.address, stakedIpTokens);

        const accruedRewardsAfter1Unstake = await liquidityMining.calculateAccruedRewards(
            tokens.ipTokenDai.address
        );
        const pwIporBalanceAfter1Unstake = await powerIpor
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsAfter1UnstakePlus100Mine =
            await liquidityMining.calculateAccruedRewards(tokens.ipTokenDai.address);
        await liquidityMining.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await liquidityMining.connect(userOne).unstake(tokens.ipTokenDai.address, stakedIpTokens);
        const accruedRewardsAfter2Unstake = await liquidityMining.calculateAccruedRewards(
            tokens.ipTokenDai.address
        );

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const accruedRewardsAfter2UnstakePlus100Mine =
            await liquidityMining.calculateAccruedRewards(tokens.ipTokenDai.address);

        //    then

        const liquidityMiningIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const accountRewardsAfter = await liquidityMining.calculateAccountRewards(
            await admin.getAddress(),
            tokens.ipTokenDai.address
        );
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
        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(liquidityMiningIpDaiBalanceBefore);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(BigNumber.from("302").mul(N1__0_18DEC))
        );
    });
});
