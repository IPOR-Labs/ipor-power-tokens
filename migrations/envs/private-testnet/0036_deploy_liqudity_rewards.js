require("dotenv").config({ path: "../../../.env" });
const keys = require("../../libs/json_keys.js");
const func = require("../../libs/json_func.js");
const script = require("../../libs/contracts/deploy/liqudity_rewards/0001_initial_deploy.js");

module.exports = async function (deployer, _network, addresses) {
    const ipUsdt = await func.getValue(keys.ipUSDT);
    const ipUsdc = await func.getValue(keys.ipUSDC);
    const ipDai = await func.getValue(keys.ipDAI);

    const assets = [ipUsdt, ipUsdc, ipDai];

    const initialParams = {
        assets,
    };

    const LiquidityRewards = artifacts.require("LiquidityRewards");
    await script(deployer, _network, addresses, LiquidityRewards, initialParams);

    await func.updateLastCompletedMigration();
};
