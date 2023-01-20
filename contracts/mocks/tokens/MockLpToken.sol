// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockLpToken is ERC20, Ownable {
    using SafeERC20 for IERC20;

    address private immutable _asset;

    uint8 private immutable _decimals;

    address private _joseph;

    event Mint(address indexed account, uint256 amount);
    event Burn(address indexed account, uint256 amount);
    event JosephChanged(
        address indexed changedBy,
        address indexed oldJoseph,
        address indexed newJoseph
    );

    modifier onlyJoseph() {
        require(_msgSender() == _joseph, "PT_327");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address asset
    ) ERC20(name, symbol) {
        require(address(0) != asset, "PT_000");
        _asset = asset;
        _decimals = 18;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function getAsset() external view returns (address) {
        return _asset;
    }

    function setJoseph(address newJoseph) external onlyOwner {
        require(newJoseph != address(0), "PT_000");
        address oldJoseph = _joseph;
        _joseph = newJoseph;
        emit JosephChanged(_msgSender(), oldJoseph, newJoseph);
    }

    function mint(address account, uint256 amount) external onlyJoseph {
        require(amount > 0, "PT_400");
        _mint(account, amount);
        emit Mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyJoseph {
        require(amount > 0, "PT_401");
        _burn(account, amount);
        emit Burn(account, amount);
    }
}
