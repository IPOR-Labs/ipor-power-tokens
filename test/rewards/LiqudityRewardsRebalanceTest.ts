import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityRewards } from "../../types";
import { Tokens, getDeployedTokens } from "../utils/LiquidityRewardsUtils";
import {
    N1__0_18DEC,
    N1__0_6DEC,
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
    const D18 = BigNumber.from("1000000000000000000");

    const extractMyParam = (value: any) => {
        const powerUp = value[0];
        const userCompositeMltiplier = value[1];
        const stakedIpTokens = value[2];
        const delegatedPowerToken = value[3];

        console.log("#######################################################");
        console.log("My Params");
        console.log("##### powerUp:", powerUp.toString());
        if (userCompositeMltiplier.toString() == "0") {
            console.error(
                "##### Error: userCompositeMltiplier:",
                userCompositeMltiplier.toString()
            );
        } else {
            console.log("##### userCompositeMltiplier:", userCompositeMltiplier.toString());
        }

        console.log("##### stakedIpTokens:", stakedIpTokens.toString());
        console.log("##### delegatedPowerToken:", delegatedPowerToken.toString());
        console.log("#######################################################");
    };

    const extractGlobalParam = (value: any) => {
        const aggregatePowerUp = value[0];
        const accruedRewards = value[1];
        const compositeMultiplier = value[2];
        const lastRebalancingBlockNumber = value[3];
        const blockRewords = value[4];

        console.log("#######################################################");
        console.log("Global Params");
        console.log("##### aggregatePowerUp:", aggregatePowerUp.toString());
        console.log("##### accruedRewards:", accruedRewards.toString());
        console.log("##### compositeMultiplier:", compositeMultiplier.toString());
        console.log("##### lastRebalancingBlockNumber:", lastRebalancingBlockNumber.toString());
        console.log("##### blockRewords:", blockRewords.toString());
        console.log("#######################################################");
    };

    const printParams = async () => {
        const r1 = await liquidityRewards.connect(userOne).getMyParams(tokens.ipTokenDai.address);
        extractMyParam(r1);
        const rg1 = await liquidityRewards
            .connect(userOne)
            .getGlobalParams(tokens.ipTokenDai.address);
        extractGlobalParam(rg1);
    };

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const LiquidityRewards = await hre.ethers.getContractFactory("LiquidityRewards");
        liquidityRewards = (await upgrades.deployProxy(LiquidityRewards, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            await admin.getAddress(),
        ])) as LiquidityRewards;
        tokens.ipTokenDai.approve(liquidityRewards.address, TOTAL_SUPPLY_18_DECIMALS);
        tokens.ipTokenDai
            .connect(userOne)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_18_DECIMALS);
        tokens.ipTokenDai
            .connect(userTwo)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_18_DECIMALS);

        tokens.ipTokenUsdc.approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.ipTokenUsdc
            .connect(userOne)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.ipTokenUsdc
            .connect(userTwo)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);

        tokens.ipTokenUsdt.approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.ipTokenUsdt
            .connect(userOne)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
        tokens.ipTokenUsdt
            .connect(userTwo)
            .approve(liquidityRewards.address, TOTAL_SUPPLY_6_DECIMALS);
    });

    it("Should be able to stake twice ipToken(Dai)", async () => {
        // given

        console.log("############## Init State ##################");
        await printParams();
        const delegatePowerToken = N1__0_18DEC.mul(BigNumber.from("100"));
        await liquidityRewards.delegatePwIpor(
            await userOne.getAddress(),
            [tokens.ipTokenDai.address],
            [delegatePowerToken]
        );

        console.log("############## after delegate 1 ##################");
        await printParams();

        // when
        await liquidityRewards
            .connect(userOne)
            .stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("100")));

        console.log("############## after stake ipToken 1 ##################");
        await printParams();

        const r = await liquidityRewards
            .connect(userOne)
            .calculateUserRewards(tokens.ipTokenDai.address);

        // await liquidityRewards
        //     .connect(userOne)
        //     .stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("100")));
        // console.log("############## after stake ipToken 2 ##################");
        // await printParams();
        //
        // await liquidityRewards
        //     .connect(userOne)
        //     .stake(tokens.ipTokenDai.address, N1__0_18DEC.mul(BigNumber.from("100")));
        // console.log("############## after stake ipToken 3 ##################");
        // await printParams();
    });
});
