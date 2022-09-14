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
        const agent1AccountParamsBefore = await agent1.accountParams(tokens.ipTokenDai.address);
        const agent2AccountParamsBefore = await agent2.accountParams(tokens.ipTokenDai.address);
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
        console.table({
            powerUp: agent1After.powerUp.toString(),
            compositeMultiplierCumulative: agent1After.compositeMultiplierCumulative.toString(),
            ipTokensBalance: agent1After.ipTokensBalance.toString(),
            delegatedPowerTokenBalance: agent1After.delegatedPowerTokenBalance.toString(),
        });
        console.table({
            powerUp: agent2After.powerUp.toString(),
            compositeMultiplierCumulative: agent2After.compositeMultiplierCumulative.toString(),
            ipTokensBalance: agent2After.ipTokensBalance.toString(),
            delegatedPowerTokenBalance: agent2After.delegatedPowerTokenBalance.toString(),
        });
    });
});
