require("dotenv").config({ path: "../../../.env" });
const keys = require("../../libs/json_keys.js");
const func = require("../../libs/json_func.js");
const script = require("../../libs/contracts/deploy/power_ipor/0001_initial_deploy.js");

module.exports = async function (deployer, _network, addresses) {
    const iporToken = await func.getValue(keys.IPOR);

    const initialParams = {
        iporToken,
    };

    const PowerIpor = artifacts.require("PowerIpor");
    await script(deployer, _network, addresses, PowerIpor, initialParams);

    await func.updateLastCompletedMigration();
};
