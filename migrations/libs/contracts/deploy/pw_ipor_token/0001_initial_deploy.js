const keys = require("../../../json_keys.js");
const func = require("../../../json_func.js");
const { deployProxy, erc1967 } = require("@openzeppelin/truffle-upgrades");

module.exports = async function (deployer, _network, addresses, PwIporToken, initialParams) {
    const pwIporTokenProxy = await deployProxy(PwIporToken, [initialParams.iporToken], {
        deployer: deployer,
        initializer: "initialize",
        kind: "uups",
    });

    const pwIporTokenImpl = await erc1967.getImplementationAddress(pwIporTokenProxy.address);

    await func.update(keys.PwIporTokenProxy, pwIporTokenProxy.address);
    await func.update(keys.PwIporTokenImpl, pwIporTokenImpl);
};
