// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./MockToken.sol";

//solhint-disable no-empty-blocks
contract MockTokenDai is MockToken {
    constructor(uint256 initialSupply) MockToken("Mocked DAI", "DAI", initialSupply, 18) {}
}
