require("dotenv").config({ path: "../../../.env" });
const keys = require("../../libs/json_keys.js");
const func = require("../../libs/json_func.js");
const script = require("../../libs/contracts/deploy/liqudity_rewards/0001_initial_deploy.js");

module.exports = async function (deployer, _network, addresses) {
    const ipUsdt = await func.getValue(keys.ipUSDT);
    const ipUsdc = await func.getValue(keys.ipUSDC);
    const ipDai = await func.getValue(keys.ipDAI);
    const pwIporToken = await func.getValue(keys.PwIporTokenProxy);
    const iporToken = await func.getValue(keys.IPOR);
    const assets = [ipUsdt, ipUsdc, ipDai];

    const initialParams = {
        assets,
        pwIporToken,
        iporToken,
    };

    const John = artifacts.require("John");
    await script(deployer, _network, addresses, John, initialParams);

    await func.updateLastCompletedMigration();
};
