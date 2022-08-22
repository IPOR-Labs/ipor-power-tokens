const keys = require("../../../json_keys.js");
const func = require("../../../json_func.js");
const { deployProxy, erc1967 } = require("@openzeppelin/truffle-upgrades");

module.exports = async function (deployer, _network, addresses, LiquidityRewards, initialParams) {
    const liquidityRewardsProxy = await deployProxy(
        LiquidityRewards,
        [initialParams.assets, initialParams.pwIporToken, initialParams.iporToken],
        {
            deployer: deployer,
            initializer: "initialize",
            kind: "uups",
        }
    );

    const liquidityRewardsImpl = await erc1967.getImplementationAddress(
        liquidityRewardsProxy.address
    );

    await func.update(keys.LiquidityRewardsProxy, liquidityRewardsProxy.address);
    await func.update(keys.LiquidityRewardsImpl, liquidityRewardsImpl);
};
