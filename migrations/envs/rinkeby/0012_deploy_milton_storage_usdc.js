const script = require("../../libs/contracts/deploy/milton_storage/usdc/0001_initial_deploy.js");

const MiltonStorageUsdc = artifacts.require("MiltonStorageUsdc");

module.exports = async function (deployer, _network, addresses) {
    await script(deployer, _network, addresses, MiltonStorageUsdc);
};