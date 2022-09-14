import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import {
    LiquidityRewards,
    IporToken,
    PwIporToken,
    LiquidityRewardsTestAction,
    LiquidityRewardsAgent,
} from "../../types";
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
    USD_1_000_000,
    N0__1_18DEC,
    N2__0_18DEC,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

describe("LiquidityRewards claim", () => {
    let tokens: Tokens;
    let liquidityRewards: LiquidityRewards;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let iporToken: IporToken;
    let pwIporToken: PwIporToken;
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
        const PwIporToken = await hre.ethers.getContractFactory("PwIporToken");
        pwIporToken = (await upgrades.deployProxy(PwIporToken, [iporToken.address])) as PwIporToken;

        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            pwIporToken.address,
            iporToken.address,
        ])) as LiquidityRewards;

        const LiquidityRewardsTestAction = await hre.ethers.getContractFactory(
            "LiquidityRewardsTestAction"
        );
        liquidityRewardsTestAction =
            (await LiquidityRewardsTestAction.deploy()) as LiquidityRewardsTestAction;

        const LiquidityRewardsAgent = await hre.ethers.getContractFactory("LiquidityRewardsAgent");
        agent1 = (await LiquidityRewardsAgent.deploy(
            pwIporToken.address,
            liquidityRewards.address,
            tokens.ipTokenDai.address,
            iporToken.address
        )) as LiquidityRewardsAgent;
        agent2 = (await LiquidityRewardsAgent.deploy(
            pwIporToken.address,
            liquidityRewards.address,
            tokens.ipTokenDai.address,
            iporToken.address
        )) as LiquidityRewardsAgent;

        await iporToken.transfer(agent1.address, N1__0_18DEC.mul(BigNumber.from("10000")));

        await iporToken.transfer(agent2.address, N1__0_18DEC.mul(BigNumber.from("10000")));
        await tokens.ipTokenDai.mint(agent1.address, N1__0_18DEC.mul(USD_1_000_000));
        await tokens.ipTokenDai.mint(agent2.address, N1__0_18DEC.mul(USD_1_000_000));

        await iporToken.transfer(
            liquidityRewards.address,
            N1__0_18DEC.mul(BigNumber.from("100000"))
        );
        await pwIporToken.setLiquidityRewardsAddress(liquidityRewards.address);
    });

    it("Should has the same account params when 2 user stake ipTokens in one transaction", async () => {
        //    given
        //    when
        await liquidityRewardsTestAction.stakeIporToken(
            [agent1.address, agent2.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        await liquidityRewardsTestAction.delegateToRewards(
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
        const agent1AccountParamsAfter = await agent1.accountParams(tokens.ipTokenDai.address);
        const agent2AccountParamsAfter = await agent2.accountParams(tokens.ipTokenDai.address);
        const agent1After = extractMyParam(agent1AccountParamsAfter);
        const agent2After = extractMyParam(agent2AccountParamsAfter);

        expect(agent1After.powerUp).to.be.equal(agent2After.powerUp);
        expect(agent1After.compositeMultiplierCumulative).to.be.equal(
            agent2After.compositeMultiplierCumulative
        );
        expect(agent1After.ipTokensBalance).to.be.equal(agent2After.ipTokensBalance);
        expect(agent1After.delegatedPowerTokenBalance).to.be.equal(
            agent2After.delegatedPowerTokenBalance
        );
    });

    it("Should has the same rewards when 2 user unstake ipTokens in one transaction", async () => {
        //    given
        await liquidityRewardsTestAction.stakeIporToken(
            [agent1.address, agent2.address],
            [N1__0_18DEC, N1__0_18DEC]
        );
        await liquidityRewardsTestAction.delegateToRewards(
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

        const agent1AccountParamsAfter = await agent1.accountParams(tokens.ipTokenDai.address);
        const agent2AccountParamsAfter = await agent2.accountParams(tokens.ipTokenDai.address);
        const agent1PwTokenBalanceAfter = await pwIporToken.balanceOf(agent1.address);
        const agent2PwTokenBalanceAfter = await pwIporToken.balanceOf(agent2.address);
        const agent1After = extractMyParam(agent1AccountParamsAfter);
        const agent2After = extractMyParam(agent2AccountParamsAfter);

        expect(agent1After.powerUp).to.be.equal(agent2After.powerUp);
        expect(agent1After.compositeMultiplierCumulative).to.be.equal(
            agent2After.compositeMultiplierCumulative
        );
        expect(agent1After.ipTokensBalance).to.be.equal(agent2After.ipTokensBalance);
        expect(agent1After.delegatedPowerTokenBalance).to.be.equal(
            agent2After.delegatedPowerTokenBalance
        );
        expect(agent1PwTokenBalanceAfter).to.be.equal(agent2PwTokenBalanceAfter);
        expect(agent1PwTokenBalanceAfter).to.be.equal(N0__1_18DEC.mul(BigNumber.from(515)));
    });

    describe("Should not depends on order of unstake", () => {
        let agent1PwTokenBalanceAfter: BigNumber;
        let agent2PwTokenBalanceAfter: BigNumber;

        it("Should unstake agent 1 and agent 2", async () => {
            //    given
            await liquidityRewardsTestAction.stakeIporToken(
                [agent1.address, agent2.address],
                [N1__0_18DEC, N1__0_18DEC]
            );
            await liquidityRewardsTestAction.delegateToRewards(
                [agent1.address, agent2.address],
                [[tokens.ipTokenDai.address], [tokens.ipTokenDai.address]],
                [[N1__0_18DEC], [N1__0_18DEC]]
            );
            await liquidityRewardsTestAction.stakeIpToken(
                [agent1.address, agent2.address],
                tokens.ipTokenDai.address,
                [N1__0_18DEC, N0__1_18DEC]
            );

            await hre.network.provider.send("hardhat_mine", ["0x64"]);

            //    when
            await liquidityRewardsTestAction.unstakeIpToken(
                [agent1.address, agent2.address],
                [tokens.ipTokenDai.address, tokens.ipTokenDai.address],
                [N1__0_18DEC, N0__1_18DEC]
            );

            //    then
            const agent1AccountParamsAfter = await agent1.accountParams(tokens.ipTokenDai.address);
            const agent2AccountParamsAfter = await agent2.accountParams(tokens.ipTokenDai.address);
            agent1PwTokenBalanceAfter = await pwIporToken.balanceOf(agent1.address);
            agent2PwTokenBalanceAfter = await pwIporToken.balanceOf(agent2.address);
            const agent1After = extractMyParam(agent1AccountParamsAfter);
            const agent2After = extractMyParam(agent2AccountParamsAfter);
            const accruedRewards = await liquidityRewards.accruedRewards(tokens.ipTokenDai.address);
            const differencesBetweenRewords = accruedRewards
                .sub(agent2PwTokenBalanceAfter)
                .sub(agent1PwTokenBalanceAfter)
                .sub(N2__0_18DEC);

            expect(agent1After.powerUp).to.be.equal(ZERO);
            expect(agent1After.compositeMultiplierCumulative).to.be.equal(
                BigNumber.from("56552751597425393915610288180")
            );
            expect(agent1After.ipTokensBalance).to.be.equal(ZERO);
            expect(agent1After.delegatedPowerTokenBalance).to.be.equal(N1__0_18DEC);
            expect(agent1PwTokenBalanceAfter).to.be.equal(BigNumber.from("80173852236395551482"));

            expect(agent2After.powerUp).to.be.equal(ZERO);
            expect(agent2After.compositeMultiplierCumulative).to.be.equal(
                BigNumber.from("56552751597425393915610288180")
            );
            expect(agent2After.ipTokensBalance).to.be.equal(ZERO);
            expect(agent2After.delegatedPowerTokenBalance).to.be.equal(N1__0_18DEC);
            expect(agent2PwTokenBalanceAfter).to.be.equal(BigNumber.from("22826147763604448541"));

            expect(differencesBetweenRewords.lte(BigNumber.from("100"))).to.be.true;
        });

        it("Should unstake agent 2 and agent 1", async () => {
            //    given
            await liquidityRewardsTestAction.stakeIporToken(
                [agent1.address, agent2.address],
                [N1__0_18DEC, N1__0_18DEC]
            );
            await liquidityRewardsTestAction.delegateToRewards(
                [agent1.address, agent2.address],
                [[tokens.ipTokenDai.address], [tokens.ipTokenDai.address]],
                [[N1__0_18DEC], [N1__0_18DEC]]
            );
            await liquidityRewardsTestAction.stakeIpToken(
                [agent1.address, agent2.address],
                tokens.ipTokenDai.address,
                [N1__0_18DEC, N0__1_18DEC]
            );
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            //    when
            await liquidityRewardsTestAction.unstakeIpToken(
                [agent2.address, agent1.address],
                [tokens.ipTokenDai.address, tokens.ipTokenDai.address],
                [N0__1_18DEC, N1__0_18DEC]
            );

            //    then
            const agent1PwTokenBalanceCase2After = await pwIporToken.balanceOf(agent1.address);
            const agent2PwTokenBalanceCase2After = await pwIporToken.balanceOf(agent2.address);

            expect(agent1PwTokenBalanceAfter).to.be.equal(agent1PwTokenBalanceCase2After);
            expect(agent2PwTokenBalanceAfter).to.be.equal(agent2PwTokenBalanceCase2After);
        });
    });
});
