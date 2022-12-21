import hre, { upgrades } from "hardhat";
import chai from "chai";

import { BigNumber, Signer } from "ethers";

import { solidity } from "ethereum-waffle";
import { MockIporToken, PowerIpor, John } from "../../types";
import { N1__0_18DEC, ZERO, TOTAL_SUPPLY_18_DECIMALS, N0__1_18DEC } from "../utils/Constants";
import { it } from "mocha";
import { extractGlobalIndicators, getDeployedTokens, Tokens } from "../utils/JohnUtils";

chai.use(solidity);
const { expect } = chai;
const { ethers } = hre;

describe("PowerIpor token delegate", () => {
    let accounts: Signer[];
    let iporToken: MockIporToken;
    let powerIpor: PowerIpor;
    let tokens: Tokens;
    let john: John;

    before(async () => {
        accounts = await ethers.getSigners();
        tokens = await getDeployedTokens(accounts);
    });

    beforeEach(async () => {
        const IporToken = await ethers.getContractFactory("MockIporToken");
        iporToken = (await IporToken.deploy(
            "IPOR Token",
            "IPOR",
            await accounts[0].getAddress()
        )) as MockIporToken;
        const PowerIpor = await ethers.getContractFactory("PowerIpor");
        powerIpor = (await upgrades.deployProxy(PowerIpor, [iporToken.address])) as PowerIpor;
        await iporToken.increaseAllowance(powerIpor.address, TOTAL_SUPPLY_18_DECIMALS);
        const John = await hre.ethers.getContractFactory("John");
        john = (await upgrades.deployProxy(John, [
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address, tokens.ipTokenUsdt.address],
            powerIpor.address,
            iporToken.address,
        ])) as John;

        await powerIpor.setJohn(john.address);
    });

    it("Should revert transaction when mismatch arrays", async () => {
        //    given
        await powerIpor.stake(N1__0_18DEC);
        const [admin, userOne] = accounts;
        //    when
        await expect(
            powerIpor.delegateToJohn([await userOne.getAddress()], [N0__1_18DEC, N1__0_18DEC])
        ).to.be.revertedWith("IPOR_718");
    });

    it("Should revert transaction when insufficient number of tokens to stake", async () => {
        //    given
        await powerIpor.stake(N0__1_18DEC);
        const [admin, userOne] = accounts;
        //    when
        await expect(
            powerIpor.delegateToJohn([await admin.getAddress()], [N1__0_18DEC])
        ).to.be.revertedWith("IPOR_708");
    });

    it("Should revert transaction when insufficient number of tokens to stake, two assets", async () => {
        //    given
        await powerIpor.stake(N1__0_18DEC);
        const [admin, userOne] = accounts;
        //    when
        await expect(
            powerIpor.delegateToJohn(
                [tokens.tokenDai.address, tokens.tokenUsdc.address],
                [N1__0_18DEC, N0__1_18DEC]
            )
        ).to.be.revertedWith("IPOR_708");
    });

    it("Should be able to stake into one asset when pass one asset", async () => {
        //    given
        const [admin] = accounts;
        const pwTokenDelegationAmount = N0__1_18DEC;
        const iporTokenStakeAmount = N1__0_18DEC;
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        await powerIpor.stake(N1__0_18DEC);
        const delegatedBalanceBefore = await powerIpor.delegatedToJohnBalanceOf(
            await admin.getAddress()
        );

        //    when
        await powerIpor.delegateToJohn([tokens.ipTokenDai.address], [pwTokenDelegationAmount]);

        //    then
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const delegatedBalanceAfter = await powerIpor.delegatedToJohnBalanceOf(
            await admin.getAddress()
        );

        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(pwTokenDelegationAmount);
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(iporTokenStakeAmount)
        );
    });

    it("Should be able to stake into two asset when pass two asset", async () => {
        //    given
        const [admin] = accounts;
        const iporTokenStakeAmount = N1__0_18DEC;
        const pwTokenDelegationAmount = N0__1_18DEC;
        const powerIporIporTokenBalanceBefore = await iporToken.balanceOf(powerIpor.address);
        await powerIpor.stake(N1__0_18DEC);
        const delegatedBalanceBefore = await powerIpor.delegatedToJohnBalanceOf(
            await admin.getAddress()
        );
        //    when
        await powerIpor.delegateToJohn(
            [tokens.ipTokenDai.address, tokens.ipTokenUsdc.address],
            [pwTokenDelegationAmount, pwTokenDelegationAmount]
        );
        //    then
        const powerIporIporTokenBalanceAfter = await iporToken.balanceOf(powerIpor.address);
        const delegatedBalanceAfter = await powerIpor.delegatedToJohnBalanceOf(
            await admin.getAddress()
        );

        expect(delegatedBalanceBefore).to.be.equal(ZERO);
        expect(delegatedBalanceAfter).to.be.equal(
            pwTokenDelegationAmount.add(pwTokenDelegationAmount)
        );
        expect(powerIporIporTokenBalanceAfter).to.be.equal(
            powerIporIporTokenBalanceBefore.add(iporTokenStakeAmount)
        );
    });
});
