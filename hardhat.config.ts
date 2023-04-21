import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.17",
        settings: {
            optimizer: {
                enabled: true,
                runs: 400,
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

    networks: {
        localhost: {
            url: "http://localhost:8545",
        },
    },
};

export default config;
