// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockToken is ERC20, Ownable {
    uint8 private _customDecimals;

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint8 _decimals
    ) ERC20(name, symbol) {
        _customDecimals = _decimals;
        _mint(msg.sender, initialSupply);
    }

    function decimals() public view virtual override returns (uint8) {
        return _customDecimals;
    }

    function burn(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }
}

//solhint-disable no-empty-blocks
contract MockTokenDai is MockToken {
    constructor(uint256 initialSupply) MockToken("Mocked DAI", "DAI", initialSupply, 18) {}
}

//solhint-disable no-empty-blocks
contract MockTokenUsdc is MockToken {
    constructor(uint256 initialSupply) MockToken("Mocked USDC", "USDC", initialSupply, 6) {}
}

//solhint-disable no-empty-blocks
contract MockTokenUsdt is MockToken {
    constructor(uint256 initialSupply) MockToken("Mocked USDT", "USDT", initialSupply, 6) {}
}
