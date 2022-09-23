import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { John, IporToken, PowerIpor } from "../../types";
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
    powerIpor: PowerIpor
) => {
    if (flipCoin()) return;
    const balance = await powerIpor.balanceOf(await account.getAddress());
    const delegatedBalance = await powerIpor.delegatedBalanceOf(await account.getAddress());
    const allowToDelegate = balance.sub(delegatedBalance).div(N1__0_18DEC).toNumber();

    if (allowToDelegate <= 0) return;
    const delegateAmount = randomBigNumberFromInterval(1, allowToDelegate, N1__0_18DEC);
    await powerIpor.connect(account).delegateToJohn([ipToken], [delegateAmount]);
};

const randomWithdrawPwIpor = async (
    account: Signer,
    ipToken: string,
    john: John,
    powerIpor: PowerIpor
) => {
    if (flipCoin()) return;

    const balanceOfDelegatedPwIpor = await john.balanceOfDelegatedPwIpor(
        await account.getAddress(),
        [ipToken]
    );
    const balance = balanceOfDelegatedPwIpor.balances[0].amount.div(N1__0_18DEC);
    const withdrawAmount = randomBigNumberFromInterval(1, balance.toNumber(), N1__0_18DEC);

    if (balance.lte(ZERO)) return;

    await powerIpor.connect(account).undelegateFromJohn([ipToken], [withdrawAmount]);
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
    let powerIpor: PowerIpor;

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
        await iporToken.transfer(john.address, N1__0_18DEC.mul(BigNumber.from("30000000")));
        await powerIpor.setJohn(john.address);
    });

    it("Should stake 1 users", async () => {
        //    given
        const dai = tokens.ipTokenDai.address;

        // UserOne
        await powerIpor.connect(userOne).stake(N100__0_18DEC);
        await powerIpor
            .connect(userOne)
            .delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);

        const accruedRewardsBefore = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
        const userOneIporTokenBalance = await powerIpor.balanceOf(await userOne.getAddress());
        const pwIporExchangeRateBefore = await powerIpor.calculateExchangeRate();

        // when
        for (let i = 0; i < 50; i++) {
            await john.connect(userOne).stake(dai, N2__0_18DEC.mul(BigNumber.from("1000")));
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
        }

        await john.connect(userOne).unstake(dai, N1__0_18DEC);

        // then
        const userOneIporTokenAfter = await powerIpor.balanceOf(await userOne.getAddress());
        const accruedRewardsAfter = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
        const pwIporExchangeRateAfter = await powerIpor.calculateExchangeRate();

        expect(accruedRewardsBefore).to.be.equal(ZERO);
        expect(userOneIporTokenBalance).to.be.equal(N100__0_18DEC);
        expect(accruedRewardsAfter).to.be.equal(userOneIporTokenAfter.sub(userOneIporTokenBalance));
        expect(pwIporExchangeRateBefore).to.be.equal(pwIporExchangeRateAfter);
    });

    it("Should stake 2 users", async () => {
        //    given
        const dai = tokens.ipTokenDai.address;

        // UserOne
        await powerIpor.connect(userOne).stake(N100__0_18DEC);
        await powerIpor
            .connect(userOne)
            .delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        // UserTwo
        await powerIpor.connect(userTwo).stake(N100__0_18DEC);
        await powerIpor
            .connect(userTwo)
            .delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsBefore = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
        const userOneIporTokenBalance = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoIporTokenBalance = await powerIpor.balanceOf(await userTwo.getAddress());
        const pwIporExchangeRateBefore = await powerIpor.calculateExchangeRate();

        // when
        for (let i = 0; i < 50; i++) {
            await john.connect(userTwo).stake(dai, N2__0_18DEC);
            await john.connect(userOne).stake(dai, N2000__0_18DEC);
            await hre.network.provider.send("hardhat_mine", ["0x64"]);
        }
        const userOneBalance = await john.connect(userOne).balanceOf(dai);
        const userTwoBalance = await john.connect(userTwo).balanceOf(dai);
        await john.connect(userOne).unstake(dai, userOneBalance);
        await john.connect(userTwo).unstake(dai, userTwoBalance);

        // then

        const userOneIporTokenAfter = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoIporTokenAfter = await powerIpor.balanceOf(await userTwo.getAddress());
        const accruedRewardsAfter = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
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

    it("Should stake 3 users", async () => {
        //    given
        const dai = tokens.ipTokenDai.address;

        // Admin
        await powerIpor.stake(N100__0_18DEC);
        await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        // UserOne
        await powerIpor.connect(userOne).stake(N100__0_18DEC);
        await powerIpor
            .connect(userOne)
            .delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        // UserTwo
        await powerIpor.connect(userTwo).stake(N100__0_18DEC);
        await powerIpor
            .connect(userTwo)
            .delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsBefore = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
        const adminIporTokenBalance = await powerIpor.balanceOf(await admin.getAddress());
        const userOneIporTokenBalance = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoIporTokenBalance = await powerIpor.balanceOf(await userTwo.getAddress());
        const pwIporExchangeRateBefore = await powerIpor.calculateExchangeRate();

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

        const adminIporTokenAfter = await powerIpor.balanceOf(await admin.getAddress());
        const userOneIporTokenAfter = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoIporTokenAfter = await powerIpor.balanceOf(await userTwo.getAddress());
        const accruedRewardsAfter = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
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

    it("Should stake 3 users when block rewards change", async () => {
        //    given
        const dai = tokens.ipTokenDai.address;

        // Admin
        await powerIpor.stake(N100__0_18DEC);
        await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        // UserOne
        await powerIpor.connect(userOne).stake(N100__0_18DEC);
        await powerIpor
            .connect(userOne)
            .delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        // UserTwo
        await powerIpor.connect(userTwo).stake(N100__0_18DEC);
        await powerIpor
            .connect(userTwo)
            .delegateToJohn([tokens.ipTokenDai.address], [N100__0_18DEC]);

        await hre.network.provider.send("hardhat_mine", ["0x64"]);
        const accruedRewardsBefore = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
        const adminIporTokenBalance = await powerIpor.balanceOf(await admin.getAddress());
        const userOneIporTokenBalance = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoIporTokenBalance = await powerIpor.balanceOf(await userTwo.getAddress());
        const pwIporExchangeRateBefore = await powerIpor.calculateExchangeRate();

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

        const adminIporTokenAfter = await powerIpor.balanceOf(await admin.getAddress());
        const userOneIporTokenAfter = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoIporTokenAfter = await powerIpor.balanceOf(await userTwo.getAddress());
        const accruedRewardsAfter = await john.calculateAccruedRewards(tokens.ipTokenDai.address);
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

    it("Should random stake and delegate to rewards contracts", async () => {
        //    given
        const ipDai = tokens.ipTokenDai.address;
        await hre.network.provider.send("hardhat_mine", ["0x9999999"]);
        const blockNumberBefore = (await hre.ethers.provider.getBlock("latest")).number;

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
                await randomDelegateIporToken(users[userIndex], ipDai, john, powerIpor);
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
                await randomStakeIpToken(users[userIndex], ipDai, john);
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
                await randomUnstakeIpToken(users[userIndex], ipDai, john);
                await hre.network.provider.send("hardhat_mine", ["0x64"]);
                await randomWithdrawPwIpor(users[userIndex], ipDai, john, powerIpor);
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

        const adminIporTokenBalanceAfter = await powerIpor.balanceOf(await admin.getAddress());
        const userOneIporTokenBalanceAfter = await powerIpor.balanceOf(await userOne.getAddress());
        const userTwoIporTokenBalanceAfter = await powerIpor.balanceOf(await userTwo.getAddress());
        const userThreeIporTokenBalanceAfter = await powerIpor.balanceOf(
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
        const pwIporExchangeRateAfter = await powerIpor.calculateExchangeRate();
        const allRewardsMinusUsersRewards = accruedRewardsAfter.sub(sumOfRewards).abs();

        expect(accruedRewardsBefore).to.be.equal(ZERO);

        expect(allRewardsMinusUsersRewards.lt(BigNumber.from("100000"))).to.be.true;
        expect(pwIporExchangeRateBefore).to.be.equal(pwIporExchangeRateAfter);
    });
});
