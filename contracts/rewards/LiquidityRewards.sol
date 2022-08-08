// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../security/IporOwnableUpgradeable.sol";
import "../libraries/errors/IporErrors.sol";
import "../interfaces/ILiquidityRewards.sol";

contract LiquidityRewards is
    UUPSUpgradeable,
    IporOwnableUpgradeable,
    PausableUpgradeable,
    ILiquidityRewards
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    mapping(address => bool) private _assets;
    mapping(address => mapping(address => uint256)) private _balances;

    function initialize(address[] memory assets) public initializer {
        __Ownable_init();
        uint256 assetsLength = assets.length;
        for (uint256 i = 0; i != assetsLength; i++) {
            require(assets[i] != address(0), IporErrors.WRONG_ADDRESS);
            _assets[assets[i]] = true;
        }
    }

    function getVersion() external pure returns (uint256) {
        return 1;
    }

    function stake(address asset, uint256 amount) external whenNotPaused {
        require(amount != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        require(_assets[asset], IporErrors.WRONG_ADDRESS);
        uint256 oldUserBalance = _balances[_msgSender()][asset];
        IERC20Upgradeable(asset).safeTransferFrom(_msgSender(), address(this), amount);
        uint256 newBalance = oldUserBalance + amount;
        _balances[_msgSender()][asset] = newBalance;
    }

    function isAssetActive(address asset) external view returns (bool) {
        return _assets[asset];
    }

    function addAsset(address asset) external onlyOwner whenNotPaused {
        require(asset != address(0), IporErrors.WRONG_ADDRESS);
        _assets[asset] = true;
    }

    function deactivateAsset(address asset) external onlyOwner {
        require(asset != address(0), IporErrors.WRONG_ADDRESS);
        _assets[asset] = false;
    }

    function balanceOf(address asset) external view returns (uint256) {
        return _balances[_msgSender()][asset];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
