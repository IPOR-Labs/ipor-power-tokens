import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
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
        tests: "./test",
    },
    typechain: {
        outDir: "types",
    },
};

export default config;
