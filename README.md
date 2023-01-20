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

### Analyse the contracts with slither
- Install [remixd](https://remix-ide.readthedocs.io/fr/latest/remixd.html)
- Install [Slither](https://remix-ide.readthedocs.io/fr/latest/slither.html),  `remixd -i slither`  
- Run `slither .` to verify contract

