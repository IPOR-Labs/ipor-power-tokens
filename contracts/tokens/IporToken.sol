// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title IPOR Token in standard ERC20.
contract IporToken is ERC20 {
    uint8 private immutable _decimals;

    constructor(
        string memory name,
        string memory symbol,
        address daoWalletAddress
    ) ERC20(name, symbol) {
        _decimals = 18;
        _mint(daoWalletAddress, 100_000_000 * 1e18);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
