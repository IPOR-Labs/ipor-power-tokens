require("dotenv").config({ path: "../../../.env" });
const keys = require("../../libs/json_keys.js");
const func = require("../../libs/json_func.js");
const script = require("../../libs/contracts/deploy/pw_ipor_token/0001_initial_deploy.js");

module.exports = async function (deployer, _network, addresses) {
    const iporToken = await func.getValue(keys.IporToken);

    const initialParams = {
        iporToken,
    };

    const PwIporToken = artifacts.require("PwIporToken");
    await script(deployer, _network, addresses, PwIporToken, initialParams);

    await func.updateLastCompletedMigration();
};
