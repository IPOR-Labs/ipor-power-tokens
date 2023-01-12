import { ethers, upgrades } from "hardhat";

import { PowerToken, LiquidityMining } from "../types";

const STAKED_TOKEN = "0x86915520221b985a52C425E5Cc8c6dB69A42c79C";

const lpUSDT = "0xDF4479a1B2706De02A978B7Ea9cc8025c3F466e7";
const lpUSDC = "0x2934A24e14A77cB46034e35e72E0EA4cAE45D460";
const lpDAI = "0xA09dDA1D33A815DbbAaF626C9F08e6C4878a6f35";

async function main() {
    const [deployer] = await ethers.getSigners();

    const PowerTokenFactory = await ethers.getContractFactory("PowerToken", deployer);
    const LiquidityMiningFactory = await ethers.getContractFactory("LiquidityMining", deployer);

    const powerTokenProxy = (await upgrades.deployProxy(PowerTokenFactory, [STAKED_TOKEN], {
        initializer: "initialize",
        kind: "uups",
    })) as PowerToken;

    const liquidityMiningProxy = (await upgrades.deployProxy(
        LiquidityMiningFactory,
        [[lpUSDT, lpUSDC, lpDAI], powerTokenProxy.address, STAKED_TOKEN],
        {
            initializer: "initialize",
            kind: "uups",
        }
    )) as LiquidityMining;

    await powerTokenProxy.setLiquidityMining(liquidityMiningProxy.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
