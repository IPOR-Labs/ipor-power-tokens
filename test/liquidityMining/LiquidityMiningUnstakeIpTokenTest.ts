import hre, { network, upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockStakedToken, PowerToken } from "../../types";
import { Tokens, getDeployedTokens, extractGlobalIndicators } from "../utils/LiquidityMiningUtils";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
    N2__0_18DEC,
    N0__1_18DEC,
    N0__01_18DEC,
    USD_1_000_000_18DEC,
    N1__0_8DEC,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

const randomBigNumberFromInterval = (min: number, max: number, decimal: BigNumber): BigNumber => {
    return BigNumber.from(Math.floor(Math.random() * (max - min + 1) + min)).mul(decimal);
};
const flipCoin = (): boolean => Math.random() < 0.5;

const randomChangeBlockReward = async (lpToken: string, liquidityMining: LiquidityMining) => {
    if (flipCoin()) {
        liquidityMining.setRewardsPerBlock(
            lpToken,
            randomBigNumberFromInterval(1, 10, BigNumber.from("100000000"))
        );
    }
};

const randomDelegateStakedToken = async (
    account: Signer,
    lpToken: string,
    liquidityMining: LiquidityMining,
    powerToken: PowerToken
) => {
    if (flipCoin()) return;
    const balance = await powerToken.balanceOf(await account.getAddress());
    const delegatedBalance = await powerToken.delegatedToLiquidityMiningBalanceOf(
        await account.getAddress()
    );
    const allowToDelegate = balance.sub(delegatedBalance).div(N1__0_18DEC).toNumber();

    if (allowToDelegate <= 0) return;
    const delegateAmount = randomBigNumberFromInterval(1, allowToDelegate, N1__0_18DEC);
    await powerToken.connect(account).delegateToLiquidityMining([lpToken], [delegateAmount]);
};

const randomWithdrawPwToken = async (
    account: Signer,
    lpToken: string,
    liquidityMining: LiquidityMining,
    powerToken: PowerToken
) => {
    if (flipCoin()) return;

    const balanceOfDelegatedPwToken = await liquidityMining.balanceOfDelegatedPwToken(
        await account.getAddress(),
        [lpToken]
    );
    const balance = balanceOfDelegatedPwToken[0].pwTokenAmount.div(N1__0_18DEC);
    const withdrawAmount = randomBigNumberFromInterval(1, balance.toNumber(), N1__0_18DEC);

    if (balance.lte(ZERO)) return;

    await powerToken.connect(account).undelegateFromLiquidityMining([lpToken], [withdrawAmount]);
};

const randomStakeLpToken = async (
    account: Signer,
    lpToken: string,
    liquidityMining: LiquidityMining
) => {
    if (flipCoin()) return;
    await liquidityMining
        .connect(account)
        .stake(lpToken, randomBigNumberFromInterval(1, 10000, N0__01_18DEC));
};

const randomUnstakeLpToken = async (
    account: Signer,
    lpToken: string,
    liquidityMining: LiquidityMining
) => {
    if (flipCoin()) return;
    const balance = (await liquidityMining.balanceOf(await account.getAddress(), lpToken)).div(
        N1__0_18DEC
    );
    const unstakeAmount = balance.toNumber();

    if (unstakeAmount <= 0) return;
    await liquidityMining
        .connect(account)
        .unstake(lpToken, randomBigNumberFromInterval(1, unstakeAmount, N1__0_18DEC));
};

describe("LiquidityMining unstake lpToken", () => {
    const N100__0_18DEC = N1__0_18DEC.mul(BigNumber.from("100"));
    const N300__0_18DEC = N1__0_18DEC.mul(BigNumber.from("300"));
    const N2000__0_18DEC = N2__0_18DEC.mul(BigNumber.from("1000"));

    let tokens: Tokens;
    let liquidityMining: LiquidityMining;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;
    let adminAddress: string,
        userOneAddress: string,
        userTwoAddress: string,
        userThreeAddress: string;

    let stakedToken: MockStakedToken;
    let powerToken: PowerToken;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();
        adminAddress = await admin.getAddress();
        userOneAddress = await userOne.getAddress();
        userTwoAddress = await userTwo.getAddress();
        userThreeAddress = await userThree.getAddress();

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
        await tokens.lpTokenDai
            .connect(userThree)
            .approve(liquidityMining.address, TOTAL_SUPPLY_18_DECIMALS);

        await tokens.lpTokenUsdc.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdc
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdc
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdc
            .connect(userThree)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);

        await tokens.lpTokenUsdt.approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdt
            .connect(userOne)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdt
            .connect(userTwo)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.lpTokenUsdt
            .connect(userThree)
            .approve(liquidityMining.address, TOTAL_SUPPLY_6_DECIMALS);

        await stakedToken.approve(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await stakedToken.connect(userOne).approve(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);

        await stakedToken.connect(userTwo).approve(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await stakedToken.connect(userThree).approve(powerToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await stakedToken.transfer(
            await userOne.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("3000000"))
        );
        await stakedToken.transfer(
            await userTwo.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("3000000"))
        );
        await stakedToken.transfer(
            await userThree.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("3000000"))
        );
        await stakedToken.transfer(
            liquidityMining.address,
            N1__0_18DEC.mul(BigNumber.from("30000000"))
        );
        await powerToken.setLiquidityMining(liquidityMining.address);
    });

    it("Should stake and unstake 1 users", async () => {
        //    given
        const dai = tokens.lpTokenDai.address;

        // UserOne
        await powerToken.connect(userOne).stake(N100__0_18DEC);
        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const userOneStakedTokenBalance = await powerToken.balanceOf(await userOne.getAddress());
        const pwTokenExchangeRateBefore = await powerToken.calculateExchangeRate();

        // when
        for (let i = 0; i < 50; i++) {
            await liquidityMining
                .connect(userOne)
                .stake(dai, N2__0_18DEC.mul(BigNumber.from("1000")));
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
        }

        await liquidityMining.connect(userOne).unstake(dai, N1__0_18DEC);

        // then
        const userOneStakedTokenAfter = await powerToken.balanceOf(await userOne.getAddress());
        const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const pwTokenExchangeRateAfter = await powerToken.calculateExchangeRate();

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(userOneStakedTokenBalance).to.be.equal(N100__0_18DEC);
        expect(accruedRewardsAfter).to.be.equal(
            userOneStakedTokenAfter.sub(userOneStakedTokenBalance)
        );
        expect(pwTokenExchangeRateBefore).to.be.equal(pwTokenExchangeRateAfter);
    });

    it("Should revert when stakedToken balance on liquidityMining to low", async () => {
        //    given
        const dai = tokens.lpTokenDai.address;
        await powerToken.connect(userOne).stake(N100__0_18DEC);
        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        // when
        await liquidityMining.connect(userOne).stake(dai, N2__0_18DEC.mul(BigNumber.from("1000")));
        await hre.network.provider.send("hardhat_mine", ["0x2625A00"]);

        await expect(liquidityMining.connect(userOne).unstake(dai, N1__0_18DEC)).to.revertedWith(
            "ERC20: transfer amount exceeds balance"
        );
    });

    it("Should stake and unstakeAndAllocatePwTokens 1 users", async () => {
        //    given
        const dai = tokens.lpTokenDai.address;

        await powerToken.connect(userOne).stake(N100__0_18DEC);
        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const accountRewardsBefore = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );
        const accountAllocatedRewardsBefore = await liquidityMining.balanceOfAllocatedPwTokens(
            await userOne.getAddress()
        );
        const userOneStakedTokenBalance = await powerToken.balanceOf(await userOne.getAddress());
        const pwTokenExchangeRateBefore = await powerToken.calculateExchangeRate();

        // when
        await liquidityMining.connect(userOne).stake(dai, N2__0_18DEC);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await liquidityMining.connect(userOne).unstakeAndAllocatePwTokens(dai, N2__0_18DEC);

        // then
        const userOneStakedTokenAfter = await powerToken.balanceOf(await userOne.getAddress());
        const accountRewardsAfter = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );
        const pwTokenExchangeRateAfter = await powerToken.calculateExchangeRate();
        const accountAllocatedRewardsAfter = await liquidityMining.balanceOfAllocatedPwTokens(
            await userOne.getAddress()
        );

        expect(accountRewardsBefore).to.be.equal(ZERO);
        expect(accountRewardsAfter).to.be.equal(ZERO);
        expect(accountAllocatedRewardsBefore).to.be.equal(ZERO);
        expect(accountAllocatedRewardsAfter).to.be.equal(BigNumber.from("101").mul(N1__0_18DEC));
        expect(userOneStakedTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userOneStakedTokenAfter).to.be.equal(N100__0_18DEC);
        expect(pwTokenExchangeRateBefore).to.be.equal(pwTokenExchangeRateAfter);
    });

    it("Should stake and unstake 2 users", async () => {
        //    given
        const dai = tokens.lpTokenDai.address;

        // UserOne
        await powerToken.connect(userOne).stake(N100__0_18DEC);
        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        // UserTwo
        await powerToken.connect(userTwo).stake(N100__0_18DEC);
        await powerToken
            .connect(userTwo)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const userOneStakedTokenBalance = await powerToken.balanceOf(await userOne.getAddress());
        const userTwoStakedTokenBalance = await powerToken.balanceOf(await userTwo.getAddress());
        const pwTokenExchangeRateBefore = await powerToken.calculateExchangeRate();

        // when
        for (let i = 0; i < 50; i++) {
            await liquidityMining.connect(userTwo).stake(dai, N2__0_18DEC);
            await liquidityMining.connect(userOne).stake(dai, N2000__0_18DEC);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
        }
        const userOneBalance = await liquidityMining.balanceOf(userOneAddress, dai);
        const userTwoBalance = await liquidityMining.balanceOf(userTwoAddress, dai);
        await liquidityMining.connect(userOne).unstake(dai, userOneBalance);
        await liquidityMining.connect(userTwo).unstake(dai, userTwoBalance);

        // then

        const userOneStakedTokenAfter = await powerToken.balanceOf(await userOne.getAddress());
        const userTwoStakedTokenAfter = await powerToken.balanceOf(await userTwo.getAddress());
        const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const sumOfRewards = userOneStakedTokenAfter
            .add(userTwoStakedTokenAfter)
            .sub(userTwoStakedTokenBalance)
            .sub(userOneStakedTokenBalance);
        const pwTokenExchangeRateAfter = await powerToken.calculateExchangeRate();
        const allRewardsMinusUsersRewards = accruedRewardsAfter.sub(sumOfRewards).abs();

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(userOneStakedTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userTwoStakedTokenBalance).to.be.equal(N100__0_18DEC);
        expect(accruedRewardsAfter).to.be.equal(BigNumber.from("5101").mul(N1__0_18DEC));
        expect(allRewardsMinusUsersRewards.lt(BigNumber.from("10"))).to.be.true;
        expect(pwTokenExchangeRateBefore).to.be.equal(pwTokenExchangeRateAfter);
    });

    it("Should stake and unstake 3 users", async () => {
        //    given
        const dai = tokens.lpTokenDai.address;

        // Admin
        await powerToken.stake(N100__0_18DEC);
        await powerToken.delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        // UserOne
        await powerToken.connect(userOne).stake(N100__0_18DEC);
        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        // UserTwo
        await powerToken.connect(userTwo).stake(N100__0_18DEC);
        await powerToken
            .connect(userTwo)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const adminStakedTokenBalance = await powerToken.balanceOf(await admin.getAddress());
        const userOneStakedTokenBalance = await powerToken.balanceOf(await userOne.getAddress());
        const userTwoStakedTokenBalance = await powerToken.balanceOf(await userTwo.getAddress());
        const pwTokenExchangeRateBefore = await powerToken.calculateExchangeRate();

        // when
        for (let i = 0; i < 50; i++) {
            await liquidityMining.stake(dai, N1__0_18DEC);
            await liquidityMining
                .connect(userOne)
                .stake(dai, N2__0_18DEC.mul(BigNumber.from("1000")));
            await liquidityMining.connect(userTwo).stake(dai, N0__1_18DEC);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
        }

        await liquidityMining.unstake(dai, N1__0_18DEC);
        await liquidityMining.connect(userOne).unstake(dai, N1__0_18DEC);
        await liquidityMining.connect(userTwo).unstake(dai, N1__0_18DEC);

        const adminBalance = await liquidityMining.balanceOf(adminAddress, dai);
        const userOneBalance = await liquidityMining.balanceOf(userOneAddress, dai);
        const userTwoBalance = await liquidityMining.balanceOf(userTwoAddress, dai);
        await liquidityMining.unstake(dai, adminBalance);
        await liquidityMining.connect(userOne).unstake(dai, userOneBalance);
        await liquidityMining.connect(userTwo).unstake(dai, userTwoBalance);

        // then

        const adminStakedTokenAfter = await powerToken.balanceOf(await admin.getAddress());
        const userOneStakedTokenAfter = await powerToken.balanceOf(await userOne.getAddress());
        const userTwoStakedTokenAfter = await powerToken.balanceOf(await userTwo.getAddress());
        const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const sumOfRewards = adminStakedTokenAfter
            .add(userOneStakedTokenAfter)
            .add(userTwoStakedTokenAfter)
            .sub(N300__0_18DEC);
        const pwTokenExchangeRateAfter = await powerToken.calculateExchangeRate();
        const allRewardsMinusUsersRewards = accruedRewardsAfter.sub(sumOfRewards).abs();

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(adminStakedTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userOneStakedTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userTwoStakedTokenBalance).to.be.equal(N100__0_18DEC);

        expect(accruedRewardsAfter).to.be.equal(BigNumber.from("5155").mul(N1__0_18DEC));
        expect(allRewardsMinusUsersRewards.lt(BigNumber.from("10"))).to.be.true;
        expect(pwTokenExchangeRateBefore).to.be.equal(pwTokenExchangeRateAfter);
    });

    it("Should stake and unstake, 3 users when block rewards change", async () => {
        //    given
        const dai = tokens.lpTokenDai.address;

        // Admin
        await powerToken.stake(N100__0_18DEC);
        await powerToken.delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        // UserOne
        await powerToken.connect(userOne).stake(N100__0_18DEC);
        await powerToken
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        // UserTwo
        await powerToken.connect(userTwo).stake(N100__0_18DEC);
        await powerToken
            .connect(userTwo)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const adminStakedTokenBalance = await powerToken.balanceOf(await admin.getAddress());
        const userOneStakedTokenBalance = await powerToken.balanceOf(await userOne.getAddress());
        const userTwoStakedTokenBalance = await powerToken.balanceOf(await userTwo.getAddress());
        const pwTokenExchangeRateBefore = await powerToken.calculateExchangeRate();

        // when
        for (let i = 0; i < 50; i++) {
            await liquidityMining.stake(dai, N1__0_18DEC);
            await liquidityMining
                .connect(userOne)
                .stake(dai, N2__0_18DEC.mul(BigNumber.from("1000")));
            await liquidityMining.connect(userTwo).stake(dai, N0__1_18DEC);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            if (i % 2 == 0) {
                await liquidityMining.setRewardsPerBlock(dai, BigNumber.from("100000000"));
            } else {
                await liquidityMining.setRewardsPerBlock(dai, BigNumber.from("300000000"));
            }
        }

        const adminBalance = await liquidityMining.balanceOf(adminAddress, dai);
        const userOneBalance = await liquidityMining.balanceOf(userOneAddress, dai);
        const userTwoBalance = await liquidityMining.balanceOf(userTwoAddress, dai);
        await liquidityMining.unstake(dai, adminBalance);
        await liquidityMining.connect(userOne).unstake(dai, userOneBalance);
        await liquidityMining.connect(userTwo).unstake(dai, userTwoBalance);

        // then

        const adminStakedTokenAfter = await powerToken.balanceOf(await admin.getAddress());
        const userOneStakedTokenAfter = await powerToken.balanceOf(await userOne.getAddress());
        const userTwoStakedTokenAfter = await powerToken.balanceOf(await userTwo.getAddress());
        const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const sumOfRewards = adminStakedTokenAfter
            .add(userOneStakedTokenAfter)
            .add(userTwoStakedTokenAfter)
            .sub(N300__0_18DEC);
        const pwTokenExchangeRateAfter = await powerToken.calculateExchangeRate();
        const allRewardsMinusUsersRewards = accruedRewardsAfter.sub(sumOfRewards).abs();

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(adminStakedTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userOneStakedTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userTwoStakedTokenBalance).to.be.equal(N100__0_18DEC);

        expect(allRewardsMinusUsersRewards.lt(BigNumber.from("10"))).to.be.true;
        expect(pwTokenExchangeRateBefore).to.be.equal(pwTokenExchangeRateAfter);
    });

    it("Should random stake and delegate to LiquidityMining", async () => {
        //    given
        const lpDai = tokens.lpTokenDai.address;
        await hre.network.provider.send("hardhat_mine", ["0x9999999"]);

        await powerToken.stake(N100__0_18DEC);
        await powerToken.connect(userOne).stake(N100__0_18DEC);
        await powerToken.connect(userTwo).stake(N100__0_18DEC);
        await powerToken.connect(userThree).stake(N100__0_18DEC);
        const users = [admin, userOne, userTwo, userThree];

        const adminPowerTokenBalanceBefore = await powerToken.balanceOf(await admin.getAddress());
        const userOnePowerTokenBalanceBefore = await powerToken.balanceOf(
            await userOne.getAddress()
        );
        const userTwoPowerTokenBalanceBefore = await powerToken.balanceOf(
            await userTwo.getAddress()
        );
        const userThreePowerTokenBalanceBefore = await powerToken.balanceOf(
            await userThree.getAddress()
        );
        const pwTokenExchangeRateBefore = await powerToken.calculateExchangeRate();

        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );

        // when
        //result for 1000
        // first block:                    47
        // last block:                     2_008_411
        // accruedRewardsAfter:            10_695_898 * 10^18
        // sum of rewards(4 users):        10_695_897.999999999999942012
        // accruedRewards - sumOfRewards = 57988
        for (let i = 0; i < 50; i++) {
            randomChangeBlockReward(lpDai, liquidityMining);
            for (let userIndex = 0; userIndex < users.length; userIndex++) {
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
                await randomDelegateStakedToken(
                    users[userIndex],
                    lpDai,
                    liquidityMining,
                    powerToken
                );
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
                await randomStakeLpToken(users[userIndex], lpDai, liquidityMining);
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
                await randomUnstakeLpToken(users[userIndex], lpDai, liquidityMining);
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
                await randomWithdrawPwToken(users[userIndex], lpDai, liquidityMining, powerToken);
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
            }
        }

        const adminBalance = await liquidityMining.balanceOf(adminAddress, lpDai);
        const userOneBalance = await liquidityMining.balanceOf(userOneAddress, lpDai);
        const userTwoBalance = await liquidityMining.balanceOf(userTwoAddress, lpDai);
        const userThreeBalance = await liquidityMining.balanceOf(userThreeAddress, lpDai);

        await liquidityMining.unstake(lpDai, adminBalance);
        await liquidityMining.connect(userOne).unstake(lpDai, userOneBalance);
        await liquidityMining.connect(userTwo).unstake(lpDai, userTwoBalance);
        await liquidityMining.connect(userThree).unstake(lpDai, userThreeBalance);
        //    then

        const adminStakedTokenBalanceAfter = await powerToken.balanceOf(await admin.getAddress());
        const userOnePowerTokenBalanceAfter = await powerToken.balanceOf(
            await userOne.getAddress()
        );
        const userTwoStakedTokenBalanceAfter = await powerToken.balanceOf(
            await userTwo.getAddress()
        );
        const userThreeStakedTokenBalanceAfter = await powerToken.balanceOf(
            await userThree.getAddress()
        );

        const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );

        const sumOfRewards = adminStakedTokenBalanceAfter
            .add(userOnePowerTokenBalanceAfter)
            .add(userTwoStakedTokenBalanceAfter)
            .add(userThreeStakedTokenBalanceAfter)
            .sub(adminPowerTokenBalanceBefore)
            .sub(userOnePowerTokenBalanceBefore)
            .sub(userTwoPowerTokenBalanceBefore)
            .sub(userThreePowerTokenBalanceBefore);
        const pwTokenExchangeRateAfter = await powerToken.calculateExchangeRate();
        const allRewardsMinusUsersRewards = accruedRewardsAfter.sub(sumOfRewards).abs();

        expect(accruedRewardsBefore).to.be.equal(ZERO);

        expect(allRewardsMinusUsersRewards.lt(BigNumber.from("100000"))).to.be.true;
        expect(pwTokenExchangeRateBefore).to.be.equal(pwTokenExchangeRateAfter);
    });

    it("Should stop adding rewards when unstake and left 0.5 lpDai", async () => {
        //    given
        const lpDai = tokens.lpTokenDai.address;
        await tokens.lpTokenDai.mint(await admin.getAddress(), USD_1_000_000_18DEC);
        await tokens.lpTokenDai.approve(liquidityMining.address, USD_1_000_000_18DEC);

        await network.provider.send("evm_setAutomine", [false]);
        await liquidityMining.stake(lpDai, N2__0_18DEC);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(lpDai);
        const globalIndicatorsBefore = await liquidityMining.getGlobalIndicators(lpDai);

        //    when
        await liquidityMining.unstake(lpDai, N0__1_18DEC.mul(BigNumber.from(15)));
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        //    then

        const accountRewardsAfter = await liquidityMining.calculateAccountRewards(
            await admin.getAddress(),
            lpDai
        );
        const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(lpDai);
        const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(lpDai);

        const globalIndicatorsBeforeExtract = extractGlobalIndicators(globalIndicatorsBefore);
        const globalIndicatorsAfterExtract = extractGlobalIndicators(globalIndicatorsAfter);

        await network.provider.send("evm_setAutomine", [true]);
        expect(accountRewardsAfter).to.be.equal(ZERO);
        expect(accruedRewardsAfter).to.be.equal(accruedRewardsBefore.add(N1__0_18DEC));

        expect(globalIndicatorsBeforeExtract.aggregatedPowerUp).to.be.equal(
            BigNumber.from("799999999999999998")
        );
        expect(globalIndicatorsAfterExtract.aggregatedPowerUp).to.be.equal(ZERO);
        expect(globalIndicatorsBeforeExtract.compositeMultiplierInTheBlock).to.be.equal(
            BigNumber.from("1250000000000000003125000000")
        );
        expect(globalIndicatorsAfterExtract.compositeMultiplierInTheBlock).to.be.equal(ZERO);
    });
});
