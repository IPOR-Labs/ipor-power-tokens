require("dotenv").config({ path: "../../../../../.env" });
const keys = require("../../../json_keys.js");
const func = require("../../../json_func.js");

const PowerIpor = artifacts.require("PowerIpor");

module.exports = async function (deployer, _network, addresses) {
    const john = await func.getValue(keys.JohnProxy);

    const powerIpor = await func.getValue(keys.PowerIporProxy);

    const powerIporInstance = await PowerIpor.at(powerIpor);

    await powerIporInstance.setJohn(john);
};
