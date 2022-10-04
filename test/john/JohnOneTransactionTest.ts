import hre, { upgrades, network } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import {
    John,
    IporToken,
    PowerIpor,
    LiquidityRewardsTestAction,
    LiquidityRewardsAgent,
} from "../../types";
import {
    Tokens,
    getDeployedTokens,
    expectAccountIndicators,
    extractAccountIndicators,
} from "../utils/JohnUtils";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    USD_1_000_000,
    N0__1_18DEC,
    N2__0_18DEC,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

describe("One block/Transaction tests", () => {
    let tokens: Tokens;
    let john: John;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let iporToken: IporToken;
    let powerIpor: PowerIpor;
    let liquidityRewardsTestAction: LiquidityRewardsTestAction;
    let agent1: LiquidityRewardsAgent, agent2: LiquidityRewardsAgent;

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

        const LiquidityRewardsTestAction = await hre.ethers.getContractFactory(
            "LiquidityRewardsTestAction"
        );
        liquidityRewardsTestAction =
            (await LiquidityRewardsTestAction.deploy()) as LiquidityRewardsTestAction;

        const LiquidityRewardsAgent = await hre.ethers.getContractFactory("LiquidityRewardsAgent");
        agent1 = (await LiquidityRewardsAgent.deploy(
            powerIpor.address,
            john.address,
            tokens.ipTokenDai.address,
            iporToken.address
        )) as LiquidityRewardsAgent;
        agent2 = (await LiquidityRewardsAgent.deploy(
            powerIpor.address,
            john.address,
            tokens.ipTokenDai.address,
            iporToken.address
        )) as LiquidityRewardsAgent;

        await iporToken.transfer(agent1.address, N1__0_18DEC.mul(BigNumber.from("10000")));
        await iporToken.transfer(agent2.address, N1__0_18DEC.mul(BigNumber.from("10000")));
        await iporToken.transfer(john.address, N1__0_18DEC.mul(BigNumber.from("100000")));

        await tokens.ipTokenDai.mint(agent1.address, N1__0_18DEC.mul(USD_1_000_000));
        await tokens.ipTokenDai.mint(agent2.address, N1__0_18DEC.mul(USD_1_000_000));

        await powerIpor.setJohn(john.address);
    });

    it("Should has the same account params when 2 user stake ipTokens in one transaction", async () => {
        //    given

        const johnIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(john.address);
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

        //    when
        await liquidityRewardsTestAction.stakeIporToken(
            [agent1.address, agent2.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        await liquidityRewardsTestAction.delegatePwIpor(
            [agent1.address, agent2.address],
            [[tokens.ipTokenDai.address], [tokens.ipTokenDai.address]],
            [[N1__0_18DEC], [N1__0_18DEC]]
        );
        await liquidityRewardsTestAction.stakeIpToken(
            [agent1.address, agent2.address],
            tokens.ipTokenDai.address,
            [N1__0_18DEC, N1__0_18DEC]
        );

        //    then
        const agent1AccountIndicatorsAfter = await agent1.getAccountIndicators(
            tokens.ipTokenDai.address
        );
        const agent2AccountIndicatorsAfter = await agent2.getAccountIndicators(
            tokens.ipTokenDai.address
        );
        const agent1After = extractAccountIndicators(agent1AccountIndicatorsAfter);
        const agent2After = extractAccountIndicators(agent2AccountIndicatorsAfter);

        const johnIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(john.address);
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

        expect(agent1After.powerUp).to.be.equal(agent2After.powerUp);
        expect(agent1After.compositeMultiplierCumulativePrevBlock).to.be.equal(
            agent2After.compositeMultiplierCumulativePrevBlock
        );
        expect(agent1After.ipTokenBalance).to.be.equal(agent2After.ipTokenBalance);
        expect(agent1After.delegatedPowerTokenBalance).to.be.equal(
            agent2After.delegatedPowerTokenBalance
        );

        expect(johnIpDaiBalanceAfter).to.be.equal(johnIpDaiBalanceBefore.add(N2__0_18DEC));
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(N2__0_18DEC)
        );
    });

    it("Should has the same rewards when 2 user unstake ipTokens in one transaction", async () => {
        //    given

        const johnIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(john.address);
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        const expectedRewards = BigNumber.from("101000000000000000000");

        await liquidityRewardsTestAction.stakeIporToken(
            [agent1.address, agent2.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        await liquidityRewardsTestAction.delegatePwIpor(
            [agent1.address, agent2.address],
            [[tokens.ipTokenDai.address], [tokens.ipTokenDai.address]],
            [[N1__0_18DEC], [N1__0_18DEC]]
        );
        await liquidityRewardsTestAction.stakeIpToken(
            [agent1.address, agent2.address],
            tokens.ipTokenDai.address,
            [N1__0_18DEC, N1__0_18DEC]
        );
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when
        await liquidityRewardsTestAction.unstakeIpToken(
            [agent1.address, agent2.address],
            [tokens.ipTokenDai.address, tokens.ipTokenDai.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        //    then

        const agent1AccountIndicatorsAfter = await agent1.getAccountIndicators(
            tokens.ipTokenDai.address
        );
        const agent2AccountIndicatorsAfter = await agent2.getAccountIndicators(
            tokens.ipTokenDai.address
        );
        const agent1PwIporBalanceAfter = await powerIpor.balanceOf(agent1.address);
        const agent2PwIporBalanceAfter = await powerIpor.balanceOf(agent2.address);
        const agent1After = extractAccountIndicators(agent1AccountIndicatorsAfter);
        const agent2After = extractAccountIndicators(agent2AccountIndicatorsAfter);

        const johnIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(john.address);
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

        expect(agent1After.powerUp).to.be.equal(agent2After.powerUp);
        expect(agent1After.compositeMultiplierCumulativePrevBlock).to.be.equal(
            agent2After.compositeMultiplierCumulativePrevBlock
        );
        expect(agent1After.ipTokenBalance).to.be.equal(agent2After.ipTokenBalance);
        expect(agent1After.delegatedPowerTokenBalance).to.be.equal(
            agent2After.delegatedPowerTokenBalance
        );
        expect(agent1PwIporBalanceAfter).to.be.equal(agent2PwIporBalanceAfter);
        expect(agent1PwIporBalanceAfter).to.be.equal(N0__1_18DEC.mul(BigNumber.from(515)));

        expect(johnIpDaiBalanceAfter).to.be.equal(johnIpDaiBalanceBefore);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(N2__0_18DEC).add(expectedRewards)
        );
    });

    it("Should not get any rewards if stake and unstake in one transaction", async () => {
        //    given
        const ipDai = tokens.ipTokenDai.address;
        const N100__0_18DEC = N1__0_18DEC.mul(BigNumber.from("100"));
        const N1000__0_18DEC = N1__0_18DEC.mul(BigNumber.from("1000"));

        const johnIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(john.address);
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

        await agent1.stakeIporToken(N1000__0_18DEC);
        await tokens.ipTokenDai.connect(userOne).approve(john.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.connect(userOne).approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.transfer(
            await userOne.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("10000"))
        );
        await powerIpor.connect(userOne).stake(N100__0_18DEC);
        await powerIpor.connect(userOne).delegateToJohn([ipDai], [N100__0_18DEC]);
        await john.connect(userOne).stake(ipDai, N1000__0_18DEC);

        const agent1IpTokenBalanceBefore = await tokens.ipTokenDai.balanceOf(agent1.address);
        const agent1IporTokenBalanceBefore = await iporToken.balanceOf(agent1.address);
        const userOneIpTokenBalanceBefore = await tokens.ipTokenDai.balanceOf(
            await userOne.getAddress()
        );
        const userOneIporTokenBalanceBefore = await iporToken.balanceOf(await userOne.getAddress());

        const accruedRewardsBefore = await john.calculateAccruedRewards(ipDai);
        const userOnePwIporBalanceBefore = await powerIpor.balanceOf(await userOne.getAddress());
        const agent1PwIporBalanceBefore = await powerIpor.balanceOf(agent1.address);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    when

        await liquidityRewardsTestAction.depositAndWithdrawIporTokensAndIpToken(
            agent1.address,
            [ipDai],
            [N100__0_18DEC],
            [N1000__0_18DEC]
        );
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await liquidityRewardsTestAction.depositAndWithdrawIporTokensAndIpToken(
            agent1.address,
            [ipDai],
            [N100__0_18DEC],
            [N1000__0_18DEC]
        );
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await liquidityRewardsTestAction.depositAndWithdrawIporTokensAndIpToken(
            agent1.address,
            [ipDai],
            [N100__0_18DEC],
            [N1000__0_18DEC]
        );
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        //    then
        await john.connect(userOne).unstake(ipDai, N1000__0_18DEC);

        const agent1IpTokenBalanceAfter = await tokens.ipTokenDai.balanceOf(agent1.address);
        const agent1IporTokenBalanceAfter = await iporToken.balanceOf(agent1.address);
        const agent1PwIporBalanceAfter = await powerIpor.balanceOf(agent1.address);
        const userOneIpTokenBalanceAfter = await tokens.ipTokenDai.balanceOf(
            await userOne.getAddress()
        );
        const userOneIporTokenBalanceAfter = await iporToken.balanceOf(await userOne.getAddress());

        const accruedRewardsAfter = await john.calculateAccruedRewards(ipDai);
        const userOnePwIporBalanceAfter = await powerIpor.balanceOf(await userOne.getAddress());

        const johnIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(john.address);
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(accruedRewardsAfter).to.be.equal(N1__0_18DEC.mul(BigNumber.from("404")));

        expect(agent1IpTokenBalanceBefore).to.be.equal(agent1IpTokenBalanceAfter);
        expect(agent1IpTokenBalanceBefore).to.be.equal(agent1IpTokenBalanceAfter);
        expect(agent1IporTokenBalanceBefore).to.be.equal(agent1IporTokenBalanceAfter);
        expect(agent1PwIporBalanceBefore).to.be.equal(agent1PwIporBalanceAfter);

        expect(userOneIpTokenBalanceBefore).to.be.equal(
            userOneIpTokenBalanceAfter.sub(N1000__0_18DEC)
        );
        expect(userOneIporTokenBalanceBefore).to.be.equal(userOneIporTokenBalanceAfter);
        expect(userOnePwIporBalanceBefore).to.be.equal(N100__0_18DEC);
        expect(userOnePwIporBalanceAfter).to.be.equal(
            accruedRewardsAfter.add(userOnePwIporBalanceBefore)
        );

        expect(johnIpDaiBalanceAfter).to.be.equal(johnIpDaiBalanceBefore);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore
                .add(N1__0_18DEC.mul(BigNumber.from("504")))
                .add(N1000__0_18DEC)
        );
    });

    it("Should transfer all rewards to one user when 2 users concurrently stake, one withdraws", async () => {
        //    given
        const ipDai = tokens.ipTokenDai.address;
        const N100__0_18DEC = N1__0_18DEC.mul(BigNumber.from("100"));
        const N1000__0_18DEC = N1__0_18DEC.mul(BigNumber.from("1000"));

        const johnIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(john.address);
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

        await agent1.stakeIporToken(N100__0_18DEC);
        await agent2.stakeIporToken(N100__0_18DEC);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await network.provider.send("evm_setAutomine", [false]);

        //    when
        await liquidityRewardsTestAction.depositAndWithdrawIporTokensAndIpToken(
            agent1.address,
            [ipDai],
            [N100__0_18DEC],
            [N1000__0_18DEC]
        );
        await liquidityRewardsTestAction.depositIporTokensAndIpToken(
            agent2.address,
            [ipDai],
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
        const agent1Rewards = await agent1.calculateAccountRewards(ipDai);
        const agent2Rewards = await agent2.calculateAccountRewards(ipDai);

        const johnIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(john.address);
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

        expect(pendingBlockBeforeMine.transactions.length).to.be.equal(2);
        expect(pendingBlockAfterMine.transactions.length).to.be.equal(0);
        expect(blockNumberAfterTransaction).to.be.equal(transactionBlockNumber + 1);
        expect(agent1Rewards).to.be.equal(ZERO);
        expect(agent2Rewards).to.be.equal(N1__0_18DEC);

        expect(johnIpDaiBalanceAfter).to.be.equal(johnIpDaiBalanceBefore.add(N1000__0_18DEC));
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore
                .add(N100__0_18DEC) //deposit
                .add(N100__0_18DEC) //rewards
        );

        await network.provider.send("evm_setAutomine", [true]);
    });

    it("Should get proper number of rewards when rewards per block change", async () => {
        //    given
        const ipDai = tokens.ipTokenDai.address;
        const N1000__0_18DEC = N1__0_18DEC.mul(BigNumber.from("1000"));

        const johnIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(john.address);
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

        const agent1PwIporBalanceBefore = await powerIpor.balanceOf(agent1.address);
        const agent2PwIporBalanceBefore = await powerIpor.balanceOf(agent2.address);
        const globalIndicatorsBefore = await john.getGlobalIndicators(ipDai);
        const rewardsPerBlockInitial = globalIndicatorsBefore.rewardsPerBlock;

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await network.provider.send("evm_setAutomine", [false]);

        //    when
        await agent1.stakeIpToken(ipDai, N1000__0_18DEC);
        await hre.network.provider.send("evm_mine");

        const agent1StakeIpTokensInBlock = (await hre.ethers.provider.getBlock("latest")).number;
        await hre.network.provider.send("hardhat_mine", ["0xA"]);
        await john.setRewardsPerBlock(ipDai, BigNumber.from("50000000"));
        await agent2.stakeIpToken(ipDai, N1000__0_18DEC);
        await hre.network.provider.send("evm_mine");

        const globalIndicatorsAfter = await john.getGlobalIndicators(ipDai);
        const rewardsPerBlockAfterBlock11 = globalIndicatorsAfter.rewardsPerBlock;
        const agent2StakeIpTokensInBlock = (await hre.ethers.provider.getBlock("latest")).number;
        const agent1RewardsInBlock11 = await agent1.calculateAccountRewards(ipDai);
        await hre.network.provider.send("hardhat_mine", ["0x9"]);
        const blockNumberBeforeUnstake = (await hre.ethers.provider.getBlock("latest")).number;
        const agent1RewardsInBlock20 = await agent1.calculateAccountRewards(ipDai);
        const agent2RewardsInBlock20 = await agent2.calculateAccountRewards(ipDai);

        await john.setRewardsPerBlock(ipDai, BigNumber.from("1000000000"));
        await agent1.unstakeIpToken(ipDai, N1000__0_18DEC);
        await agent2.unstakeIpToken(ipDai, N1000__0_18DEC);
        await hre.network.provider.send("evm_mine");
        const unstakeBlockNumber = (await hre.ethers.provider.getBlock("latest")).number;
        const globalIndicatorsAfter2 = await john.getGlobalIndicators(ipDai);
        const rewardsPerBlockAfterBlock21 = globalIndicatorsAfter2.rewardsPerBlock;

        //    then

        const agent1PwIporBalanceAfter = await powerIpor.balanceOf(agent1.address);
        const agent2PwIporBalanceAfter = await powerIpor.balanceOf(agent2.address);

        const agent1Rewards = agent1PwIporBalanceAfter.sub(agent1PwIporBalanceBefore);
        const agent2Rewards = agent2PwIporBalanceAfter.sub(agent2PwIporBalanceBefore);

        const johnIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(john.address);
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

        expect(rewardsPerBlockInitial).to.be.equal(BigNumber.from("100000000"));
        expect(agent2StakeIpTokensInBlock).to.be.equal(agent1StakeIpTokensInBlock + 11);
        expect(agent1RewardsInBlock11).to.be.equal(N1__0_18DEC.mul(BigNumber.from("11")));
        expect(rewardsPerBlockAfterBlock11).to.be.equal(BigNumber.from("50000000"));
        expect(blockNumberBeforeUnstake).to.be.equal(agent1StakeIpTokensInBlock + 20);
        expect(agent1RewardsInBlock20).to.be.equal(BigNumber.from("13250000000000000000"));
        expect(agent2RewardsInBlock20).to.be.equal(BigNumber.from("2250000000000000000"));
        expect(unstakeBlockNumber).to.be.equal(agent1StakeIpTokensInBlock + 21);
        expect(agent1Rewards).to.be.equal(BigNumber.from("13500000000000000000"));
        expect(agent2Rewards).to.be.equal(BigNumber.from("2500000000000000000"));
        expect(rewardsPerBlockAfterBlock21).to.be.equal(BigNumber.from("1000000000"));

        expect(johnIpDaiBalanceAfter).to.be.equal(johnIpDaiBalanceBefore);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(agent1Rewards).add(agent2Rewards)
        );

        await network.provider.send("evm_setAutomine", [true]);
    });

    describe("Should not depends on order of unstake", () => {
        let agent1PwIporBalanceCase1After: BigNumber;
        let agent2PwIporBalanceCase1After: BigNumber;

        it("Should unstake agent 1 and agent 2 - case 1", async () => {
            //    given
            await liquidityRewardsTestAction.stakeIporToken(
                [agent1.address, agent2.address],
                [N1__0_18DEC, N1__0_18DEC]
            );
            await liquidityRewardsTestAction.delegatePwIpor(
                [agent1.address, agent2.address],
                [[tokens.ipTokenDai.address], [tokens.ipTokenDai.address]],
                [[N1__0_18DEC], [N1__0_18DEC]]
            );
            await liquidityRewardsTestAction.stakeIpToken(
                [agent1.address, agent2.address],
                tokens.ipTokenDai.address,
                [N1__0_18DEC, N2__0_18DEC]
            );

            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            //    when
            await liquidityRewardsTestAction.unstakeIpToken(
                [agent1.address, agent2.address],
                [tokens.ipTokenDai.address, tokens.ipTokenDai.address],
                [N1__0_18DEC, N2__0_18DEC]
            );

            //    then
            const agent1AccountIndicatorsAfter = await agent1.getAccountIndicators(
                tokens.ipTokenDai.address
            );
            const agent2AccountIndicatorsAfter = await agent2.getAccountIndicators(
                tokens.ipTokenDai.address
            );
            agent1PwIporBalanceCase1After = await powerIpor.balanceOf(agent1.address);
            agent2PwIporBalanceCase1After = await powerIpor.balanceOf(agent2.address);
            const agent1After = extractAccountIndicators(agent1AccountIndicatorsAfter);
            const agent2After = extractAccountIndicators(agent2AccountIndicatorsAfter);
            const accruedRewards = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
            const differencesBetweenRewords = accruedRewards
                .sub(agent2PwIporBalanceCase1After)
                .sub(agent1PwIporBalanceCase1After)
                .sub(N2__0_18DEC);

            expect(agent1After.powerUp).to.be.equal(ZERO);
            expect(agent1After.compositeMultiplierCumulativePrevBlock).to.be.equal(
                BigNumber.from("29970993406907413561979852524")
            );
            expect(agent1After.ipTokenBalance).to.be.equal(ZERO);
            expect(agent1After.delegatedPowerTokenBalance).to.be.equal(N1__0_18DEC);
            expect(agent1PwIporBalanceCase1After).to.be.equal(
                BigNumber.from("42959390769670378987")
            );

            expect(agent2After.powerUp).to.be.equal(ZERO);
            expect(agent2After.compositeMultiplierCumulativePrevBlock).to.be.equal(
                BigNumber.from("29970993406907413561979852524")
            );
            expect(agent2After.ipTokenBalance).to.be.equal(ZERO);
            expect(agent2After.delegatedPowerTokenBalance).to.be.equal(N1__0_18DEC);
            expect(agent2PwIporBalanceCase1After).to.be.equal(
                BigNumber.from("60040609230329621013")
            );

            expect(differencesBetweenRewords.lte(BigNumber.from("100"))).to.be.true;
        });

        it("Should unstake agent 2 and agent 1 - case 2", async () => {
            //    given
            await liquidityRewardsTestAction.stakeIporToken(
                [agent1.address, agent2.address],
                [N1__0_18DEC, N1__0_18DEC]
            );
            await liquidityRewardsTestAction.delegatePwIpor(
                [agent1.address, agent2.address],
                [[tokens.ipTokenDai.address], [tokens.ipTokenDai.address]],
                [[N1__0_18DEC], [N1__0_18DEC]]
            );
            await liquidityRewardsTestAction.stakeIpToken(
                [agent1.address, agent2.address],
                tokens.ipTokenDai.address,
                [N1__0_18DEC, N2__0_18DEC]
            );
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            //    when
            await liquidityRewardsTestAction.unstakeIpToken(
                [agent2.address, agent1.address],
                [tokens.ipTokenDai.address, tokens.ipTokenDai.address],
                [N2__0_18DEC, N1__0_18DEC]
            );

            //    then
            const agent1PwIporBalanceCase2After = await powerIpor.balanceOf(agent1.address);
            const agent2PwIporBalanceCase2After = await powerIpor.balanceOf(agent2.address);

            expect(agent1PwIporBalanceCase1After).to.be.equal(agent1PwIporBalanceCase2After);
            expect(agent2PwIporBalanceCase1After).to.be.equal(agent2PwIporBalanceCase2After);
        });

        it.only("Should calculate proper rewards, based on excel from documentation", async () => {
            //    given
            const rewardsPerBlock = BigNumber.from("300000000");
            const accountOneIpTokenAmount = BigNumber.from("100").mul(N1__0_18DEC);
            const accountOnePwIporAmount = BigNumber.from("100").mul(N1__0_18DEC);
            const accountTwoIpTokenAmount = BigNumber.from("100").mul(N1__0_18DEC);
            const accountTwoPwIporAmount = BigNumber.from("100").mul(N1__0_18DEC);
            const accountThreeIpTokenAmount = BigNumber.from("300").mul(N1__0_18DEC);
            const accountThreePwIporAmount = BigNumber.from("100").mul(N1__0_18DEC);

            await iporToken.transfer(
                await userOne.getAddress(),
                N1__0_18DEC.mul(BigNumber.from("10000"))
            );
            await iporToken.connect(userOne).approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
            await tokens.ipTokenDai
                .connect(userOne)
                .approve(john.address, TOTAL_SUPPLY_18_DECIMALS);

            await iporToken.transfer(
                await userTwo.getAddress(),
                N1__0_18DEC.mul(BigNumber.from("10000"))
            );
            await iporToken.connect(userTwo).approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
            await tokens.ipTokenDai
                .connect(userTwo)
                .approve(john.address, TOTAL_SUPPLY_18_DECIMALS);

            await iporToken.transfer(
                await userThree.getAddress(),
                N1__0_18DEC.mul(BigNumber.from("10000"))
            );
            await iporToken.connect(userThree).approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
            await tokens.ipTokenDai
                .connect(userThree)
                .approve(john.address, TOTAL_SUPPLY_18_DECIMALS);

            await network.provider.send("evm_setAutomine", [false]);
            await john.setRewardsPerBlock(tokens.ipTokenDai.address, rewardsPerBlock);
            await hre.network.provider.send("evm_mine");

            //    when

            await powerIpor.connect(userOne).stake(accountOnePwIporAmount);
            await powerIpor
                .connect(userOne)
                .delegateAndStakeToJohn(
                    [tokens.ipTokenDai.address],
                    [accountOnePwIporAmount],
                    [accountOneIpTokenAmount]
                );
            await hre.network.provider.send("evm_mine");
            await hre.network.provider.send("evm_mine");

            await powerIpor.connect(userTwo).stake(accountTwoPwIporAmount);
            await powerIpor
                .connect(userTwo)
                .delegateAndStakeToJohn(
                    [tokens.ipTokenDai.address],
                    [accountTwoPwIporAmount],
                    [accountTwoIpTokenAmount]
                );
            await hre.network.provider.send("evm_mine");
            await hre.network.provider.send("evm_mine");

            await powerIpor.connect(userThree).stake(accountThreePwIporAmount);
            await powerIpor
                .connect(userThree)
                .delegateAndStakeToJohn(
                    [tokens.ipTokenDai.address],
                    [accountThreePwIporAmount],
                    [accountThreeIpTokenAmount]
                );
            await hre.network.provider.send("evm_mine");
            await hre.network.provider.send("evm_mine");

            //when
            const accountOneRewards = await john.calculateAccountRewards(
                await userOne.getAddress(),
                tokens.ipTokenDai.address
            );
            const accountTwoRewards = await john.calculateAccountRewards(
                await userTwo.getAddress(),
                tokens.ipTokenDai.address
            );
            const accountThreeRewards = await john.calculateAccountRewards(
                await userThree.getAddress(),
                tokens.ipTokenDai.address
            );
            const sumOfRewards = accountOneRewards.add(accountTwoRewards).add(accountThreeRewards);

            expect(sumOfRewards).to.be.equal(N1__0_18DEC.mul(BigNumber.from("15")));

            await network.provider.send("evm_setAutomine", [true]);
        });
    });
});
