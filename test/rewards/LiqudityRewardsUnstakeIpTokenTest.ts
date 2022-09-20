import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { John, IporToken, PwIporToken } from "../../types";
import { Tokens, getDeployedTokens } from "../utils/JohnUtils";
import {
    N1__0_18DEC,
    ZERO,
    TOTAL_SUPPLY_18_DECIMALS,
    TOTAL_SUPPLY_6_DECIMALS,
    N2__0_18DEC,
    N0__1_18DEC,
    N0__01_18DEC,
} from "../utils/Constants";

chai.use(solidity);
const { expect } = chai;

const randomBigNumberFromInterval = (min: number, max: number, decimal: BigNumber): BigNumber => {
    return BigNumber.from(Math.floor(Math.random() * (max - min + 1) + min)).mul(decimal);
};
const flipCoin = (): boolean => Math.random() < 0.5;

const randomChangeBlockReward = async (ipToken: string, john: John) => {
    if (flipCoin()) {
        john.setRewardsPerBlock(
            ipToken,
            randomBigNumberFromInterval(1, 10, BigNumber.from("100000000"))
        );
    }
};

const randomDelegateIporToken = async (
    account: Signer,
    ipToken: string,
    john: John,
    pwIporToken: PwIporToken
) => {
    if (flipCoin()) return;
    const balance = await pwIporToken.balanceOf(await account.getAddress());
    const delegatedBalance = await pwIporToken.delegatedBalanceOf(await account.getAddress());
    const allowToDelegate = balance.sub(delegatedBalance).div(N1__0_18DEC).toNumber();

    if (allowToDelegate <= 0) return;
    const delegateAmount = randomBigNumberFromInterval(1, allowToDelegate, N1__0_18DEC);
    await pwIporToken.connect(account).delegateToJohn([ipToken], [delegateAmount]);
};

const randomWithdrawPwToken = async (
    account: Signer,
    ipToken: string,
    john: John,
    pwIporToken: PwIporToken
) => {
    if (flipCoin()) return;

    const balanceOfDelegatedPwToken = await john.balanceOfDelegatedPwIpor(
        await account.getAddress(),
        [ipToken]
    );
    const balance = balanceOfDelegatedPwToken.balances[0].amount.div(N1__0_18DEC);
    const withdrawAmount = randomBigNumberFromInterval(1, balance.toNumber(), N1__0_18DEC);

    if (balance.lte(ZERO)) return;

    await pwIporToken.connect(account).undelegateFromJohn(ipToken, withdrawAmount);
};

const randomStakeIpToken = async (account: Signer, ipToken: string, john: John) => {
    if (flipCoin()) return;
    await john.connect(account).stake(ipToken, randomBigNumberFromInterval(1, 10000, N0__01_18DEC));
};

const randomUnstakeIpToken = async (account: Signer, ipToken: string, john: John) => {
    if (flipCoin()) return;
    const balance = (await john.connect(account).balanceOf(ipToken)).div(N1__0_18DEC);
    const unstakeAmount = balance.toNumber();

    if (unstakeAmount <= 0) return;
    await john
        .connect(account)
        .unstake(ipToken, randomBigNumberFromInterval(1, unstakeAmount, N1__0_18DEC));
};

describe("John claim", () => {
    const N100__0_18DEC = N1__0_18DEC.mul(BigNumber.from("100"));
    const N300__0_18DEC = N1__0_18DEC.mul(BigNumber.from("300"));
    const N2000__0_18DEC = N2__0_18DEC.mul(BigNumber.from("1000"));

    let tokens: Tokens;
    let john: John;
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

        const John = await hre.ethers.getContractFactory("John");
        john = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            pwIporToken.address,
            iporToken.address,
        ])) as John;

        await tokens.ipTokenDai.approve(john.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenDai.connect(userOne).approve(john.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenDai.connect(userTwo).approve(john.address, TOTAL_SUPPLY_18_DECIMALS);
        await tokens.ipTokenDai.connect(userThree).approve(john.address, TOTAL_SUPPLY_18_DECIMALS);

        await tokens.ipTokenUsdc.approve(john.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdc.connect(userOne).approve(john.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdc.connect(userTwo).approve(john.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdc.connect(userThree).approve(john.address, TOTAL_SUPPLY_6_DECIMALS);

        await tokens.ipTokenUsdt.approve(john.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdt.connect(userOne).approve(john.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdt.connect(userTwo).approve(john.address, TOTAL_SUPPLY_6_DECIMALS);
        await tokens.ipTokenUsdt.connect(userThree).approve(john.address, TOTAL_SUPPLY_6_DECIMALS);

        await iporToken.approve(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.connect(userOne).approve(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);

        await iporToken.connect(userTwo).approve(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);
        await iporToken.connect(userThree).approve(pwIporToken.address, TOTAL_SUPPLY_18_DECIMALS);
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
        await iporToken.transfer(john.address, N1__0_18DEC.mul(BigNumber.from("30000000")));
        await pwIporToken.setJohn(john.address);
    });

    it("Should stake 1 users", async () => {
        //    given
        const dai = tokens.ipTokenDai.address;

        // UserOne
        await pwIporToken.connect(userOne).stake(N100__0_18DEC);
        await pwIporToken
            .connect(userOne)
            .delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const accruedRewardsBefore = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
        const userOneIporTokenBalance = await pwIporToken.balanceOf(await userOne.getAddress());
        const pwTokenExchangeRateBefore = await pwIporToken.calculateExchangeRate();

        // when
        for (let i = 0; i < 50; i++) {
            await john.connect(userOne).stake(dai, N2__0_18DEC.mul(BigNumber.from("1000")));
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
        }

        await john.connect(userOne).unstake(dai, N1__0_18DEC);

        // then
        const userOneIporTokenAfter = await pwIporToken.balanceOf(await userOne.getAddress());
        const accruedRewardsAfter = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
        const pwTokenExchangeRateAfter = await pwIporToken.calculateExchangeRate();

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(userOneIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(accruedRewardsAfter).to.be.equal(userOneIporTokenAfter.sub(userOneIporTokenBalance));
        expect(pwTokenExchangeRateBefore).to.be.equal(pwTokenExchangeRateAfter);
    });

    it("Should stake 2 users", async () => {
        //    given
        const dai = tokens.ipTokenDai.address;

        // UserOne
        await pwIporToken.connect(userOne).stake(N100__0_18DEC);
        await pwIporToken
            .connect(userOne)
            .delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        // UserTwo
        await pwIporToken.connect(userTwo).stake(N100__0_18DEC);
        await pwIporToken
            .connect(userTwo)
            .delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsBefore = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
        const userOneIporTokenBalance = await pwIporToken.balanceOf(await userOne.getAddress());
        const userTwoIporTokenBalance = await pwIporToken.balanceOf(await userTwo.getAddress());
        const pwTokenExchangeRateBefore = await pwIporToken.calculateExchangeRate();

        // when
        for (let i = 0; i < 50; i++) {
            await john.connect(userTwo).stake(dai, N0__1_18DEC);
            await john.connect(userOne).stake(dai, N2000__0_18DEC);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
        }
        const userOneBalance = await john.connect(userOne).balanceOf(dai);
        const userTwoBalance = await john.connect(userTwo).balanceOf(dai);
        await john.connect(userOne).unstake(dai, userOneBalance);
        await john.connect(userTwo).unstake(dai, userTwoBalance);

        // then

        const userOneIporTokenAfter = await pwIporToken.balanceOf(await userOne.getAddress());
        const userTwoIporTokenAfter = await pwIporToken.balanceOf(await userTwo.getAddress());
        const accruedRewardsAfter = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
        const sumOfRewards = userOneIporTokenAfter
            .add(userTwoIporTokenAfter)
            .sub(userTwoIporTokenBalance)
            .sub(userOneIporTokenBalance);
        const pwTokenExchangeRateAfter = await pwIporToken.calculateExchangeRate();
        const allRewardsMinusUsersRewards = accruedRewardsAfter.sub(sumOfRewards).abs();

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(userOneIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userTwoIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(accruedRewardsAfter).to.be.equal(BigNumber.from("5101").mul(N1__0_18DEC));
        expect(allRewardsMinusUsersRewards.lt(BigNumber.from("10"))).to.be.true;
        expect(pwTokenExchangeRateBefore).to.be.equal(pwTokenExchangeRateAfter);
    });

    it("Should stake 3 users", async () => {
        //    given
        const dai = tokens.ipTokenDai.address;

        // Admin
        await pwIporToken.stake(N100__0_18DEC);
        await pwIporToken.delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        // UserOne
        await pwIporToken.connect(userOne).stake(N100__0_18DEC);
        await pwIporToken
            .connect(userOne)
            .delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        // UserTwo
        await pwIporToken.connect(userTwo).stake(N100__0_18DEC);
        await pwIporToken
            .connect(userTwo)
            .delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsBefore = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
        const adminIporTokenBalance = await pwIporToken.balanceOf(await admin.getAddress());
        const userOneIporTokenBalance = await pwIporToken.balanceOf(await userOne.getAddress());
        const userTwoIporTokenBalance = await pwIporToken.balanceOf(await userTwo.getAddress());
        const pwTokenExchangeRateBefore = await pwIporToken.calculateExchangeRate();

        // when
        for (let i = 0; i < 50; i++) {
            await john.stake(dai, N1__0_18DEC);
            await john.connect(userOne).stake(dai, N2__0_18DEC.mul(BigNumber.from("1000")));
            await john.connect(userTwo).stake(dai, N0__1_18DEC);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
        }

        await john.unstake(dai, N1__0_18DEC);
        await john.connect(userOne).unstake(dai, N1__0_18DEC);
        await john.connect(userTwo).unstake(dai, N1__0_18DEC);

        const adminBalance = await john.balanceOf(dai);
        const userOneBalance = await john.connect(userOne).balanceOf(dai);
        const userTwoBalance = await john.connect(userTwo).balanceOf(dai);
        await john.unstake(dai, adminBalance);
        await john.connect(userOne).unstake(dai, userOneBalance);
        await john.connect(userTwo).unstake(dai, userTwoBalance);

        // then

        const adminIporTokenAfter = await pwIporToken.balanceOf(await admin.getAddress());
        const userOneIporTokenAfter = await pwIporToken.balanceOf(await userOne.getAddress());
        const userTwoIporTokenAfter = await pwIporToken.balanceOf(await userTwo.getAddress());
        const accruedRewardsAfter = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
        const sumOfRewards = adminIporTokenAfter
            .add(userOneIporTokenAfter)
            .add(userTwoIporTokenAfter)
            .sub(N300__0_18DEC);
        const pwTokenExchangeRateAfter = await pwIporToken.calculateExchangeRate();
        const allRewardsMinusUsersRewards = accruedRewardsAfter.sub(sumOfRewards).abs();

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(adminIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userOneIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userTwoIporTokenBalance).to.be.equal(N100__0_18DEC);

        expect(accruedRewardsAfter).to.be.equal(BigNumber.from("5155").mul(N1__0_18DEC));
        expect(allRewardsMinusUsersRewards.lt(BigNumber.from("10"))).to.be.true;
        expect(pwTokenExchangeRateBefore).to.be.equal(pwTokenExchangeRateAfter);
    });

    it("Should stake 3 users when block rewards change", async () => {
        //    given
        const dai = tokens.ipTokenDai.address;

        // Admin
        await pwIporToken.stake(N100__0_18DEC);
        await pwIporToken.delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        // UserOne
        await pwIporToken.connect(userOne).stake(N100__0_18DEC);
        await pwIporToken
            .connect(userOne)
            .delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        // UserTwo
        await pwIporToken.connect(userTwo).stake(N100__0_18DEC);
        await pwIporToken
            .connect(userTwo)
            .delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsBefore = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
        const adminIporTokenBalance = await pwIporToken.balanceOf(await admin.getAddress());
        const userOneIporTokenBalance = await pwIporToken.balanceOf(await userOne.getAddress());
        const userTwoIporTokenBalance = await pwIporToken.balanceOf(await userTwo.getAddress());
        const pwTokenExchangeRateBefore = await pwIporToken.calculateExchangeRate();

        // when
        for (let i = 0; i < 50; i++) {
            await john.stake(dai, N1__0_18DEC);
            await john.connect(userOne).stake(dai, N2__0_18DEC.mul(BigNumber.from("1000")));
            await john.connect(userTwo).stake(dai, N0__1_18DEC);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
            if (i % 2 == 0) {
                await john.setRewardsPerBlock(dai, BigNumber.from("100000000"));
            } else {
                await john.setRewardsPerBlock(dai, BigNumber.from("300000000"));
            }
        }

        const adminBalance = await john.balanceOf(dai);
        const userOneBalance = await john.connect(userOne).balanceOf(dai);
        const userTwoBalance = await john.connect(userTwo).balanceOf(dai);
        await john.unstake(dai, adminBalance);
        await john.connect(userOne).unstake(dai, userOneBalance);
        await john.connect(userTwo).unstake(dai, userTwoBalance);

        // then

        const adminIporTokenAfter = await pwIporToken.balanceOf(await admin.getAddress());
        const userOneIporTokenAfter = await pwIporToken.balanceOf(await userOne.getAddress());
        const userTwoIporTokenAfter = await pwIporToken.balanceOf(await userTwo.getAddress());
        const accruedRewardsAfter = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
        const sumOfRewards = adminIporTokenAfter
            .add(userOneIporTokenAfter)
            .add(userTwoIporTokenAfter)
            .sub(N300__0_18DEC);
        const pwTokenExchangeRateAfter = await pwIporToken.calculateExchangeRate();
        const allRewardsMinusUsersRewards = accruedRewardsAfter.sub(sumOfRewards).abs();

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(adminIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userOneIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(userTwoIporTokenBalance).to.be.equal(N100__0_18DEC);

        expect(allRewardsMinusUsersRewards.lt(BigNumber.from("10"))).to.be.true;
        expect(pwTokenExchangeRateBefore).to.be.equal(pwTokenExchangeRateAfter);
    });

    it("Should random stake and delegate to rewards contracts", async () => {
        //    given
        const ipDai = tokens.ipTokenDai.address;
        await hre.network.provider.send("hardhat_mine", ["0x9999999"]);
        const blockNumberBefore = (await hre.ethers.provider.getBlock("latest")).number;

        await pwIporToken.stake(N100__0_18DEC);
        await pwIporToken.connect(userOne).stake(N100__0_18DEC);
        await pwIporToken.connect(userTwo).stake(N100__0_18DEC);
        await pwIporToken.connect(userThree).stake(N100__0_18DEC);
        const users = [admin, userOne, userTwo, userThree];

        const adminIporTokenBalanceBefore = await pwIporToken.balanceOf(await admin.getAddress());
        const userOneIporTokenBalanceBefore = await pwIporToken.balanceOf(
            await userOne.getAddress()
        );
        const userTwoIporTokenBalanceBefore = await pwIporToken.balanceOf(
            await userTwo.getAddress()
        );
        const userThreeIporTokenBalanceBefore = await pwIporToken.balanceOf(
            await userThree.getAddress()
        );
        const pwTokenExchangeRateBefore = await pwIporToken.calculateExchangeRate();

        const accruedRewardsBefore = await john.calculateAccruedRewards(tokens.ipTokenDai.address);

        // when
        //result for 1000
        // first block:                    47
        // last block:                     2_008_411
        // accruedRewardsAfter:            10_695_898 * 10^18
        // sum of rewards(4 users):        10_695_897.999999999999942012
        // accruedRewards - sumOfRewards = 57988
        for (let i = 0; i < 50; i++) {
            randomChangeBlockReward(ipDai, john);
            for (let userIndex = 0; userIndex < users.length; userIndex++) {
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
                await randomDelegateIporToken(users[userIndex], ipDai, john, pwIporToken);
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
                await randomStakeIpToken(users[userIndex], ipDai, john);
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
                await randomUnstakeIpToken(users[userIndex], ipDai, john);
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
                await randomWithdrawPwToken(users[userIndex], ipDai, john, pwIporToken);
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
            }
        }

        const adminBalance = await john.balanceOf(ipDai);
        const userOneBalance = await john.connect(userOne).balanceOf(ipDai);
        const userTwoBalance = await john.connect(userTwo).balanceOf(ipDai);
        const userThreeBalance = await john.connect(userThree).balanceOf(ipDai);

        await john.unstake(ipDai, adminBalance);
        await john.connect(userOne).unstake(ipDai, userOneBalance);
        await john.connect(userTwo).unstake(ipDai, userTwoBalance);
        await john.connect(userThree).unstake(ipDai, userThreeBalance);
        //    then

        const adminIporTokenBalanceAfter = await pwIporToken.balanceOf(await admin.getAddress());
        const userOneIporTokenBalanceAfter = await pwIporToken.balanceOf(
            await userOne.getAddress()
        );
        const userTwoIporTokenBalanceAfter = await pwIporToken.balanceOf(
            await userTwo.getAddress()
        );
        const userThreeIporTokenBalanceAfter = await pwIporToken.balanceOf(
            await userThree.getAddress()
        );

        const accruedRewardsAfter = await john.calculateAccruedRewards(tokens.ipTokenDai.address);

        const sumOfRewards = adminIporTokenBalanceAfter
            .add(userOneIporTokenBalanceAfter)
            .add(userTwoIporTokenBalanceAfter)
            .add(userThreeIporTokenBalanceAfter)
            .sub(adminIporTokenBalanceBefore)
            .sub(userOneIporTokenBalanceBefore)
            .sub(userTwoIporTokenBalanceBefore)
            .sub(userThreeIporTokenBalanceBefore);
        const pwTokenExchangeRateAfter = await pwIporToken.calculateExchangeRate();
        const allRewardsMinusUsersRewards = accruedRewardsAfter.sub(sumOfRewards).abs();

        expect(accruedRewardsBefore).to.be.equal(ZERO);

        expect(allRewardsMinusUsersRewards.lt(BigNumber.from("100000"))).to.be.true;
        expect(pwTokenExchangeRateBefore).to.be.equal(pwTokenExchangeRateAfter);
    });
});
