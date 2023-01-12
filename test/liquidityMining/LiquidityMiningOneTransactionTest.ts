import hre, { upgrades, network } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import {
    LiquidityMining,
    MockStakedToken,
    PowerToken,
    LiquidityRewardsTestAction,
    LiquidityRewardsAgent,
} from "../../types";
import {
    Tokens,
    getDeployedTokens,
    expectAccountIndicators,
    extractAccountIndicators,
} from "../utils/LiquidityMiningUtils";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    USD_1_000_000,
    N0__1_18DEC,
    N2__0_18DEC,
    N1__0_8DEC,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

describe("One block/Transaction tests", () => {
    let tokens: Tokens;
    let liquidityMining: LiquidityMining;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let stakedToken: MockStakedToken;
    let powerToken: PowerToken;
    let liquidityRewardsTestAction: LiquidityRewardsTestAction;
    let agent1: LiquidityRewardsAgent, agent2: LiquidityRewardsAgent;

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

        const LiquidityRewardsTestAction = await hre.ethers.getContractFactory(
            "LiquidityRewardsTestAction"
        );
        liquidityRewardsTestAction =
            (await LiquidityRewardsTestAction.deploy()) as LiquidityRewardsTestAction;

        const LiquidityRewardsAgent = await hre.ethers.getContractFactory("LiquidityRewardsAgent");
        agent1 = (await LiquidityRewardsAgent.deploy(
            powerToken.address,
            liquidityMining.address,
            tokens.lpTokenDai.address,
            stakedToken.address
        )) as LiquidityRewardsAgent;
        agent2 = (await LiquidityRewardsAgent.deploy(
            powerToken.address,
            liquidityMining.address,
            tokens.lpTokenDai.address,
            stakedToken.address
        )) as LiquidityRewardsAgent;

        await stakedToken.transfer(agent1.address, N1__0_18DEC.mul(BigNumber.from("10000")));
        await stakedToken.transfer(agent2.address, N1__0_18DEC.mul(BigNumber.from("10000")));
        await stakedToken.transfer(
            liquidityMining.address,
            N1__0_18DEC.mul(BigNumber.from("100000"))
        );

        await tokens.lpTokenDai.mint(agent1.address, N1__0_18DEC.mul(USD_1_000_000));
        await tokens.lpTokenDai.mint(agent2.address, N1__0_18DEC.mul(USD_1_000_000));

        await powerToken.setLiquidityMining(liquidityMining.address);
    });

    it("Should has the same account params when 2 user stake lpTokens in one transaction", async () => {
        //    given

        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);

        //    when
        await liquidityRewardsTestAction.stakeStakedToken(
            [agent1.address, agent2.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        await liquidityRewardsTestAction.delegatePwToken(
            [agent1.address, agent2.address],
            [[tokens.lpTokenDai.address], [tokens.lpTokenDai.address]],
            [[N1__0_18DEC], [N1__0_18DEC]]
        );
        await liquidityRewardsTestAction.stakeLpToken(
            [agent1.address, agent2.address],
            tokens.lpTokenDai.address,
            [N1__0_18DEC, N1__0_18DEC]
        );

        //    then
        const agent1AccountIndicatorsAfter = await agent1.getAccountIndicators(
            tokens.lpTokenDai.address
        );
        const agent2AccountIndicatorsAfter = await agent2.getAccountIndicators(
            tokens.lpTokenDai.address
        );
        const agent1After = extractAccountIndicators(agent1AccountIndicatorsAfter);
        const agent2After = extractAccountIndicators(agent2AccountIndicatorsAfter);

        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);

        expect(agent1After.powerUp).to.be.equal(agent2After.powerUp);
        expect(agent1After.compositeMultiplierCumulativePrevBlock).to.be.equal(
            agent2After.compositeMultiplierCumulativePrevBlock
        );
        expect(agent1After.lpTokenBalance).to.be.equal(agent2After.lpTokenBalance);
        expect(agent1After.delegatedPowerTokenBalance).to.be.equal(
            agent2After.delegatedPowerTokenBalance
        );

        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(N2__0_18DEC)
        );
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(N2__0_18DEC)
        );
    });

    it("Should has the same rewards when 2 user unstake lpTokens in one transaction", async () => {
        //    given

        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);
        const expectedRewards = BigNumber.from("101000000000000000000");

        await liquidityRewardsTestAction.stakeStakedToken(
            [agent1.address, agent2.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        await liquidityRewardsTestAction.delegatePwToken(
            [agent1.address, agent2.address],
            [[tokens.lpTokenDai.address], [tokens.lpTokenDai.address]],
            [[N1__0_18DEC], [N1__0_18DEC]]
        );
        await liquidityRewardsTestAction.stakeLpToken(
            [agent1.address, agent2.address],
            tokens.lpTokenDai.address,
            [N1__0_18DEC, N1__0_18DEC]
        );
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when
        await liquidityRewardsTestAction.unstakeLpToken(
            [agent1.address, agent2.address],
            [tokens.lpTokenDai.address, tokens.lpTokenDai.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        //    then

        const agent1AccountIndicatorsAfter = await agent1.getAccountIndicators(
            tokens.lpTokenDai.address
        );
        const agent2AccountIndicatorsAfter = await agent2.getAccountIndicators(
            tokens.lpTokenDai.address
        );
        const agent1PwTokenBalanceAfter = await powerToken.balanceOf(agent1.address);
        const agent2PwTokenBalanceAfter = await powerToken.balanceOf(agent2.address);
        const agent1After = extractAccountIndicators(agent1AccountIndicatorsAfter);
        const agent2After = extractAccountIndicators(agent2AccountIndicatorsAfter);

        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);

        expect(agent1After.powerUp).to.be.equal(agent2After.powerUp);
        expect(agent1After.compositeMultiplierCumulativePrevBlock).to.be.equal(
            agent2After.compositeMultiplierCumulativePrevBlock
        );
        expect(agent1After.lpTokenBalance).to.be.equal(agent2After.lpTokenBalance);
        expect(agent1After.delegatedPowerTokenBalance).to.be.equal(
            agent2After.delegatedPowerTokenBalance
        );
        expect(agent1PwTokenBalanceAfter).to.be.equal(agent2PwTokenBalanceAfter);
        expect(agent1PwTokenBalanceAfter).to.be.equal(N0__1_18DEC.mul(BigNumber.from(515)));

        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(liquidityMiningIpDaiBalanceBefore);
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(N2__0_18DEC).add(expectedRewards)
        );
    });

    it("Should not get any rewards if stake and unstake in one transaction", async () => {
        //    given
        const lpDai = tokens.lpTokenDai.address;
        const N100__0_18DEC = N1__0_18DEC.mul(BigNumber.from("100"));
        const N1000__0_18DEC = N1__0_18DEC.mul(BigNumber.from("1000"));

        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);

        await agent1.stakeStakedToken(N1000__0_18DEC);
        await tokens.lpTokenDai
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);
        await stakedToken.connect(userOne).approve(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await stakedToken.transfer(
            await userOne.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await powerToken.connect(userOne).stake(N100__0_18DEC);
        await powerToken.connect(userOne).delegateToLiquidityMining([lpDai], [N100__0_18DEC]);
        await liquidityMining.connect(userOne).stake(lpDai, N1000__0_18DEC);

        const agent1LpTokenBalanceBefore = await tokens.lpTokenDai.balanceOf(agent1.address);
        const agent1StakedTokenBalanceBefore = await stakedToken.balanceOf(agent1.address);
        const userOneLpTokenBalanceBefore = await tokens.lpTokenDai.balanceOf(
            await userOne.getAddress()
        );
        const userOneStakedTokenBalanceBefore = await stakedToken.balanceOf(
            await userOne.getAddress()
        );

        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(lpDai);
        const userOnePwTokenBalanceBefore = await powerToken.balanceOf(await userOne.getAddress());
        const agent1PwTokenBalanceBefore = await powerToken.balanceOf(agent1.address);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when

        await liquidityRewardsTestAction.depositAndWithdrawStakedTokensAndLpToken(
            agent1.address,
            [lpDai],
            [N100__0_18DEC],
            [N1000__0_18DEC]
        );
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await liquidityRewardsTestAction.depositAndWithdrawStakedTokensAndLpToken(
            agent1.address,
            [lpDai],
            [N100__0_18DEC],
            [N1000__0_18DEC]
        );
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await liquidityRewardsTestAction.depositAndWithdrawStakedTokensAndLpToken(
            agent1.address,
            [lpDai],
            [N100__0_18DEC],
            [N1000__0_18DEC]
        );
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    then
        await liquidityMining.connect(userOne).unstake(lpDai, N1000__0_18DEC);

        const agent1LpTokenBalanceAfter = await tokens.lpTokenDai.balanceOf(agent1.address);
        const agent1StakedTokenBalanceAfter = await stakedToken.balanceOf(agent1.address);
        const agent1PwTokenBalanceAfter = await powerToken.balanceOf(agent1.address);
        const userOneLpTokenBalanceAfter = await tokens.lpTokenDai.balanceOf(
            await userOne.getAddress()
        );
        const userOneStakedTokenBalanceAfter = await stakedToken.balanceOf(
            await userOne.getAddress()
        );

        const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(lpDai);
        const userOnePwTokenBalanceAfter = await powerToken.balanceOf(await userOne.getAddress());

        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(accruedRewardsAfter).to.be.equal(N1__0_18DEC.mul(BigNumber.from("404")));

        expect(agent1LpTokenBalanceBefore).to.be.equal(agent1LpTokenBalanceAfter);
        expect(agent1LpTokenBalanceBefore).to.be.equal(agent1LpTokenBalanceAfter);
        expect(agent1StakedTokenBalanceBefore).to.be.equal(agent1StakedTokenBalanceAfter);
        expect(agent1PwTokenBalanceBefore).to.be.equal(agent1PwTokenBalanceAfter);

        expect(userOneLpTokenBalanceBefore).to.be.equal(
            userOneLpTokenBalanceAfter.sub(N1000__0_18DEC)
        );
        expect(userOneStakedTokenBalanceBefore).to.be.equal(userOneStakedTokenBalanceAfter);
        expect(userOnePwTokenBalanceBefore).to.be.equal(N100__0_18DEC);
        expect(userOnePwTokenBalanceAfter).to.be.equal(
            accruedRewardsAfter.add(userOnePwTokenBalanceBefore)
        );

        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(liquidityMiningIpDaiBalanceBefore);
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore
                .add(N1__0_18DEC.mul(BigNumber.from("504")))
                .add(N1000__0_18DEC)
        );
    });

    it("Should transfer all rewards to one user when 2 users concurrently stake, one withdraws", async () => {
        //    given
        const lpDai = tokens.lpTokenDai.address;
        const N100__0_18DEC = N1__0_18DEC.mul(BigNumber.from("100"));
        const N1000__0_18DEC = N1__0_18DEC.mul(BigNumber.from("1000"));

        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);

        await agent1.stakeStakedToken(N100__0_18DEC);
        await agent2.stakeStakedToken(N100__0_18DEC);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await network.provider.send("evm_setAutomine", [false]);

        //    when
        await liquidityRewardsTestAction.depositAndWithdrawStakedTokensAndLpToken(
            agent1.address,
            [lpDai],
            [N100__0_18DEC],
            [N1000__0_18DEC]
        );
        await liquidityRewardsTestAction.depositStakedTokensAndLpToken(
            agent2.address,
            [lpDai],
            [N100__0_18DEC],
            [N1000__0_18DEC]
        );
        const pendingBlockBeforeMine = await network.provider.send("eth_getBlockByNumber", [
            "pending",
            false,
        ]);
        await hre.network.provider.send("evm_mine");
        const transactionBlockNumber = (await hre.ethers.provider.getBlock("latest")).number;

        const pendingBlockAfterMine = await network.provider.send("eth_getBlockByNumber", [
            "pending",
            false,
        ]);
        await hre.network.provider.send("evm_mine");

        //    then
        const blockNumberAfterTransaction = (await hre.ethers.provider.getBlock("latest")).number;
        const agent1Rewards = await agent1.calculateAccountRewards(lpDai);
        const agent2Rewards = await agent2.calculateAccountRewards(lpDai);

        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);

        expect(pendingBlockBeforeMine.transactions.length).to.be.equal(2);
        expect(pendingBlockAfterMine.transactions.length).to.be.equal(0);
        expect(blockNumberAfterTransaction).to.be.equal(transactionBlockNumber + 1);
        expect(agent1Rewards).to.be.equal(ZERO);
        expect(agent2Rewards).to.be.equal(N1__0_18DEC);

        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(
            liquidityMiningIpDaiBalanceBefore.add(N1000__0_18DEC)
        );
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore
                .add(N100__0_18DEC) //deposit
                .add(N100__0_18DEC) //rewards
        );

        await network.provider.send("evm_setAutomine", [true]);
    });

    it("Should get proper number of rewards when rewards per block change", async () => {
        //    given
        const lpDai = tokens.lpTokenDai.address;
        const N1000__0_18DEC = N1__0_18DEC.mul(BigNumber.from("1000"));

        const liquidityMiningIpDaiBalanceBefore = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(powerToken.address);

        const agent1PwTokenBalanceBefore = await powerToken.balanceOf(agent1.address);
        const agent2PwTokenBalanceBefore = await powerToken.balanceOf(agent2.address);
        const globalIndicatorsBefore = await liquidityMining.getGlobalIndicators(lpDai);
        const rewardsPerBlockInitial = globalIndicatorsBefore.rewardsPerBlock;

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await network.provider.send("evm_setAutomine", [false]);

        //    when
        await agent1.stakeLpToken(lpDai, N1000__0_18DEC);
        await hre.network.provider.send("evm_mine");

        const agent1StakeLpTokensInBlock = (await hre.ethers.provider.getBlock("latest")).number;
        await hre.network.provider.send("hardhat_mine", ["0xA"]);
        await liquidityMining.setRewardsPerBlock(lpDai, BigNumber.from("50000000"));
        await agent2.stakeLpToken(lpDai, N1000__0_18DEC);
        await hre.network.provider.send("evm_mine");

        const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(lpDai);
        const rewardsPerBlockAfterBlock11 = globalIndicatorsAfter.rewardsPerBlock;
        const agent2StakeLpTokensInBlock = (await hre.ethers.provider.getBlock("latest")).number;
        const agent1RewardsInBlock11 = await agent1.calculateAccountRewards(lpDai);
        await hre.network.provider.send("hardhat_mine", ["0x9"]);
        const blockNumberBeforeUnstake = (await hre.ethers.provider.getBlock("latest")).number;
        const agent1RewardsInBlock20 = await agent1.calculateAccountRewards(lpDai);
        const agent2RewardsInBlock20 = await agent2.calculateAccountRewards(lpDai);

        await liquidityMining.setRewardsPerBlock(lpDai, BigNumber.from("1000000000"));
        await agent1.unstakeLpToken(lpDai, N1000__0_18DEC);
        await agent2.unstakeLpToken(lpDai, N1000__0_18DEC);
        await hre.network.provider.send("evm_mine");
        const unstakeBlockNumber = (await hre.ethers.provider.getBlock("latest")).number;
        const globalIndicatorsAfter2 = await liquidityMining.getGlobalIndicators(lpDai);
        const rewardsPerBlockAfterBlock21 = globalIndicatorsAfter2.rewardsPerBlock;

        //    then

        const agent1PwTokenBalanceAfter = await powerToken.balanceOf(agent1.address);
        const agent2PwTokenBalanceAfter = await powerToken.balanceOf(agent2.address);

        const agent1Rewards = agent1PwTokenBalanceAfter.sub(agent1PwTokenBalanceBefore);
        const agent2Rewards = agent2PwTokenBalanceAfter.sub(agent2PwTokenBalanceBefore);

        const liquidityMiningIpDaiBalanceAfter = await tokens.lpTokenDai.balanceOf(
            liquidityMining.address
        );
        const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(powerToken.address);

        expect(rewardsPerBlockInitial).to.be.equal(BigNumber.from("100000000"));
        expect(agent2StakeLpTokensInBlock).to.be.equal(agent1StakeLpTokensInBlock + 11);
        expect(agent1RewardsInBlock11).to.be.equal(N1__0_18DEC.mul(BigNumber.from("11")));
        expect(rewardsPerBlockAfterBlock11).to.be.equal(BigNumber.from("50000000"));
        expect(blockNumberBeforeUnstake).to.be.equal(agent1StakeLpTokensInBlock + 20);
        expect(agent1RewardsInBlock20).to.be.equal(BigNumber.from("13250000000000000000"));
        expect(agent2RewardsInBlock20).to.be.equal(BigNumber.from("2250000000000000000"));
        expect(unstakeBlockNumber).to.be.equal(agent1StakeLpTokensInBlock + 21);
        expect(agent1Rewards).to.be.equal(BigNumber.from("13500000000000000000"));
        expect(agent2Rewards).to.be.equal(BigNumber.from("2500000000000000000"));
        expect(rewardsPerBlockAfterBlock21).to.be.equal(BigNumber.from("1000000000"));

        expect(liquidityMiningIpDaiBalanceAfter).to.be.equal(liquidityMiningIpDaiBalanceBefore);
        expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
            powerTokenStakedTokenBalanceBefore.add(agent1Rewards).add(agent2Rewards)
        );

        await network.provider.send("evm_setAutomine", [true]);
    });

    describe("Should not depends on order of unstake", () => {
        let agent1PwTokenBalanceCase1After: BigNumber;
        let agent2PwTokenBalanceCase1After: BigNumber;

        it("Should unstake agent 1 and agent 2 - case 1", async () => {
            //    given
            await liquidityRewardsTestAction.stakeStakedToken(
                [agent1.address, agent2.address],
                [N1__0_18DEC, N1__0_18DEC]
            );
            await liquidityRewardsTestAction.delegatePwToken(
                [agent1.address, agent2.address],
                [[tokens.lpTokenDai.address], [tokens.lpTokenDai.address]],
                [[N1__0_18DEC], [N1__0_18DEC]]
            );
            await liquidityRewardsTestAction.stakeLpToken(
                [agent1.address, agent2.address],
                tokens.lpTokenDai.address,
                [N1__0_18DEC, N2__0_18DEC]
            );

            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            //    when
            await liquidityRewardsTestAction.unstakeLpToken(
                [agent1.address, agent2.address],
                [tokens.lpTokenDai.address, tokens.lpTokenDai.address],
                [N1__0_18DEC, N2__0_18DEC]
            );

            //    then
            const agent1AccountIndicatorsAfter = await agent1.getAccountIndicators(
                tokens.lpTokenDai.address
            );
            const agent2AccountIndicatorsAfter = await agent2.getAccountIndicators(
                tokens.lpTokenDai.address
            );
            agent1PwTokenBalanceCase1After = await powerToken.balanceOf(agent1.address);
            agent2PwTokenBalanceCase1After = await powerToken.balanceOf(agent2.address);
            const agent1After = extractAccountIndicators(agent1AccountIndicatorsAfter);
            const agent2After = extractAccountIndicators(agent2AccountIndicatorsAfter);
            const accruedRewards = await liquidityMining.calculateAccruedRewards(
                tokens.lpTokenDai.address
            );
            const differencesBetweenRewords = accruedRewards
                .sub(agent2PwTokenBalanceCase1After)
                .sub(agent1PwTokenBalanceCase1After)
                .sub(N2__0_18DEC);

            expect(agent1After.powerUp).to.be.equal(ZERO);
            expect(agent1After.compositeMultiplierCumulativePrevBlock).to.be.equal(
                BigNumber.from("21107793422577080666411279078")
            );
            expect(agent1After.lpTokenBalance).to.be.equal(ZERO);
            expect(agent1After.delegatedPowerTokenBalance).to.be.equal(N1__0_18DEC);
            expect(agent1PwTokenBalanceCase1After).to.be.equal(
                BigNumber.from("42898178416784174176")
            );

            expect(agent2After.powerUp).to.be.equal(ZERO);
            expect(agent2After.compositeMultiplierCumulativePrevBlock).to.be.equal(
                BigNumber.from("21107793422577080666411279078")
            );
            expect(agent2After.lpTokenBalance).to.be.equal(ZERO);
            expect(agent2After.delegatedPowerTokenBalance).to.be.equal(N1__0_18DEC);
            expect(agent2PwTokenBalanceCase1After).to.be.equal(
                BigNumber.from("60101821583215825824")
            );

            expect(differencesBetweenRewords.lte(BigNumber.from("100"))).to.be.true;
        });

        it("Should unstake agent 2 and agent 1 - case 2", async () => {
            //    given
            await liquidityRewardsTestAction.stakeStakedToken(
                [agent1.address, agent2.address],
                [N1__0_18DEC, N1__0_18DEC]
            );
            await liquidityRewardsTestAction.delegatePwToken(
                [agent1.address, agent2.address],
                [[tokens.lpTokenDai.address], [tokens.lpTokenDai.address]],
                [[N1__0_18DEC], [N1__0_18DEC]]
            );
            await liquidityRewardsTestAction.stakeLpToken(
                [agent1.address, agent2.address],
                tokens.lpTokenDai.address,
                [N1__0_18DEC, N2__0_18DEC]
            );
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            //    when
            await liquidityRewardsTestAction.unstakeLpToken(
                [agent2.address, agent1.address],
                [tokens.lpTokenDai.address, tokens.lpTokenDai.address],
                [N2__0_18DEC, N1__0_18DEC]
            );

            //    then
            const agent1PwTokenBalanceCase2After = await powerToken.balanceOf(agent1.address);
            const agent2PwTokenBalanceCase2After = await powerToken.balanceOf(agent2.address);

            expect(agent1PwTokenBalanceCase1After).to.be.equal(agent1PwTokenBalanceCase2After);
            expect(agent2PwTokenBalanceCase1After).to.be.equal(agent2PwTokenBalanceCase2After);
        });

        it("Should calculate proper rewards, based on excel from documentation", async () => {
            //    given
            const rewardsPerBlock = BigNumber.from("300000000");
            const accountOneLpTokenAmount = BigNumber.from("100").mul(N1__0_18DEC);
            const accountOnePwTokenAmount = BigNumber.from("100").mul(N1__0_18DEC);
            const accountTwoLpTokenAmount = BigNumber.from("100").mul(N1__0_18DEC);
            const accountTwoPwTokenAmount = BigNumber.from("100").mul(N1__0_18DEC);
            const accountThreeLpTokenAmount = BigNumber.from("300").mul(N1__0_18DEC);
            const accountThreePwTokenAmount = BigNumber.from("100").mul(N1__0_18DEC);

            await stakedToken.transfer(
                await userOne.getAddress(),
                N1__0_18DEC.mul(BigNumber.from("10000"))
            );
            await stakedToken
                .connect(userOne)
                .approve(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
            await tokens.lpTokenDai
                .connect(userOne)
                .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);

            await stakedToken.transfer(
                await userTwo.getAddress(),
                N1__0_18DEC.mul(BigNumber.from("10000"))
            );
            await stakedToken
                .connect(userTwo)
                .approve(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
            await tokens.lpTokenDai
                .connect(userTwo)
                .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);

            await stakedToken.transfer(
                await userThree.getAddress(),
                N1__0_18DEC.mul(BigNumber.from("10000"))
            );
            await stakedToken
                .connect(userThree)
                .approve(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
            await tokens.lpTokenDai
                .connect(userThree)
                .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);

            await network.provider.send("evm_setAutomine", [false]);
            await liquidityMining.setRewardsPerBlock(tokens.lpTokenDai.address, rewardsPerBlock);
            await hre.network.provider.send("evm_mine");

            const liquidityMiningIpBalanceBefore = await tokens.lpTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerTokenStakedTokenBalanceBefore = await stakedToken.balanceOf(
                powerToken.address
            );

            //    when

            await powerToken.connect(userOne).stake(accountOnePwTokenAmount);
            await powerToken
                .connect(userOne)
                .delegateAndStakeToLiquidityMining(
                    [tokens.lpTokenDai.address],
                    [accountOnePwTokenAmount],
                    [accountOneLpTokenAmount]
                );
            await hre.network.provider.send("evm_mine");
            await hre.network.provider.send("evm_mine");

            await powerToken.connect(userTwo).stake(accountTwoPwTokenAmount);
            await powerToken
                .connect(userTwo)
                .delegateAndStakeToLiquidityMining(
                    [tokens.lpTokenDai.address],
                    [accountTwoPwTokenAmount],
                    [accountTwoLpTokenAmount]
                );
            await hre.network.provider.send("evm_mine");
            await hre.network.provider.send("evm_mine");

            await powerToken.connect(userThree).stake(accountThreePwTokenAmount);
            await powerToken
                .connect(userThree)
                .delegateAndStakeToLiquidityMining(
                    [tokens.lpTokenDai.address],
                    [accountThreePwTokenAmount],
                    [accountThreeLpTokenAmount]
                );
            await hre.network.provider.send("evm_mine");
            await hre.network.provider.send("evm_mine");

            //when
            const accountOneRewards = await liquidityMining.calculateAccountRewards(
                await userOne.getAddress(),
                tokens.lpTokenDai.address
            );
            const accountTwoRewards = await liquidityMining.calculateAccountRewards(
                await userTwo.getAddress(),
                tokens.lpTokenDai.address
            );
            const accountThreeRewards = await liquidityMining.calculateAccountRewards(
                await userThree.getAddress(),
                tokens.lpTokenDai.address
            );

            const liquidityMiningIpBalanceAfter = await tokens.lpTokenDai.balanceOf(
                liquidityMining.address
            );
            const powerTokenStakedTokenBalanceAfter = await stakedToken.balanceOf(
                powerToken.address
            );

            const sumOfRewards = accountOneRewards.add(accountTwoRewards).add(accountThreeRewards);

            expect(sumOfRewards).to.be.equal(
                N1__0_18DEC.mul(BigNumber.from("15")).add(BigNumber.from(1))
            );
            expect(liquidityMiningIpBalanceAfter).to.be.equal(
                liquidityMiningIpBalanceBefore
                    .add(accountOneLpTokenAmount)
                    .add(accountTwoLpTokenAmount)
                    .add(accountThreeLpTokenAmount)
            );
            expect(powerTokenStakedTokenBalanceAfter).to.be.equal(
                powerTokenStakedTokenBalanceBefore
                    .add(accountOnePwTokenAmount)
                    .add(accountTwoPwTokenAmount)
                    .add(accountTwoPwTokenAmount)
            );

            await network.provider.send("evm_setAutomine", [true]);
        });
    });
});
