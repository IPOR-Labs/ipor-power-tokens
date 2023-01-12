import { ethers, upgrades } from "hardhat";

import { PowerToken, LiquidityMining } from "../types";

const STAKED_TOKEN = "0x1e4746dC744503b53b4A082cB3607B169a289090";

const lpUSDT = "0x9Bd2177027edEE300DC9F1fb88F24DB6e5e1edC6";
const lpUSDC = "0x7c0e72f431FD69560D951e4C04A4de3657621a88";
const lpDAI = "0x8537b194BFf354c4738E9F3C81d67E3371DaDAf8";

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
