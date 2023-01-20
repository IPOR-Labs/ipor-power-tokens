# Ipor Power Token

## Usage

### Pre-run steps
- Install `node` and `npm`.

### How to build compile
- Run `npm install` to install all dependencies.
- Run `npm run compile`.

### How to run tests
- Run `npm run test`.

### How to deploy to mainnet/terstnet
You can use [hardhat](https://hardhat.org/tutorial/deploying-to-a-live-network) and modify script in `scripts/` 
to deploy smart contracts to mainnet or testnet.
### Steps required to deploy on any local network
- Deploy staked token contract
  ```solidity
        const StakedToken = await hre.ethers.getContractFactory("MockStakedToken");
        stakedToken = (await StakedToken.deploy(
            "Staked Token",
            "stToken",
            await admin.getAddress()
        )) as MockStakedToken;
  ```
- Deploy LpTokens contracts
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
- Deploy PowerToken contract as proxy
  ```solidity
  const PowerToken = await hre.ethers.getContractFactory("PowerToken");
  powerToken = (await upgrades.deployProxy(PowerToken, [stakedToken.address], {
      initializer: "initialize",
      kind: "uups",
      })) as PowerToken;
  ```
- Deploy LiquidityMining contract as proxy 
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
- Setup liquditymaining address in power token contract
  ```solidity
    await powerToken.setLiquidityMiningAddress(liquidityMiningProxy.address);
  ```
  
### How the reop is structured
- `contracts/` contains all the smart contracts.
  - `interfaces/` contains all the interfaces.
  - `libraries/` contains all the libraries.
  - `mocks/` contains all the mock contracts.
  - `mining/` contains all the contracts related to liquidity mining.
  - `security/` contains all the contracts related to security.
  - `tokens/` contains all the contracts related to power token.
- `scripts/` contains all the scripts to deploy smart contracts.
- `test/` contains all the tests.

### How to verify contract with slither
- Install [remixd](https://remix-ide.readthedocs.io/fr/latest/remixd.html)
- Install [Slither](https://remix-ide.readthedocs.io/fr/latest/slither.html),  `remixd -i slither`  
- Run `slither .` to verify contract

