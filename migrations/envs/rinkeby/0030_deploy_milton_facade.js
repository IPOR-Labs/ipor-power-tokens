const script = require("../../libs/contracts/deploy/milton_facade/0001_initial_deploy.js");

const MiltonFacadeDataProvider = artifacts.require("MiltonFacadeDataProvider");

module.exports = async function (deployer, _network, addresses) {
    await script(deployer, _network, addresses, MiltonFacadeDataProvider);
};