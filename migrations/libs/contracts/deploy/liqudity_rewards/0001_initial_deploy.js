const keys = require("../../../json_keys.js");
const func = require("../../../json_func.js");
const { deployProxy, erc1967 } = require("@openzeppelin/truffle-upgrades");

module.exports = async function (deployer, _network, addresses, John, initialParams) {
    const johnProxy = await deployProxy(
        John,
        [initialParams.assets, initialParams.powerIpor, initialParams.iporToken],
        {
            deployer: deployer,
            initializer: "initialize",
            kind: "uups",
        }
    );

    const johnImpl = await erc1967.getImplementationAddress(johnProxy.address);

    await func.update(keys.JohnProxy, johnProxy.address);
    await func.update(keys.JohnImpl, johnImpl);
};
