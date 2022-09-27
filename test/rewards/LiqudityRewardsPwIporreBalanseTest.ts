import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { John, IporToken, PowerIpor } from "../../types";
import { Tokens, getDeployedTokens } from "../utils/JohnUtils";
import { N1__0_18DEC, ZERO, N0__1_18DEC, N0__01_18DEC, N2__0_18DEC } from "../utils/Constants";
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

describe("John Stake and balance", () => {
    let tokens: Tokens;
    let powerIpor: PowerIpor;
    let iporToken: IporToken;
    let john: John;
    let admin: Signer, userOne: Signer, userTwo: Signer, userThree: Signer;

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

    it("Should not be able to stake power token when sender is not Power Ipor Token", async () => {
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

    it.only("Should be able to stake power token", async () => {
        //    given
        const balancesBefore = await john.balanceOfDelegatedPwIpor(await admin.getAddress(), [
            tokens.ipTokenDai.address,
            tokens.ipTokenUsdc.address,
            tokens.ipTokenUsdt.address,
        ]);

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
