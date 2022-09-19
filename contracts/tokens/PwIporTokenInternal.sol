// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../security/IporOwnableUpgradeable.sol";
import "../interfaces/IPwIporTokenInternal.sol";
import "../interfaces/IPwIporToken.sol";
import "../interfaces/IJohn.sol";
import "../interfaces/types/PwIporTokenTypes.sol";
import "../libraries/errors/IporErrors.sol";
import "../libraries/errors/MiningErrors.sol";
import "../libraries/Constants.sol";
import "../libraries/math/IporMath.sol";
//TODO: remove at the end
import "hardhat/console.sol";

// TODO: Add tests for events
abstract contract PwIporTokenInternal is
    PausableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    IporOwnableUpgradeable,
    IPwIporTokenInternal
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // 2 weeks
    uint256 public constant COOL_DOWN_IN_SECONDS = 2 * 7 * 24 * 60 * 60;

    address internal _john;
    address internal _iporToken;
    // account address -> amount 18 decimals
    mapping(address => uint256) internal _baseBalance;
    // account address -> amount 18 decimals
    mapping(address => uint256) internal _delegatedBalance;
    // account address -> {coolDownFinish, amount}
    mapping(address => PwIporTokenTypes.PwCoolDown) internal _coolDowns;
    uint256 internal _baseTotalSupply;
    uint256 internal _withdrawalFee;

    modifier onlyJohn() {
        require(_msgSender() == _john, MiningErrors.CALLER_NOT_JOHN);
        _;
    }

    function getVersion() external pure override returns (uint256) {
        return 1;
    }

    function totalSupplyBase() external view override returns (uint256) {
        return _baseTotalSupply;
    }

    function exchangeRate() external view override returns (uint256) {
        return _exchangeRate();
    }

    function getJohn() external view override returns (address) {
        return _john;
    }

    function setWithdrawalFee(uint256 withdrawalFee) external override onlyOwner {
        _withdrawalFee = withdrawalFee;
        emit WithdrawalFee(block.timestamp, _msgSender(), withdrawalFee);
    }

    function setJohn(address newJohnAddr) external override onlyOwner whenNotPaused {
        require(newJohnAddr != address(0), IporErrors.WRONG_ADDRESS);
        address oldJohnAddr = _john;
        _john = newJohnAddr;
        emit JohnChanged(_msgSender(), oldJohnAddr, newJohnAddr);
    }

    function receiveRewards(address account, uint256 iporTokenAmount)
        external
        override
        whenNotPaused
        onlyJohn
    {
        // We need this value before transfer tokens
        uint256 exchangeRate = _exchangeRate();
        require(iporTokenAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        IERC20Upgradeable(_iporToken).safeTransferFrom(
            _msgSender(),
            address(this),
            iporTokenAmount
        );

        uint256 newBaseTokens = IporMath.division(iporTokenAmount * Constants.D18, exchangeRate);
        _baseBalance[account] += newBaseTokens;
        _baseTotalSupply += newBaseTokens;

        emit ReceiveRewards(block.timestamp, account, iporTokenAmount);
    }

    function pause() external override onlyOwner {
        _pause();
    }

    function unpause() external override onlyOwner {
        _unpause();
    }

    function _exchangeRate() internal view returns (uint256) {
        uint256 baseTotalSupply = _baseTotalSupply;
        if (baseTotalSupply == 0) {
            return Constants.D18;
        }
        uint256 balanceOfIporToken = IERC20Upgradeable(_iporToken).balanceOf(address(this));
        if (balanceOfIporToken == 0) {
            return Constants.D18;
        }
        return IporMath.division(balanceOfIporToken * Constants.D18, baseTotalSupply);
    }

    function _amountWithoutFee(uint256 baseAmount) internal view returns (uint256) {
        return IporMath.division((Constants.D18 - _withdrawalFee) * baseAmount, Constants.D18);
    }

    function _baseAmountToPwToken(uint256 baseAmount, uint256 exchangeRate)
        internal
        pure
        returns (uint256)
    {
        return IporMath.division(baseAmount * exchangeRate, Constants.D18);
    }

    function _availablePwTokens(address account, uint256 exchangeRate)
        internal
        view
        returns (uint256)
    {
        return
            _baseAmountToPwToken(_baseBalance[account], exchangeRate) -
            _delegatedBalance[account] -
            _coolDowns[account].amount;
    }
}
