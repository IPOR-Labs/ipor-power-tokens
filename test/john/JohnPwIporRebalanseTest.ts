import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { John, MockIporToken, PowerIpor, JohnForTests } from "../../types";
import { Tokens, getDeployedTokens } from "../utils/JohnUtils";
import {
    N1__0_18DEC,
    ZERO,
    N0__1_18DEC,
    N0__01_18DEC,
    N2__0_18DEC,
    N1__0_8DEC,
} from "../utils/Constants";
import { JohnTypes } from "../../types/John";

chai.use(solidity);
const { expect } = chai;

const expectedBalances = (
    amounts: BigNumber[],
    response: JohnTypes.DelegatedPwIporBalanceStruct[]
) => {
    for (let i = 0; i < 3; i++) {
        expect(response[i].pwIporAmount).to.be.equal(amounts[i]);
    }
};

describe("John rebalance ", () => {
    let tokens: Tokens;
    let powerIpor: PowerIpor;
    let iporToken: MockIporToken;
    let john: John;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();

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

        const John = await hre.ethers.getContractFactory("John");

        john = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as John;

        await tokens.ipTokenDai.approve(john.address, N2__0_18DEC);
        await tokens.ipTokenUsdc.approve(john.address, N2__0_18DEC);
        await tokens.ipTokenUsdt.approve(john.address, N2__0_18DEC);

        await iporToken.transfer(john.address, N1__0_18DEC.mul(BigNumber.from("100000")));

        await powerIpor.setJohn(john.address);
    });

    it("Should has zero balance when contract was deployed", async () => {
        //    given
        //    when
        const balances = await john.balanceOfDelegatedPwIpor(await admin.getAddress(), [
            tokens.ipTokenDai.address,
            tokens.ipTokenUsdc.address,
            tokens.ipTokenUsdt.address,
        ]);
        //    then
        expectedBalances([ZERO, ZERO, ZERO], balances);
    });

    it("Should not be able to stake power token when sender is not Power Ipor", async () => {
        //    given
        //    when
        await expect(
            john
                .connect(userOne)
                .delegatePwIpor(
                    await userOne.getAddress(),
                    [tokens.ipTokenDai.address],
                    [N1__0_18DEC]
                )
        ).to.be.revertedWith("IPOR_702");
        //    then
    });

    it("Should not be able to stake power token when ipToken is not supported", async () => {
        //    given
        const John = await hre.ethers.getContractFactory("JohnForTests");
        const johnInternal = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as JohnForTests;
        await johnInternal.setPowerIpor(await admin.getAddress());

        //    when
        await expect(
            johnInternal.delegatePwIpor(
                await admin.getAddress(),
                [tokens.tokenDai.address],
                [N1__0_18DEC]
            )
        ).to.be.revertedWith("IPOR_701");
        //    then
    });

    it("Should be able to delegate pwIpor", async () => {
        //    given
        const balancesBefore = await john.balanceOfDelegatedPwIpor(await admin.getAddress(), [
            tokens.ipTokenDai.address,
            tokens.ipTokenUsdc.address,
            tokens.ipTokenUsdt.address,
        ]);

        await john.setRewardsPerBlock(tokens.ipTokenDai.address, N1__0_8DEC);
        await john.setRewardsPerBlock(tokens.ipTokenUsdc.address, N1__0_8DEC);
        await john.setRewardsPerBlock(tokens.ipTokenUsdt.address, N1__0_8DEC);

        const johnIpDaiBalanceBefore = await tokens.ipTokenDai.balanceOf(john.address);
        const johnIpUsdcBalanceBefore = await tokens.ipTokenUsdc.balanceOf(john.address);
        const johnIpUsdtBalanceBefore = await tokens.ipTokenUsdt.balanceOf(john.address);
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);

        await tokens.ipTokenDai.mint(await admin.getAddress(), N2__0_18DEC);
        await tokens.ipTokenUsdc.mint(await admin.getAddress(), N2__0_18DEC);
        await tokens.ipTokenUsdt.mint(await admin.getAddress(), N2__0_18DEC);

        await john.stake(tokens.ipTokenDai.address, N1__0_18DEC);
        await john.stake(tokens.ipTokenUsdc.address, N1__0_18DEC);
        await john.stake(tokens.ipTokenUsdt.address, N1__0_18DEC);

        const amounts = [N1__0_18DEC, N0__1_18DEC, N0__01_18DEC];

        await iporToken.approve(powerIpor.address, N2__0_18DEC.add(N2__0_18DEC));

        await powerIpor.stake(N2__0_18DEC);

        //    when
        await powerIpor.delegateToJohn(
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            amounts
        );

        //    then
        const balancesAfter = await john.balanceOfDelegatedPwIpor(await admin.getAddress(), [
            tokens.ipTokenDai.address,
            tokens.ipTokenUsdc.address,
            tokens.ipTokenUsdt.address,
        ]);

        const johnIpDaiBalanceAfter = await tokens.ipTokenDai.balanceOf(john.address);
        const johnIpUsdcBalanceAfter = await tokens.ipTokenUsdc.balanceOf(john.address);
        const johnIpUsdtBalanceAfter = await tokens.ipTokenUsdt.balanceOf(john.address);
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);

        expectedBalances([ZERO, ZERO, ZERO], balancesBefore);
        expectedBalances(amounts, balancesAfter);

        expect(johnIpDaiBalanceAfter).to.be.equal(johnIpDaiBalanceBefore.add(N1__0_18DEC));
        expect(johnIpUsdcBalanceAfter).to.be.equal(johnIpUsdcBalanceBefore.add(N1__0_18DEC));
        expect(johnIpUsdtBalanceAfter).to.be.equal(johnIpUsdtBalanceBefore.add(N1__0_18DEC));
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(N1__0_18DEC.mul(BigNumber.from("14")))
        );
    });

    it("Should not be able to delegate pwIpor when contract is pause", async () => {
        //    given
        const John = await hre.ethers.getContractFactory("JohnForTests");
        const johnInternal = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as JohnForTests;

        await johnInternal.setPowerIpor(await admin.getAddress());

        const amounts = [N1__0_18DEC, N0__1_18DEC, N0__01_18DEC];
        await johnInternal.pause();

        //    when
        await expect(
            johnInternal.delegatePwIpor(
                await admin.getAddress(),
                [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
                amounts
            )
        ).to.be.revertedWith("Pausable: paused");
    });
});
