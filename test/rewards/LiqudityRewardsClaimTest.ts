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

describe("LiquidityRewards claim", () => {
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

    it("Should not claim when no stake ipTokens", async () => {
        //    given
        //    when
        await expect(liquidityRewards.claim(tokens.ipTokenDai.address)).to.be.revertedWith(
            "IPOR_707"
        );
    });

    it("Should claim rewards when 100 blocks were mint", async () => {
        //    given
        const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

        await pwIporToken.connect(userOne).stake(delegatedIporToken);

        await pwIporToken
            .connect(userOne)
            .delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);

        const pwIporTokenBalanceBefore = await pwIporToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await liquidityRewards.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        //    when
        await liquidityRewards.connect(userOne).claim(tokens.ipTokenDai.address);
        //    then
        const pwIporTokenBalanceAfter = await pwIporToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        expect(pwIporTokenBalanceBefore).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(pwIporTokenBalanceAfter).to.be.equal(BigNumber.from("201000000000000000000"));
    });

    it("Should count proper transfer rewards when one user stake ipTokens twice", async () => {
        //    given
        const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));
        await pwIporToken.connect(userOne).stake(delegatedIporToken);
        await pwIporToken
            .connect(userOne)
            .delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);

        const pwIporTokenBalanceBefore = await pwIporToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        // when
        await liquidityRewards.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const pwIporTokenBalanceAfter1Stake = await pwIporToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        const rewardsAfterFirstStake = await liquidityRewards
            .connect(userOne)
            .userRewards(tokens.ipTokenDai.address);

        await liquidityRewards.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);

        //    then
        const pwIporTokenBalanceAfter2Stake = await pwIporToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        const rewardsAfterSecondStake = await liquidityRewards
            .connect(userOne)
            .userRewards(tokens.ipTokenDai.address);

        expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(rewardsAfterSecondStake).to.be.equal(ZERO);

        expect(pwIporTokenBalanceBefore).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(pwIporTokenBalanceAfter1Stake).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(pwIporTokenBalanceAfter2Stake).to.be.equal(BigNumber.from("201000000000000000000"));
    });

    it("Should count proper rewards when one user stake pwTokens twice", async () => {
        //    given
        console.error("######### ", await userOne.getAddress());
        const delegatedIporToken = N1__0_18DEC.mul(BigNumber.from("100"));
        const stakedIpTokens = N1__0_18DEC.mul(BigNumber.from("100"));

        //    when
        await pwIporToken.connect(userOne).stake(delegatedIporToken.mul(BigNumber.from("2")));

        const pwIporTokenBalanceBefore = await pwIporToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        await liquidityRewards.connect(userOne).stake(tokens.ipTokenDai.address, stakedIpTokens);
        await pwIporToken
            .connect(userOne)
            .delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const pwIporTokenBalanceAfter1Stake = await pwIporToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());
        console.log(
            "#################: iporToken",
            (await iporToken.balanceOf(liquidityRewards.address)).toString()
        );
        const rewardsAfterFirstStake = await liquidityRewards
            .connect(userOne)
            .userRewards(tokens.ipTokenDai.address);

        await pwIporToken
            .connect(userOne)
            .delegateToRewards([tokens.ipTokenDai.address], [delegatedIporToken]);

        const rewardsAfterSecondStake = await liquidityRewards
            .connect(userOne)
            .userRewards(tokens.ipTokenDai.address);
        //    then

        const pwIporTokenBalanceAfter2Stake = await pwIporToken
            .connect(userOne)
            .balanceOf(await userOne.getAddress());

        expect(rewardsAfterFirstStake).to.be.equal(BigNumber.from("100000000000000000000"));
        expect(rewardsAfterSecondStake).to.be.equal(ZERO);

        expect(pwIporTokenBalanceBefore).to.be.equal(BigNumber.from("200000000000000000000"));
        // 1 transfer when first delegateToRewards
        expect(pwIporTokenBalanceAfter1Stake).to.be.equal(BigNumber.from("201000000000000000000"));
        // 100 transfer after second delegateToRewards
        expect(pwIporTokenBalanceAfter2Stake).to.be.equal(BigNumber.from("302000000000000000000"));
    });
});
