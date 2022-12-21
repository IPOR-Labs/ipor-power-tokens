require("dotenv").config();

import "dotenv";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
import "hardhat-tracer";
import "solidity-coverage";
import "@typechain/hardhat";
import networks from "./hardhat.network";

let jobs = 2;

if (process.env.HARDHAT_MOCHA_JOBS) {
    jobs = Number(process.env.HARDHAT_MOCHA_JOBS);
}

if (process.env.HARDHAT_REPORT_GAS === "true") {
    require("hardhat-gas-reporter");
    jobs = 1;
}

if (process.env.FORK_ENABLED === "true") {
    jobs = 1;
}

console.log("Hardhat Mocha Jobs =", jobs);

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
    solidity: {
        version: "0.8.17",
        settings: {
            optimizer: {
                enabled: true,
                runs: 800,
            },
        },
    },
    networks,
    paths: {
        tests: "./test",
    },
    typechain: {
        outDir: "types",
        target: "ethers-v5",
        alwaysGenerateOverloads: true, 
        externalArtifacts: ["externalArtifacts/*.json"], 
    },

    mocha: {
        timeout: 100000,
        parallel: true,
        jobs,
    },
};
