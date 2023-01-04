import { ethers, upgrades } from "hardhat";

import { PowerIpor, LiquidityMining } from "../types";

const IPOR = "0x1e4746dC744503b53b4A082cB3607B169a289090";

const ipUSDT = "0x9Bd2177027edEE300DC9F1fb88F24DB6e5e1edC6";
const ipUSDC = "0x7c0e72f431FD69560D951e4C04A4de3657621a88";
const ipDAI = "0x8537b194BFf354c4738E9F3C81d67E3371DaDAf8";

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
