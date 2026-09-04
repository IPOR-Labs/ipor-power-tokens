# Ipor Power Token

Detailed documentation can be found in [IPOR Gitbook](https://docs.ipor.io/tokenomics/power-token-liquidity-mining-for-developers)

## Usage

### Pre-run steps
- Install `node` and `npm`.

### How to compile
- Run `npm install` to install all dependencies.
- Run `npm run compile`.

### How to run the tests
- Run `npm run test`.

### How to deploy to mainnet/testnet
You can use [hardhat](https://hardhat.org/tutorial/deploying-to-a-live-network) and modify the script in `scripts/` 
to deploy the smart contracts to the mainnet or testnet.
### Steps required to deploy on a local network
- Deploy staked token contract
  ```solidity
        const StakedToken = await hre.ethers.getContractFactory("MockStakedToken");
        stakedToken = (await StakedToken.deploy(
            "Staked Token",
            "stToken",
            await admin.getAddress()
        )) as MockStakedToken;
  ```
- Deploy `LpTokens` contracts
  ```solidity
        const LpTokenDai = await hre.ethers.getContractFactory("MockLpToken");
        lpDai = (await LpToken.deploy(
            "Lp Dai",
            "lpDai",
            await admin.getAddress()
        )) as MockLpToken;
        const LpTokensUsdc = await hre.ethers.getContractFactory("MockLpTokens");
        lpUsdc = (await LpTokensUsdc.deploy(
            "Lp Usdc",
            "lpUsdc",
            await admin.getAddress()
        )) as MockLpTokens;
  ```
- Deploy `PowerToken` contract as proxy
  ```solidity
  const PowerToken = await hre.ethers.getContractFactory("PowerToken");
  powerToken = (await upgrades.deployProxy(PowerToken, [stakedToken.address], {
      initializer: "initialize",
      kind: "uups",
      })) as PowerToken;
  ```
- Deploy `LiquidityMining` contract as proxy 
  ```solidity
    const LiquidityMiningFactory = await hre.ethers.getContractFactory("LiquidityMining");
    const liquidityMiningProxy = (await upgrades.deployProxy(LiquidityMiningFactory,
                  [[ lpUSDC, lpDAI], powerTokenProxy.address, STAKED_TOKEN],
                  {
                    initializer: "initialize",
                    kind: "uups",
                  }
    )) as LiquidityMining;
  ```
- Setup `LiquidityMining` address in power token contract
  ```solidity
    await powerToken.setLiquidityMiningAddress(liquidityMiningProxy.address);
  ```
  
### Structure fo the repository
- `contracts/` contains all the smart contracts.
  - `interfaces/` contains all the interfaces.
  - `libraries/` contains all the libraries.
  - `mocks/` contains all the mock contracts.
  - `mining/` contains all the contracts related to liquidity mining.
  - `security/` contains all the contracts related to security.
  - `tokens/` contains all the contracts related to power token.
- `scripts/` contains all the scripts to deploy smart contracts.
- `test/` contains all the tests.

### Liquidity mining accounting invariant (IL-8156)
For every pool `LiquidityMining` keeps `aggregatedPowerUp == sum(round(powerUp_i * lpTokenBalance_i / 1e18))`
over all accounts (up to 1 wei of rounding per rebalance; dust below `10_000` wei is flushed to 0 when a pool
drains). The invariant holds only if every write of an account's `powerUp` goes through `_rebalanceIndicators`.

- `MiningCalculation.calculateAggregatedPowerUp` clamps the subtraction to 0 instead of reverting `PT_711`:
  lpToken principal must always be withdrawable, an under-counted aggregate may only under-accrue rewards.
- `reconcileAggregatedPowerUp(lpTokens, deltas)` (owner-only, `reinitializer(2)`) is a one-off correction
  executed atomically with the v2003 upgrade (`upgradeToAndCall`) for the Ethereum legacy pools ipDAI / ipUSDC /
  ipUSDT, whose aggregates were under-counted by a short-lived Feb-2023 implementation.
- Tests: `test/liquidityMining/LiquidityMiningAggregatedPowerUp*.t.sol` (unit + invariant fuzzing) and
  `test/ethMarket/LiquidityMiningReconcileIL8156.t.sol` (mainnet fork at block 25,881,574, needs `ETHEREUM_PROVIDER_URL`).

### Analyse the contracts with slither
- Install [remixd](https://remix-ide.readthedocs.io/fr/latest/remixd.html)
- Install [Slither](https://remix-ide.readthedocs.io/fr/latest/slither.html),  `remixd -i slither`  
- Run `slither .` to verify contract

### How to run the coverage
- run `brew install ekhtml`
- run `brew install lcov`
- run `mkdir coverage`
- run `forge coverage --report lcov && genhtml lcov.info --branch-coverage --output-dir coverage`


