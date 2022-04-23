require("dotenv").config({ path: "../../../.env" });
const script = require("../../libs/contracts/deploy/joseph/dai/0001_initial_deploy.js");
const itfScript = require("../../libs/itf/deploy/joseph/dai/0001_initial_deploy.js");

module.exports = async function (deployer, _network, addresses) {
    if (process.env.ITF_ENABLED === "true") {
        const ItfJosephDai = artifacts.require("ItfJosephDai");
        await itfScript(deployer, _network, addresses, ItfJosephDai);
    } else {
        const JosephDai = artifacts.require("JosephDai");
        await script(deployer, _network, addresses, JosephDai);
    }
};