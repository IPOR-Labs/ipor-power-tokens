const keys = require("../../../json_keys.js");
const func = require("../../../json_func.js");
const { deployProxy, erc1967 } = require("@openzeppelin/truffle-upgrades");

module.exports = async function (deployer, _network, addresses, PowerIpor, initialParams) {
    const powerIporProxy = await deployProxy(PowerIpor, [initialParams.iporToken], {
        deployer: deployer,
        initializer: "initialize",
        kind: "uups",
    });

    const powerIporImpl = await erc1967.getImplementationAddress(powerIporProxy.address);

    await func.update(keys.PowerIporProxy, powerIporProxy.address);
    await func.update(keys.PowerIporImpl, powerIporImpl);
};
