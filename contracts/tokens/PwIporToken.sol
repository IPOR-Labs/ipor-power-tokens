// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../interfaces/IPwIporToken.sol";
import "../security/IporOwnableUpgradeable.sol";
import "../libraries/errors/IporErrors.sol";
import "../libraries/Constants.sol";
import "../libraries/math/IporMath.sol";

contract PwIporToken is UUPSUpgradeable, IporOwnableUpgradeable, PausableUpgradeable, IPwIporToken {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address private _iporToken;
    mapping(address => uint256) private _pwIporUnderlineBalance;
    uint256 private _totalSupplyUnderlineTokens;

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
        return IporMath.division(_totalSupplyUnderlineTokens * _exchangeRate(), Constants.D18);
    }

    function totalSupplyUnderlineTokens() external view returns (uint256) {
        return _totalSupplyUnderlineTokens;
    }

    function stake(uint256 amount) external whenNotPaused {
        require(amount != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        uint256 oldUserBalance = _pwIporUnderlineBalance[_msgSender()];
        uint256 oldTotalSupply = _totalSupplyUnderlineTokens;
        uint256 exchangeRate = _exchangeRate();
        IERC20Upgradeable(_iporToken).safeTransferFrom(_msgSender(), address(this), amount);
        uint256 newUnderlineTokens = IporMath.division(amount * Constants.D18, exchangeRate);
        uint256 newBalance = oldUserBalance + newUnderlineTokens;
        _pwIporUnderlineBalance[_msgSender()] = newBalance;
        _totalSupplyUnderlineTokens = oldTotalSupply + newUnderlineTokens;
        // TODO: ADD Event
    }

    function balanceOf(address account) external view returns (uint256) {
        return IporMath.division(_pwIporUnderlineBalance[account] * _exchangeRate(), Constants.D18);
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
        uint256 totalSupply = _totalSupplyUnderlineTokens;
        if(totalSupply == 0) {
            return Constants.D18;
        }
        uint256 balanceOfIporToken = IERC20Upgradeable(_iporToken).balanceOf(address(this));
        if(balanceOfIporToken == 0 ){
            return Constants.D18;
        }
        return IporMath.division( balanceOfIporToken * Constants.D18, totalSupply);
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
