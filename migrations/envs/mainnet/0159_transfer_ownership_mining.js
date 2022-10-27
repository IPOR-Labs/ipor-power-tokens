require("dotenv").config({ path: "../../../.env" });
const func = require("../../libs/json_func.js");
const keys = require("../../libs/json_keys.js");

const John = artifacts.require("John");
const PowerIpor = artifacts.require("PowerIpor");

module.exports = async function (deployer, _network, addresses) {

    if (!process.env.SC_MIGRATION_IPOR_PROTOCOL_OWNER_ADDRESS) {
        throw new Error(
            "Transfer ownership failed! Environment parameter SC_MIGRATION_IPOR_PROTOCOL_OWNER_ADDRESS is not set!"
        );
    }

    const iporOwnerAddress = process.env.SC_MIGRATION_IPOR_PROTOCOL_OWNER_ADDRESS;

    // IV Token
    const johnAddress = await func.getValue(keys.JohnProxy);
    const powerIporAddress = await func.getValue(keys.PowerIporProxy);

    const johnInstance = await John.at(johnAddress);
    const powerIporInstance = await PowerIpor.at(powerIporAddress);

    await johnInstance.transferOwnership(iporOwnerAddress);
    await johnInstance.setPauseManager(iporOwnerAddress);
    await powerIporInstance.transferOwnership(iporOwnerAddress);
    await powerIporInstance.setPauseManager(iporOwnerAddress);

    await func.updateLastCompletedMigration();
};
