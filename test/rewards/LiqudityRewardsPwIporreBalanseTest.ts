import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { John } from "../../types";
import { Tokens, getDeployedTokens } from "../utils/JohnUtils";
import { N1__0_18DEC, ZERO, N0__1_18DEC, N0__01_18DEC } from "../utils/Constants";
import { JohnTypes } from "../../types/John";

chai.use(solidity);
const { expect } = chai;

const expectedBalances = (
    amounts: BigNumber[],
    response: JohnTypes.BalanceOfDelegatedPwIporStructOutput
) => {
    for (let i = 0; i < 3; i++) {
        expect(response.balances[i].amount).to.be.equal(amounts[i]);
    }
};

describe("John Stake and balance", () => {
    let tokens: Tokens;
    let john: John;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;

    before(async () => {
        [admin, userOne, userTwo, userThree] = await hre.ethers.getSigners();

        tokens = await getDeployedTokens([admin, userOne, userTwo, userThree]);
    });

    beforeEach(async () => {
        const John = await hre.ethers.getContractFactory("John");
        john = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            await admin.getAddress(),
            tokens.ipTokenUsdt.address,
        ])) as John;
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

    it("Should not be able to stake power token when sender is not pwIpor token", async () => {
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

    it("Should not be able to stake power token when asset is not supported", async () => {
        //    given
        //    when
        await expect(
            john.delegatePwIpor(await admin.getAddress(), [tokens.tokenDai.address], [N1__0_18DEC])
        ).to.be.revertedWith("IPOR_701");
        //    then
    });

    it("Should be able to stake power token", async () => {
        //    given
        const balancesBefore = await john.balanceOfDelegatedPwIpor(await admin.getAddress(), [
            tokens.ipTokenDai.address,
            tokens.ipTokenUsdc.address,
            tokens.ipTokenUsdt.address,
        ]);
        const amounts = [N1__0_18DEC, N0__1_18DEC, N0__01_18DEC];

        //    when
        await john.delegatePwIpor(
            await admin.getAddress(),
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            amounts
        );

        //    then
        const balancesAfter = await john.balanceOfDelegatedPwIpor(await admin.getAddress(), [
            tokens.ipTokenDai.address,
            tokens.ipTokenUsdc.address,
            tokens.ipTokenUsdt.address,
        ]);

        expectedBalances([ZERO, ZERO, ZERO], balancesBefore);
        expectedBalances(amounts, balancesAfter);
    });

    it("Should not be able to stake power token when contract is pause", async () => {
        //    given
        const amounts = [N1__0_18DEC, N0__1_18DEC, N0__01_18DEC];
        await john.pause();

        //    when
        await expect(
            john.delegatePwIpor(
                await admin.getAddress(),
                [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
                amounts
            )
        ).to.be.revertedWith("Pausable: paused");
        //    then
    });
});
