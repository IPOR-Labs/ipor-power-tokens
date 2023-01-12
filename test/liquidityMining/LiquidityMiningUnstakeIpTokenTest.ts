import hre, { network, upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { LiquidityMining, MockIporToken, PowerIpor } from "../../types";
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

const randomDelegateIporToken = async (
    account: Signer,
    lpToken: string,
    liquidityMining: LiquidityMining,
    powerIpor: PowerIpor
) => {
    if (flipCoin()) return;
    const balance = await powerIpor.balanceOf(await account.getAddress());
    const delegatedBalance = await powerIpor.delegatedToLiquidityMiningBalanceOf(
        await account.getAddress()
    );
    const allowToDelegate = balance.sub(delegatedBalance).div(N1__0_18DEC).toNumber();

    if (allowToDelegate <= 0) return;
    const delegateAmount = randomBigNumberFromInterval(1, allowToDelegate, N1__0_18DEC);
    await powerIpor.connect(account).delegateToLiquidityMining([lpToken], [delegateAmount]);
};

const randomWithdrawPwIpor = async (
    account: Signer,
    lpToken: string,
    liquidityMining: LiquidityMining,
    powerIpor: PowerIpor
) => {
    if (flipCoin()) return;

    const balanceOfDelegatedPwIpor = await liquidityMining.balanceOfDelegatedPwIpor(
        await account.getAddress(),
        [lpToken]
    );
    const balance = balanceOfDelegatedPwIpor[0].pwIporAmount.div(N1__0_18DEC);
    const withdrawAmount = randomBigNumberFromInterval(1, balance.toNumber(), N1__0_18DEC);

    if (balance.lte(ZERO)) return;

    await powerIpor.connect(account).undelegateFromLiquidityMining([lpToken], [withdrawAmount]);
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

    let iporToken: MockIporToken;
    let powerIpor: PowerIpor;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();
        adminAddress = await admin.getAddress();
        userOneAddress = await userOne.getAddress();
        userTwoAddress = await userTwo.getAddress();
        userThreeAddress = await userThree.getAddress();

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
            [tokens.lpTokenDai.address, tokens.lpTokenUsdc.address, tokens.lpTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
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

        await iporToken.approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.connect(userOne).approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);

        await iporToken.connect(userTwo).approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.connect(userThree).approve(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.transfer(
            await userOne.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("3000000"))
        );
        await iporToken.transfer(
            await userTwo.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("3000000"))
        );
        await iporToken.transfer(
            await userThree.getAddress(),
            N1__0_18DEC.mul(BigNumber.from("3000000"))
        );
        await iporToken.transfer(
            liquidityMining.address,
            N1__0_18DEC.mul(BigNumber.from("30000000"))
        );
        await powerIpor.setLiquidityMining(liquidityMining.address);
    });

    it("Should stake and unstake 1 users", async () => {
        //    given
        const dai = tokens.lpTokenDai.address;

        // UserOne
        await powerIpor.connect(userOne).stake(N100__0_18DEC);
        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const userOneIporTokenBalance = await powerIpor.balanceOf(await userOne.getAddress());
        const pwIporExchangeRateBefore = await powerIpor.calculateExchangeRate();

        // when
        for (let i = 0; i < 50; i++) {
            await liquidityMining
                .connect(userOne)
                .stake(dai, N2__0_18DEC.mul(BigNumber.from("1000")));
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
        }

        await liquidityMining.connect(userOne).unstake(dai, N1__0_18DEC);

        // then
        const userOneIporTokenAfter = await powerIpor.balanceOf(await userOne.getAddress());
        const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const pwIporExchangeRateAfter = await powerIpor.calculateExchangeRate();

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(userOneIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(accruedRewardsAfter).to.be.equal(userOneIporTokenAfter.sub(userOneIporTokenBalance));
        expect(pwIporExchangeRateBefore).to.be.equal(pwIporExchangeRateAfter);
    });

    it("Should revert when iporToken balance on liquidityMining to low", async () => {
        //    given
        const dai = tokens.lpTokenDai.address;
        await powerIpor.connect(userOne).stake(N100__0_18DEC);
        await powerIpor
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

        await powerIpor.connect(userOne).stake(N100__0_18DEC);
        await powerIpor
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
        const userOneIporTokenBalance = await powerIpor.balanceOf(await userOne.getAddress());
        const pwIporExchangeRateBefore = await powerIpor.calculateExchangeRate();

        // when
        await liquidityMining.connect(userOne).stake(dai, N2__0_18DEC);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        await liquidityMining.connect(userOne).unstakeAndAllocatePwTokens(dai, N2__0_18DEC);

        // then
        const userOneIporTokenAfter = await powerIpor.balanceOf(await userOne.getAddress());
        const accountRewardsAfter = await liquidityMining.calculateAccountRewards(
            await userOne.getAddress(),
            tokens.lpTokenDai.address
        );
        const pwIporExchangeRateAfter = await powerIpor.calculateExchangeRate();
        const accountAllocatedRewardsAfter = await liquidityMining.balanceOfAllocatedPwTokens(
            await userOne.getAddress()
        );

        expect(accountRewardsBefore).to.be.equal(ZERO);
        expect(accountRewardsAfter).to.be.equal(ZERO);
        expect(accountAllocatedRewardsBefore).to.be.equal(ZERO);
        expect(accountAllocatedRewardsAfter).to.be.equal(BigNumber.from("101").mul(N1__0_18DEC));
        expect(userOneIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userOneIporTokenAfter).to.be.equal(N100__0_18DEC);
        expect(pwIporExchangeRateBefore).to.be.equal(pwIporExchangeRateAfter);
    });

    it("Should stake and unstake 2 users", async () => {
        //    given
        const dai = tokens.lpTokenDai.address;

        // UserOne
        await powerIpor.connect(userOne).stake(N100__0_18DEC);
        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        // UserTwo
        await powerIpor.connect(userTwo).stake(N100__0_18DEC);
        await powerIpor
            .connect(userTwo)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const userOneIporTokenBalance = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoIporTokenBalance = await powerIpor.balanceOf(await userTwo.getAddress());
        const pwIporExchangeRateBefore = await powerIpor.calculateExchangeRate();

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

        const userOneIporTokenAfter = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoIporTokenAfter = await powerIpor.balanceOf(await userTwo.getAddress());
        const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const sumOfRewards = userOneIporTokenAfter
            .add(userTwoIporTokenAfter)
            .sub(userTwoIporTokenBalance)
            .sub(userOneIporTokenBalance);
        const pwIporExchangeRateAfter = await powerIpor.calculateExchangeRate();
        const allRewardsMinusUsersRewards = accruedRewardsAfter.sub(sumOfRewards).abs();

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(userOneIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userTwoIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(accruedRewardsAfter).to.be.equal(BigNumber.from("5101").mul(N1__0_18DEC));
        expect(allRewardsMinusUsersRewards.lt(BigNumber.from("10"))).to.be.true;
        expect(pwIporExchangeRateBefore).to.be.equal(pwIporExchangeRateAfter);
    });

    it("Should stake and unstake 3 users", async () => {
        //    given
        const dai = tokens.lpTokenDai.address;

        // Admin
        await powerIpor.stake(N100__0_18DEC);
        await powerIpor.delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        // UserOne
        await powerIpor.connect(userOne).stake(N100__0_18DEC);
        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        // UserTwo
        await powerIpor.connect(userTwo).stake(N100__0_18DEC);
        await powerIpor
            .connect(userTwo)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const adminIporTokenBalance = await powerIpor.balanceOf(await admin.getAddress());
        const userOneIporTokenBalance = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoIporTokenBalance = await powerIpor.balanceOf(await userTwo.getAddress());
        const pwIporExchangeRateBefore = await powerIpor.calculateExchangeRate();

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

        const adminIporTokenAfter = await powerIpor.balanceOf(await admin.getAddress());
        const userOneIporTokenAfter = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoIporTokenAfter = await powerIpor.balanceOf(await userTwo.getAddress());
        const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const sumOfRewards = adminIporTokenAfter
            .add(userOneIporTokenAfter)
            .add(userTwoIporTokenAfter)
            .sub(N300__0_18DEC);
        const pwIporExchangeRateAfter = await powerIpor.calculateExchangeRate();
        const allRewardsMinusUsersRewards = accruedRewardsAfter.sub(sumOfRewards).abs();

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(adminIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userOneIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userTwoIporTokenBalance).to.be.equal(N100__0_18DEC);

        expect(accruedRewardsAfter).to.be.equal(BigNumber.from("5155").mul(N1__0_18DEC));
        expect(allRewardsMinusUsersRewards.lt(BigNumber.from("10"))).to.be.true;
        expect(pwIporExchangeRateBefore).to.be.equal(pwIporExchangeRateAfter);
    });

    it("Should stake and unstake, 3 users when block rewards change", async () => {
        //    given
        const dai = tokens.lpTokenDai.address;

        // Admin
        await powerIpor.stake(N100__0_18DEC);
        await powerIpor.delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        // UserOne
        await powerIpor.connect(userOne).stake(N100__0_18DEC);
        await powerIpor
            .connect(userOne)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        // UserTwo
        await powerIpor.connect(userTwo).stake(N100__0_18DEC);
        await powerIpor
            .connect(userTwo)
            .delegateToLiquidityMining([tokens.lpTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const adminIporTokenBalance = await powerIpor.balanceOf(await admin.getAddress());
        const userOneIporTokenBalance = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoIporTokenBalance = await powerIpor.balanceOf(await userTwo.getAddress());
        const pwIporExchangeRateBefore = await powerIpor.calculateExchangeRate();

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

        const adminIporTokenAfter = await powerIpor.balanceOf(await admin.getAddress());
        const userOneIporTokenAfter = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoIporTokenAfter = await powerIpor.balanceOf(await userTwo.getAddress());
        const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );
        const sumOfRewards = adminIporTokenAfter
            .add(userOneIporTokenAfter)
            .add(userTwoIporTokenAfter)
            .sub(N300__0_18DEC);
        const pwIporExchangeRateAfter = await powerIpor.calculateExchangeRate();
        const allRewardsMinusUsersRewards = accruedRewardsAfter.sub(sumOfRewards).abs();

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(adminIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userOneIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userTwoIporTokenBalance).to.be.equal(N100__0_18DEC);

        expect(allRewardsMinusUsersRewards.lt(BigNumber.from("10"))).to.be.true;
        expect(pwIporExchangeRateBefore).to.be.equal(pwIporExchangeRateAfter);
    });

    it("Should random stake and delegate to LiquidityMining", async () => {
        //    given
        const ipDai = tokens.lpTokenDai.address;
        await hre.network.provider.send("hardhat_mine", ["0x9999999"]);

        await powerIpor.stake(N100__0_18DEC);
        await powerIpor.connect(userOne).stake(N100__0_18DEC);
        await powerIpor.connect(userTwo).stake(N100__0_18DEC);
        await powerIpor.connect(userThree).stake(N100__0_18DEC);
        const users = [admin, userOne, userTwo, userThree];

        const adminIporTokenBalanceBefore = await powerIpor.balanceOf(await admin.getAddress());
        const userOneIporTokenBalanceBefore = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoIporTokenBalanceBefore = await powerIpor.balanceOf(await userTwo.getAddress());
        const userThreeIporTokenBalanceBefore = await powerIpor.balanceOf(
            await userThree.getAddress()
        );
        const pwIporExchangeRateBefore = await powerIpor.calculateExchangeRate();

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
            randomChangeBlockReward(ipDai, liquidityMining);
            for (let userIndex = 0; userIndex < users.length; userIndex++) {
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
                await randomDelegateIporToken(users[userIndex], ipDai, liquidityMining, powerIpor);
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
                await randomStakeLpToken(users[userIndex], ipDai, liquidityMining);
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
                await randomUnstakeLpToken(users[userIndex], ipDai, liquidityMining);
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
                await randomWithdrawPwIpor(users[userIndex], ipDai, liquidityMining, powerIpor);
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
            }
        }

        const adminBalance = await liquidityMining.balanceOf(adminAddress, ipDai);
        const userOneBalance = await liquidityMining.balanceOf(userOneAddress, ipDai);
        const userTwoBalance = await liquidityMining.balanceOf(userTwoAddress, ipDai);
        const userThreeBalance = await liquidityMining.balanceOf(userThreeAddress, ipDai);

        await liquidityMining.unstake(ipDai, adminBalance);
        await liquidityMining.connect(userOne).unstake(ipDai, userOneBalance);
        await liquidityMining.connect(userTwo).unstake(ipDai, userTwoBalance);
        await liquidityMining.connect(userThree).unstake(ipDai, userThreeBalance);
        //    then

        const adminIporTokenBalanceAfter = await powerIpor.balanceOf(await admin.getAddress());
        const userOneIporTokenBalanceAfter = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoIporTokenBalanceAfter = await powerIpor.balanceOf(await userTwo.getAddress());
        const userThreeIporTokenBalanceAfter = await powerIpor.balanceOf(
            await userThree.getAddress()
        );

        const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(
            tokens.lpTokenDai.address
        );

        const sumOfRewards = adminIporTokenBalanceAfter
            .add(userOneIporTokenBalanceAfter)
            .add(userTwoIporTokenBalanceAfter)
            .add(userThreeIporTokenBalanceAfter)
            .sub(adminIporTokenBalanceBefore)
            .sub(userOneIporTokenBalanceBefore)
            .sub(userTwoIporTokenBalanceBefore)
            .sub(userThreeIporTokenBalanceBefore);
        const pwIporExchangeRateAfter = await powerIpor.calculateExchangeRate();
        const allRewardsMinusUsersRewards = accruedRewardsAfter.sub(sumOfRewards).abs();

        expect(accruedRewardsBefore).to.be.equal(ZERO);

        expect(allRewardsMinusUsersRewards.lt(BigNumber.from("100000"))).to.be.true;
        expect(pwIporExchangeRateBefore).to.be.equal(pwIporExchangeRateAfter);
    });

    it("Should stop adding rewards when unstake and left 0.5 ipDai", async () => {
        //    given
        const ipDai = tokens.lpTokenDai.address;
        await tokens.lpTokenDai.mint(await admin.getAddress(), USD_1_000_000_18DEC);
        await tokens.lpTokenDai.approve(liquidityMining.address, USD_1_000_000_18DEC);

        await network.provider.send("evm_setAutomine", [false]);
        await liquidityMining.stake(ipDai, N2__0_18DEC);
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsBefore = await liquidityMining.calculateAccruedRewards(ipDai);
        const globalIndicatorsBefore = await liquidityMining.getGlobalIndicators(ipDai);

        //    when
        await liquidityMining.unstake(ipDai, N0__1_18DEC.mul(BigNumber.from(15)));
        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        //    then

        const accountRewardsAfter = await liquidityMining.calculateAccountRewards(
            await admin.getAddress(),
            ipDai
        );
        const accruedRewardsAfter = await liquidityMining.calculateAccruedRewards(ipDai);
        const globalIndicatorsAfter = await liquidityMining.getGlobalIndicators(ipDai);

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
