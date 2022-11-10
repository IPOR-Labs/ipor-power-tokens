// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
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
import "./IporToken.sol";

abstract contract PowerIporInternal is
    PausableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    IporOwnableUpgradeable,
    IPowerIporInternal
{
    /// @dev 2 weeks
    uint256 public constant COOL_DOWN_IN_SECONDS = 2 * 7 * 24 * 60 * 60;

    bytes32 internal constant _IPOR_TOKEN_ID =
        0xdba05ed67d0251facfcab8345f27ccd3e72b5a1da8cebfabbcccf4316e6d053c;
    bytes32 internal constant _JOHN_ID =
        0x9b1f3aa590476fc9aa58d44ad1419ab53d34c344bd5ed46b12e4af7d27c38e06;

    address internal _john;
    address internal _iporToken;
    address internal _pauseManager;

    /// @dev account address -> base amount, represented in 18 decimals
    mapping(address => uint256) internal _baseBalance;

    /// @dev balance of Power Ipor Token which are delegated to John, information per account, balance represented in 18 decimals
    mapping(address => uint256) internal _delegatedToJohnBalance;
    // account address -> {endTimestamp, amount}
    mapping(address => PowerIporTypes.PwIporCoolDown) internal _coolDowns;
    uint256 internal _baseTotalSupply;
    uint256 internal _unstakeWithoutCooldownFee;

    modifier onlyJohn() {
        require(_msgSender() == _john, MiningErrors.CALLER_NOT_JOHN);
        _;
    }

    modifier onlyPauseManager() {
        require(_msgSender() == _pauseManager, MiningErrors.CALLER_NOT_PAUSE_MANAGER);
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address iporToken) public initializer {
        __Pausable_init_unchained();
        __Ownable_init_unchained();
        __UUPSUpgradeable_init_unchained();
        require(iporToken != address(0), IporErrors.WRONG_ADDRESS);
        require(
            IporToken(iporToken).getContractId() == _IPOR_TOKEN_ID,
            IporErrors.WRONG_CONTRACT_ID
        );
        _iporToken = iporToken;
        _pauseManager = _msgSender();
        _unstakeWithoutCooldownFee = Constants.D17 * 5;
    }

    function getVersion() external pure override returns (uint256) {
        return 1;
    }

    function totalSupplyBase() external view override returns (uint256) {
        return _baseTotalSupply;
    }

    function calculateExchangeRate() external view override returns (uint256) {
        return _calculateInternalExchangeRate(_iporToken);
    }

    function getJohn() external view override returns (address) {
        return _john;
    }

    function getIporToken() external view override returns (address) {
        return _iporToken;
    }

    function getPauseManager() external view override returns (address) {
        return _pauseManager;
    }

    function setUnstakeWithoutCooldownFee(uint256 unstakeWithoutCooldownFee)
        external
        override
        onlyOwner
    {
        require(
            unstakeWithoutCooldownFee <= Constants.D18,
            MiningErrors.UNSTAKE_WITHOUT_COOLDOWN_FEE_IS_TO_HIGH
        );
        uint256 oldValue = _unstakeWithoutCooldownFee;
        _unstakeWithoutCooldownFee = unstakeWithoutCooldownFee;
        emit UnstakeWithoutCooldownFeeChanged(_msgSender(), oldValue, unstakeWithoutCooldownFee);
    }

    function setJohn(address newJohnAddr) external override onlyOwner {
        require(newJohnAddr != address(0), IporErrors.WRONG_ADDRESS);
        require(IJohn(newJohnAddr).getContractId() == _JOHN_ID, IporErrors.WRONG_CONTRACT_ID);
        address oldJohnAddr = _john;
        _john = newJohnAddr;
        emit JohnChanged(_msgSender(), oldJohnAddr, newJohnAddr);
    }

    function setPauseManager(address newPauseManagerAddr) external override onlyOwner {
        require(newPauseManagerAddr != address(0), IporErrors.WRONG_ADDRESS);
        address oldPauseManagerAddr = _pauseManager;
        _pauseManager = newPauseManagerAddr;
        emit PauseManagerChanged(_msgSender(), oldPauseManagerAddr, newPauseManagerAddr);
    }

    function receiveRewardsFromJohn(address account, uint256 iporTokenAmount)
        external
        override
        whenNotPaused
        onlyJohn
    {
        address iporTokenAddress = _iporToken;
        /// @dev We need this value before transfer tokens
        uint256 exchangeRate = _calculateInternalExchangeRate(iporTokenAddress);
        require(iporTokenAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        IERC20Upgradeable(iporTokenAddress).transferFrom(
            _msgSender(),
            address(this),
            iporTokenAmount
        );

        uint256 baseAmount = IporMath.division(iporTokenAmount * Constants.D18, exchangeRate);

        _baseBalance[account] += baseAmount;
        _baseTotalSupply += baseAmount;

        emit ReceiveRewards(account, iporTokenAmount);
    }

    function pause() external override onlyPauseManager {
        _pause();
    }

    function unpause() external override onlyPauseManager {
        _unpause();
    }

    function _calculateInternalExchangeRate(address iporTokenAddress)
        internal
        view
        returns (uint256)
    {
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

    function _calculateAmountWithCooldownFeeSubtracted(uint256 baseAmount)
        internal
        view
        returns (uint256)
    {
        return
            IporMath.division(
                (Constants.D18 - _unstakeWithoutCooldownFee) * baseAmount,
                Constants.D18
            );
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
            _delegatedToJohnBalance[account] -
            _coolDowns[account].pwIporAmount;
    }

    function _balanceOf(address account) internal view returns (uint256) {
        return
            _calculateBaseAmountToPwIpor(
                _baseBalance[account],
                _calculateInternalExchangeRate(_iporToken)
            );
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
