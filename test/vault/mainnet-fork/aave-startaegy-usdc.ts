import { getEnabledCategories } from "node:trace_events";
import hre, { upgrades } from "hardhat";
import { BigNumber } from "ethers";
import daiAbi from "../../../abis/daiAbi.json";
import usdcAbi from "../../../abis/usdcAbi.json";
const { expect } = require("chai");

import aaveIncentiveContractAbi from "../../../abis/aaveIncentiveContract.json";
import { ItfJoseph__factory } from "../../../types";
// Mainnet Fork and test case for mainnet with hardhat network by impersonate account from mainnet
// work for blockNumber: 14222087,
describe("aave deployed Contract on Mainnet fork", function () {
    let accounts: any;
    let accountToImpersonate: any;
    let usdcAddress: any;
    let usdcContract: any;
    let strategyContract: any;
    let strategyContract_Instance: any;
    let signer: any;
    let impersonateBalanceBefore: any;
    let maxValue: any;
    let addressProvider: any;
    let aUsdcAddress: any;
    let AAVE: any;
    let aaveContract: any;
    let aTokenContract: any;
    let aaveIncentiveAddress: any;
    let aaveIncentiveContract: any;
    let stkAave: any;
    let stakeAaveContract: any;

    if (process.env.FORK_ENABLED != "true") {
        return;
    }

    describe("AAVE strategy USDC fork test", () => {
        before(async () => {
            maxValue =
                "115792089237316195423570985008687907853269984665640564039457584007913129639935";
            accounts = await hre.ethers.getSigners();
            console.log(accounts[0].address);

            // Mainnet addresses we need account which has Dai
            accountToImpersonate = "0xa191e578a6736167326d05c119ce0c90849e84b7"; // usdc rich address
            usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // usdc
            aUsdcAddress = "0xBcca60bB61934080951369a648Fb03DF4F96263C";
            addressProvider = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5"; // addressProvider mainnet
            AAVE = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9";
            aaveIncentiveAddress = "0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5";
            stkAave = "0x4da27a545c0c5B758a6BA100e3a049001de870f5";

            await hre.network.provider.send("hardhat_setBalance", [
                accountToImpersonate,
                "0x100000000000000000000",
            ]);

            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [accountToImpersonate],
            });
            signer = await hre.ethers.provider.getSigner(accountToImpersonate);

            usdcContract = new hre.ethers.Contract(usdcAddress, usdcAbi, signer);
            aaveContract = new hre.ethers.Contract(AAVE, usdcAbi, signer);
            stakeAaveContract = new hre.ethers.Contract(stkAave, usdcAbi, signer);
            aTokenContract = new hre.ethers.Contract(aUsdcAddress, usdcAbi, signer);
            impersonateBalanceBefore = await usdcContract.balanceOf(accountToImpersonate);
            console.log("impersonateBalanceBefore: ", impersonateBalanceBefore.toString());
            await usdcContract.transfer(accounts[0].address, impersonateBalanceBefore);
            const impersonateBalanceAfter = await usdcContract.balanceOf(accountToImpersonate);
            console.log("impersonateBalanceAfter: ", impersonateBalanceAfter.toString());
            signer = await hre.ethers.provider.getSigner(accounts[0].address);
            usdcContract = new hre.ethers.Contract(usdcAddress, usdcAbi, signer);

            //  ********************************************************************************************
            //  **************                      Deploy strategy                           **************
            //  ********************************************************************************************

            strategyContract = await hre.ethers.getContractFactory("AaveStrategy", signer);

            strategyContract_Instance = await upgrades.deployProxy(strategyContract, [
                usdcAddress,
                aUsdcAddress,
                addressProvider,
                stkAave,
                aaveIncentiveAddress,
                AAVE,
            ]);

            await strategyContract_Instance.setStanley(await signer.getAddress());
            await strategyContract_Instance.setTreasury(await signer.getAddress());

            aaveIncentiveContract = new hre.ethers.Contract(
                aaveIncentiveAddress,
                aaveIncentiveContractAbi,
                signer
            );
        });

        it("test", async () => {
            expect(true).to.be.true;
        });

        it("hardhat_impersonateAccount and check transfered balance to our account", async function () {
            const usdcBalanceBefore = await usdcContract.balanceOf(accounts[0].address);
            console.log("Usdc Balance Before", usdcBalanceBefore.toString());

            await usdcContract.approve(strategyContract_Instance.address, maxValue);
            const aUsdcBalanceBeforeDeposit = await aTokenContract.balanceOf(
                strategyContract_Instance.address
            );
            console.log("aTokens balance before deposit: ", aUsdcBalanceBeforeDeposit.toString());

            await strategyContract_Instance.deposit(BigNumber.from("100000000000000000000"));
            console.log("Deposite complete");
            const aUsdcBalanceAfterDeposit = await aTokenContract.balanceOf(
                strategyContract_Instance.address
            );
            console.log("aTokens balance after deposit: ", aUsdcBalanceAfterDeposit.toString());

            const strategyBalance = await strategyContract_Instance.balanceOf();
            console.log("strategy balance after deposit: ", strategyBalance.toString());

            const timestamp = Math.floor(Date.now() / 1000) + 864000 * 2;
            // console.log("Timestamp: ", timestamp);

            await hre.network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
            await hre.network.provider.send("evm_mine");

            const aUsdcBalanceAfterAddTime = await aTokenContract.balanceOf(
                strategyContract_Instance.address
            );
            console.log(
                "aTokens balanse after add extra time ",
                aUsdcBalanceAfterAddTime.toString()
            );

            await aTokenContract
                .connect(signer)
                .approve(strategyContract_Instance.address, maxValue);
            await strategyContract_Instance.withdraw(strategyBalance);
            console.log("Withdraw complete");
            const strategyBalanceAfterWithdraw = await strategyContract_Instance.balanceOf();
            console.log(
                "strategy balance after withdraw: ",
                strategyBalanceAfterWithdraw.toString()
            );

            const aUsdcBalanceAfterWithdraw = await aTokenContract.balanceOf(
                strategyContract_Instance.address
            );
            console.log("aTokens balance after withdraw: ", aUsdcBalanceAfterWithdraw.toString());

            const claimable2 = await aaveIncentiveContract.getUserUnclaimedRewards(
                strategyContract_Instance.address
            );
            console.log("Aave Claimable Amount: ", claimable2.toString());

            await strategyContract_Instance.beforeClaim();

            await hre.network.provider.send("evm_setNextBlockTimestamp", [timestamp + 865000]);
            await hre.network.provider.send("evm_mine");

            const aaveBalanceBefore = await aaveContract.balanceOf(accounts[0].address);
            console.log("Cliamed Aave Balance Before", aaveBalanceBefore.toString());

            await strategyContract_Instance.doClaim();

            const aaveBalance = await aaveContract.balanceOf(accounts[0].address);
            console.log("Cliamed Aave Balance", aaveBalance.toString()); // should be non-zero

            const daiBalanceAfter = await usdcContract.balanceOf(accounts[0].address);
            console.log("Usdc Balance After", daiBalanceAfter.toString());
        });
    });
});