// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../libraries/errors/Errors.sol";
import "../libraries/math/Math.sol";
import "../libraries/Constants.sol";
import "../interfaces/types/PowerTokenTypes.sol";
import "../interfaces/IStakedToken.sol";
import "../security/MiningOwnableUpgradeable.sol";
import "../interfaces/IPowerTokenInternalV2.sol";
import "../interfaces/ILiquidityMiningV2.sol";

abstract contract PowerTokenInternalV2 is
    PausableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    MiningOwnableUpgradeable,
    IPowerTokenInternalV2
{
    /// @dev 14 days
    uint256 public constant COOL_DOWN_IN_SECONDS = 2 * 7 * 24 * 60 * 60;

    bytes32 internal constant _STAKED_TOKEN_ID =
        0xdba05ed67d0251facfcab8345f27ccd3e72b5a1da8cebfabbcccf4316e6d053c;
    bytes32 internal constant _LIQUIDITY_MINING_ID =
        0x9b1f3aa590476fc9aa58d44ad1419ab53d34c344bd5ed46b12e4af7d27c38e06;

    address internal _liquidityMining;
    address internal _stakedToken;
    address internal _pauseManager;

    /// @dev account address -> base amount, represented with 18 decimals
    mapping(address => uint256) internal _baseBalance;

    /// @dev balance of Power Token delegated to LiquidityMining, information per account, balance represented with 18 decimals
    mapping(address => uint256) internal _delegatedToLiquidityMiningBalance;
    // account address -> {endTimestamp, amount}
    mapping(address => PowerTokenTypes.PwTokenCooldown) internal _cooldowns;
    uint256 internal _baseTotalSupply;
    uint256 internal _unstakeWithoutCooldownFee;

    modifier onlyLiquidityMining() {
        require(_msgSender() == _liquidityMining, Errors.CALLER_NOT_LIQUIDITY_MINING);
        _;
    }

    modifier onlyPauseManager() {
        require(_msgSender() == _pauseManager, Errors.CALLER_NOT_PAUSE_MANAGER);
        _;
    }

    function initialize(address stakedToken) public initializer {
        __Pausable_init_unchained();
        __Ownable_init_unchained();
        __UUPSUpgradeable_init_unchained();
        require(stakedToken != address(0), Errors.WRONG_ADDRESS);
        require(
            IStakedToken(stakedToken).getContractId() == _STAKED_TOKEN_ID,
            Errors.WRONG_CONTRACT_ID
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
            Errors.UNSTAKE_WITHOUT_COOLDOWN_FEE_IS_TO_HIGH
        );
        uint256 oldValue = _unstakeWithoutCooldownFee;
        _unstakeWithoutCooldownFee = unstakeWithoutCooldownFee;
        emit UnstakeWithoutCooldownFeeChanged(_msgSender(), oldValue, unstakeWithoutCooldownFee);
    }

    function setLiquidityMining(address newLiquidityMiningAddr) external override onlyOwner {
        require(newLiquidityMiningAddr != address(0), Errors.WRONG_ADDRESS);
        require(
            ILiquidityMiningV2(newLiquidityMiningAddr).getContractId() == _LIQUIDITY_MINING_ID,
            Errors.WRONG_CONTRACT_ID
        );
        address oldLiquidityMiningAddr = _liquidityMining;
        _liquidityMining = newLiquidityMiningAddr;
        emit LiquidityMiningChanged(_msgSender(), oldLiquidityMiningAddr, newLiquidityMiningAddr);
    }

    function setPauseManager(address newPauseManagerAddr) external override onlyOwner {
        require(newPauseManagerAddr != address(0), Errors.WRONG_ADDRESS);
        address oldPauseManagerAddr = _pauseManager;
        _pauseManager = newPauseManagerAddr;
        emit PauseManagerChanged(_msgSender(), oldPauseManagerAddr, newPauseManagerAddr);
    }

    function pause() external override onlyPauseManager {
        _pause();
    }

    function unpause() external override onlyPauseManager {
        _unpause();
    }

    function grantAllowanceForRouter(address router, address erc20Token)
        external
        override
        onlyOwner
    {
        require(router != address(0), Errors.WRONG_ADDRESS);
        require(erc20Token != address(0), Errors.WRONG_ADDRESS);

        IERC20(erc20Token).approve(router, type(uint256).max);
        // todo: emit event
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

        return Math.division(balanceOfStakedToken * Constants.D18, baseTotalSupply);
    }

    function _calculateAmountWithCooldownFeeSubtracted(uint256 baseAmount)
        internal
        view
        returns (uint256)
    {
        return
            Math.division((Constants.D18 - _unstakeWithoutCooldownFee) * baseAmount, Constants.D18);
    }

    function _calculateBaseAmountToPwToken(uint256 baseAmount, uint256 exchangeRate)
        internal
        pure
        returns (uint256)
    {
        return Math.division(baseAmount * exchangeRate, Constants.D18);
    }

    function _getAvailablePwTokenAmount(address account, uint256 exchangeRate)
        internal
        view
        returns (uint256)
    {
        return
            _calculateBaseAmountToPwToken(_baseBalance[account], exchangeRate) -
            _delegatedToLiquidityMiningBalance[account] -
            _cooldowns[account].pwTokenAmount;
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
