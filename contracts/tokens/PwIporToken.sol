// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../interfaces/IPwIporToken.sol";
import "../interfaces/ILiquidityRewards.sol";
import "../security/IporOwnableUpgradeable.sol";
import "../libraries/errors/IporErrors.sol";
import "../libraries/errors/MiningErrors.sol";
import "../libraries/Constants.sol";
import "../libraries/math/IporMath.sol";

contract PwIporToken is UUPSUpgradeable, IporOwnableUpgradeable, PausableUpgradeable, IPwIporToken {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address private _iporToken;
    address private _liquidityRewards;
    mapping(address => uint256) private _baseBalance;
    //    balance in pwTokens
    mapping(address => uint256) private _delegatedBalance;

    uint256 private _baseTotalSupply;

    function initialize(address iporToken) public initializer {
        __Ownable_init();
        require(iporToken != address(0), IporErrors.WRONG_ADDRESS);
        _iporToken = iporToken;
    }

    function name() external pure returns (string memory) {
        return "Power IPOR";
    }

    function symbol() external pure returns (string memory) {
        return "PwIPOR";
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }

    function getVersion() external pure returns (uint256) {
        return 1;
    }

    function totalSupply() external view returns (uint256) {
        return IporMath.division(_baseTotalSupply * _exchangeRate(), Constants.D18);
    }

    function totalSupplyBase() external view returns (uint256) {
        return _baseTotalSupply;
    }

    function setLiquidityRewardsAddress(address liquidityRewards) external onlyOwner whenNotPaused {
        require(liquidityRewards != address(0), IporErrors.WRONG_ADDRESS);
        _liquidityRewards = liquidityRewards;
    }

    function stake(uint256 amount) external whenNotPaused {
        require(amount != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        uint256 oldUserBalance = _baseBalance[_msgSender()];
        uint256 oldTotalSupply = _baseTotalSupply;
        uint256 exchangeRate = _exchangeRate();
        IERC20Upgradeable(_iporToken).safeTransferFrom(_msgSender(), address(this), amount);
        uint256 newBaseTokens = IporMath.division(amount * Constants.D18, exchangeRate);
        _baseBalance[_msgSender()] = oldUserBalance + newBaseTokens;
        _baseTotalSupply = oldTotalSupply + newBaseTokens;
        // TODO: ADD Event
    }

    function delegateToRewards(address[] memory assets, uint256[] memory amounts)
        external
        whenNotPaused
    {
        require(assets.length == amounts.length, IporErrors.INPUT_ARRAYS_LENGTH_MISMATCH);
        uint256 pwIporToDelegate;
        for (uint256 i = 0; i != amounts.length; i++) {
            pwIporToDelegate += amounts[i];
        }
        uint256 userBalance = _balanceOf(_msgSender());
        uint256 userDelegatedBalance = _delegatedBalance[_msgSender()];
        uint256 newUserDelegatedBalance = pwIporToDelegate + userDelegatedBalance;
        require(userBalance >= newUserDelegatedBalance, MiningErrors.UNSTAKED_BALANCE_TOO_LOW);
        _delegatedBalance[_msgSender()] = newUserDelegatedBalance;
        ILiquidityRewards(_liquidityRewards).delegatePwIpor(assets, amounts);

        // TODO: ADD Event
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balanceOf(account);
    }

    function delegatedBalanceOf(address account) external view returns (uint256) {
        return _delegatedBalance[account];
    }

    function exchangeRate() external view returns (uint256) {
        return _exchangeRate();
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _exchangeRate() internal view returns (uint256) {
        uint256 totalSupply = _baseTotalSupply;
        if (totalSupply == 0) {
            return Constants.D18;
        }
        uint256 balanceOfIporToken = IERC20Upgradeable(_iporToken).balanceOf(address(this));
        if (balanceOfIporToken == 0) {
            return Constants.D18;
        }
        return IporMath.division(balanceOfIporToken * Constants.D18, totalSupply);
    }

    function _balanceOf(address account) internal view returns (uint256) {
        return IporMath.division(_baseBalance[account] * _exchangeRate(), Constants.D18);
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
