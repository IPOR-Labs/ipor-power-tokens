import { ethers, upgrades } from "hardhat";

import { PowerIpor, LiquidityMining } from "../types";

const IPOR = "0x86915520221b985a52C425E5Cc8c6dB69A42c79C";

const ipUSDT = "0xDF4479a1B2706De02A978B7Ea9cc8025c3F466e7";
const ipUSDC = "0x2934A24e14A77cB46034e35e72E0EA4cAE45D460";
const ipDAI = "0xA09dDA1D33A815DbbAaF626C9F08e6C4878a6f35";

async function main() {
    const [deployer] = await ethers.getSigners();

    const PowerIporFactory = await ethers.getContractFactory("PowerIpor", deployer);
    const LiquidityMiningFactory = await ethers.getContractFactory("LiquidityMining", deployer);

    const powerIporProxy = (await upgrades.deployProxy(PowerIporFactory, [IPOR], {
        initializer: "initialize",
        kind: "uups",
    })) as PowerIpor;

    const liquidityMiningProxy = (await upgrades.deployProxy(
        LiquidityMiningFactory,
        [[ipUSDT, ipUSDC, ipDAI], powerIporProxy.address, IPOR],
        {
            initializer: "initialize",
            kind: "uups",
        }
    )) as LiquidityMining;

    await powerIporProxy.setLiquidityMining(liquidityMiningProxy.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
