// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../libraries/errors/IporErrors.sol";
import "../libraries/errors/MiningErrors.sol";
import "../libraries/Constants.sol";
import "../interfaces/types/PowerIporTypes.sol";
import "../libraries/math/IporMath.sol";
import "../interfaces/IPowerIporInternal.sol";
import "../interfaces/IJohn.sol";
import "../security/IporOwnableUpgradeable.sol";
//TODO: remove at the end
import "hardhat/console.sol";

// TODO: Add tests for events
abstract contract PowerIporInternal is
    PausableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    IporOwnableUpgradeable,
    IPowerIporInternal
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
    // account address -> {endTimestamp, amount}
    mapping(address => PowerIporTypes.PwIporCoolDown) internal _coolDowns;
    uint256 internal _baseTotalSupply;
    uint256 internal _withdrawFee;

    modifier onlyJohn() {
        require(_msgSender() == _john, MiningErrors.CALLER_NOT_JOHN);
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address iporToken) public initializer {
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        require(iporToken != address(0), IporErrors.WRONG_ADDRESS);
        _iporToken = iporToken;
        _withdrawFee = Constants.D17 * 5;
    }

    function getVersion() external pure override returns (uint256) {
        return 1;
    }

    function totalSupplyBase() external view override returns (uint256) {
        return _baseTotalSupply;
    }

    function calculateExchangeRate() external view override returns (uint256) {
        return _calculateExchangeRate(_iporToken);
    }

    function getJohn() external view override returns (address) {
        return _john;
    }

    function setWithdrawFee(uint256 withdrawalFee) external override onlyOwner {
        _withdrawFee = withdrawalFee;
        emit WithdrawFee(_msgSender(), withdrawalFee);
    }

    function setJohn(address newJohnAddr) external override onlyOwner {
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
        address iporTokenAddress = _iporToken;
        // We need this value before transfer tokens
        uint256 exchangeRate = _calculateExchangeRate(iporTokenAddress);
        require(iporTokenAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        IERC20Upgradeable(iporTokenAddress).safeTransferFrom(
            _msgSender(),
            address(this),
            iporTokenAmount
        );

        uint256 newBaseTokens = IporMath.division(iporTokenAmount * Constants.D18, exchangeRate);
        _baseBalance[account] += newBaseTokens;
        _baseTotalSupply += newBaseTokens;

        emit ReceiveRewards(account, iporTokenAmount);
    }

    function pause() external override onlyOwner {
        _pause();
    }

    function unpause() external override onlyOwner {
        _unpause();
    }

    function _calculateExchangeRate(address iporTokenAddress) internal view returns (uint256) {
        uint256 baseTotalSupply = _baseTotalSupply;
        if (baseTotalSupply == 0) {
            return Constants.D18;
        }
        uint256 balanceOfIporToken = IERC20Upgradeable(iporTokenAddress).balanceOf(address(this));
        if (balanceOfIporToken == 0) {
            return Constants.D18;
        }
        return IporMath.division(balanceOfIporToken * Constants.D18, baseTotalSupply);
    }

    function _calculateAmountWithoutFee(uint256 baseAmount) internal view returns (uint256) {
        return IporMath.division((Constants.D18 - _withdrawFee) * baseAmount, Constants.D18);
    }

    function _calculateBaseAmountToPwIpor(uint256 baseAmount, uint256 exchangeRate)
        internal
        pure
        returns (uint256)
    {
        return IporMath.division(baseAmount * exchangeRate, Constants.D18);
    }

    function _getAvailablePwIporAmount(address account, uint256 exchangeRate)
        internal
        view
        returns (uint256)
    {
        return
            _calculateBaseAmountToPwIpor(_baseBalance[account], exchangeRate) -
            _delegatedBalance[account] -
            _coolDowns[account].amount;
    }

    function _balanceOf(address account) internal view returns (uint256) {
        return
            _calculateBaseAmountToPwIpor(_baseBalance[account], _calculateExchangeRate(_iporToken));
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
