import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
require("dotenv").config();
import "dotenv";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.17",
        settings: {
            optimizer: {
                enabled: true,
                runs: 800,
            },
        },
    },
    networks: {
        hardhat: {
            forking: {
                url: `${process.env.HARDHAT_FORKING_URL}`,
            },
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./tests",
    },
    typechain: {
        outDir: "types",
    },
};

export default config;
