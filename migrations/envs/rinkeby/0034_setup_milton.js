const script = require("../../libs/contracts/setup/milton/0001_initial_setup.js");

module.exports = async function (deployer, _network, addresses) {
    await script(deployer, _network, addresses);
};