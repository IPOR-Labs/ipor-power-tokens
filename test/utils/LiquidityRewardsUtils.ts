import hre from "hardhat";
import { Signer } from "ethers";

import { DaiMockedToken, UsdcMockedToken, UsdtMockedToken, IpToken } from "../../types";

import {
    USD_1_000_000,
    TOTAL_SUPPLY_6_DECIMALS,
    TOTAL_SUPPLY_18_DECIMALS,
    N1__0_18DEC,
    N1__0_6DEC,
} from "./Constants";

export type Tokens = {
    tokenDai: DaiMockedToken;
    tokenUsdc: UsdcMockedToken;
    tokenUsdt: UsdtMockedToken;
    ipTokenDai: IpToken;
    ipTokenUsdc: IpToken;
    ipTokenUsdt: IpToken;
};

export const getDeployedTokens = async (accounts: Signer[]): Promise<Tokens> => {
    const [admin, userOne, userTwo] = accounts;
    const UsdtMockedToken = await hre.ethers.getContractFactory("UsdtMockedToken");
    const UsdcMockedToken = await hre.ethers.getContractFactory("UsdcMockedToken");
    const DaiMockedToken = await hre.ethers.getContractFactory("DaiMockedToken");
    const IpToken = await hre.ethers.getContractFactory("IpToken");

    const tokenDai = (await DaiMockedToken.deploy(TOTAL_SUPPLY_18_DECIMALS, 18)) as DaiMockedToken;
    await tokenDai.deployed();

    const tokenUsdc = (await UsdcMockedToken.deploy(TOTAL_SUPPLY_6_DECIMALS, 6)) as UsdcMockedToken;
    await tokenUsdc.deployed();

    const tokenUsdt = (await UsdtMockedToken.deploy(TOTAL_SUPPLY_6_DECIMALS, 6)) as UsdtMockedToken;
    await tokenUsdt.deployed();

    const ipTokenDai = (await IpToken.deploy("IP Dai", "ipDAI", tokenDai.address)) as IpToken;
    const ipTokenUsdc = (await IpToken.deploy("IP USDC", "ipUSDC", tokenUsdc.address)) as IpToken;
    const ipTokenUsdt = (await IpToken.deploy("IP USDT", "ipUSDT", tokenUsdt.address)) as IpToken;

    await ipTokenDai.setJoseph(await admin.getAddress());
    await ipTokenUsdc.setJoseph(await admin.getAddress());
    await ipTokenUsdt.setJoseph(await admin.getAddress());

    await ipTokenDai.mint(await admin.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await ipTokenUsdc.mint(await admin.getAddress(), N1__0_6DEC.mul(USD_1_000_000));
    await ipTokenUsdt.mint(await admin.getAddress(), N1__0_6DEC.mul(USD_1_000_000));

    await ipTokenDai.mint(await userOne.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await ipTokenUsdc.mint(await userOne.getAddress(), N1__0_6DEC.mul(USD_1_000_000));
    await ipTokenUsdt.mint(await userOne.getAddress(), N1__0_6DEC.mul(USD_1_000_000));

    await ipTokenDai.mint(await userTwo.getAddress(), N1__0_18DEC.mul(USD_1_000_000));
    await ipTokenUsdc.mint(await userTwo.getAddress(), N1__0_6DEC.mul(USD_1_000_000));
    await ipTokenUsdt.mint(await userTwo.getAddress(), N1__0_6DEC.mul(USD_1_000_000));
    return {
        tokenDai,
        tokenUsdc,
        tokenUsdt,
        ipTokenDai,
        ipTokenUsdc,
        ipTokenUsdt,
    };
};
