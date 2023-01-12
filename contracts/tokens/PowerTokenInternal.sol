// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../libraries/errors/MiningErrors.sol";
import "../libraries/math/PowerTokenMath.sol";
import "../libraries/Constants.sol";
import "../interfaces/types/PowerTokenTypes.sol";
import "../interfaces/IStakedToken.sol";
import "../interfaces/IPowerTokenInternal.sol";
import "../interfaces/ILiquidityMining.sol";
import "../security/MiningOwnableUpgradeable.sol";

abstract contract PowerTokenInternal is
    PausableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    MiningOwnableUpgradeable,
    IPowerTokenInternal
{
    /// @dev 2 weeks
    uint256 public constant COOL_DOWN_IN_SECONDS = 2 * 7 * 24 * 60 * 60;

    bytes32 internal constant _STAKED_TOKEN_ID =
        0xdba05ed67d0251facfcab8345f27ccd3e72b5a1da8cebfabbcccf4316e6d053c;
    bytes32 internal constant _LIQUIDITY_MINING_ID =
        0x9b1f3aa590476fc9aa58d44ad1419ab53d34c344bd5ed46b12e4af7d27c38e06;

    address internal _liquidityMining;
    address internal _stakedToken;
    address internal _pauseManager;

    /// @dev account address -> base amount, represented in 18 decimals
    mapping(address => uint256) internal _baseBalance;

    /// @dev balance of Power Token which are delegated to LiquidityMining, information per account, balance represented in 18 decimals
    mapping(address => uint256) internal _delegatedToLiquidityMiningBalance;
    // account address -> {endTimestamp, amount}
    mapping(address => PowerTokenTypes.PwTokenCoolDown) internal _coolDowns;
    uint256 internal _baseTotalSupply;
    uint256 internal _unstakeWithoutCooldownFee;

    modifier onlyLiquidityMining() {
        require(_msgSender() == _liquidityMining, MiningErrors.CALLER_NOT_LIQUIDITY_MINING);
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

    function initialize(address stakedToken) public initializer {
        __Pausable_init_unchained();
        __Ownable_init_unchained();
        __UUPSUpgradeable_init_unchained();
        require(stakedToken != address(0), MiningErrors.WRONG_ADDRESS);
        require(
            IStakedToken(stakedToken).getContractId() == _STAKED_TOKEN_ID,
            MiningErrors.WRONG_CONTRACT_ID
        );
        _stakedToken = stakedToken;
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
        return _calculateInternalExchangeRate(_stakedToken);
    }

    function getLiquidityMining() external view override returns (address) {
        return _liquidityMining;
    }

    function getStakedToken() external view override returns (address) {
        return _stakedToken;
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

    function setLiquidityMining(address newLiquidityMiningAddr) external override onlyOwner {
        require(newLiquidityMiningAddr != address(0), MiningErrors.WRONG_ADDRESS);
        require(
            ILiquidityMining(newLiquidityMiningAddr).getContractId() == _LIQUIDITY_MINING_ID,
            MiningErrors.WRONG_CONTRACT_ID
        );
        address oldLiquidityMiningAddr = _liquidityMining;
        _liquidityMining = newLiquidityMiningAddr;
        emit LiquidityMiningChanged(_msgSender(), oldLiquidityMiningAddr, newLiquidityMiningAddr);
    }

    function setPauseManager(address newPauseManagerAddr) external override onlyOwner {
        require(newPauseManagerAddr != address(0), MiningErrors.WRONG_ADDRESS);
        address oldPauseManagerAddr = _pauseManager;
        _pauseManager = newPauseManagerAddr;
        emit PauseManagerChanged(_msgSender(), oldPauseManagerAddr, newPauseManagerAddr);
    }

    function receiveRewardsFromLiquidityMining(address account, uint256 pwTokenAmount)
        external
        override
        whenNotPaused
        onlyLiquidityMining
    {
        address stakedTokenAddress = _stakedToken;
        /// @dev We need this value before transfer tokens
        uint256 exchangeRate = _calculateInternalExchangeRate(stakedTokenAddress);
        require(pwTokenAmount > 0, MiningErrors.VALUE_NOT_GREATER_THAN_ZERO);

        IERC20Upgradeable(stakedTokenAddress).transferFrom(
            _msgSender(),
            address(this),
            pwTokenAmount
        );

        uint256 baseAmount = PowerTokenMath.division(pwTokenAmount * Constants.D18, exchangeRate);

        _baseBalance[account] += baseAmount;
        _baseTotalSupply += baseAmount;

        emit ReceiveRewards(account, pwTokenAmount);
    }

    function pause() external override onlyPauseManager {
        _pause();
    }

    function unpause() external override onlyPauseManager {
        _unpause();
    }

    function _calculateInternalExchangeRate(address stakedTokenAddress)
        internal
        view
        returns (uint256)
    {
        uint256 baseTotalSupply = _baseTotalSupply;

        if (baseTotalSupply == 0) {
            return Constants.D18;
        }

        uint256 balanceOfStakedToken = IERC20Upgradeable(stakedTokenAddress).balanceOf(
            address(this)
        );

        if (balanceOfStakedToken == 0) {
            return Constants.D18;
        }

        return PowerTokenMath.division(balanceOfStakedToken * Constants.D18, baseTotalSupply);
    }

    function _calculateAmountWithCooldownFeeSubtracted(uint256 baseAmount)
        internal
        view
        returns (uint256)
    {
        return
            PowerTokenMath.division(
                (Constants.D18 - _unstakeWithoutCooldownFee) * baseAmount,
                Constants.D18
            );
    }

    function _calculateBaseAmountToPwToken(uint256 baseAmount, uint256 exchangeRate)
        internal
        pure
        returns (uint256)
    {
        return PowerTokenMath.division(baseAmount * exchangeRate, Constants.D18);
    }

    function _getAvailablePwTokenAmount(address account, uint256 exchangeRate)
        internal
        view
        returns (uint256)
    {
        return
            _calculateBaseAmountToPwToken(_baseBalance[account], exchangeRate) -
            _delegatedToLiquidityMiningBalance[account] -
            _coolDowns[account].pwTokenAmount;
    }

    function _balanceOf(address account) internal view returns (uint256) {
        return
            _calculateBaseAmountToPwToken(
                _baseBalance[account],
                _calculateInternalExchangeRate(_stakedToken)
            );
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
