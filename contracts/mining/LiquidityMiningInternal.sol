// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../libraries/errors/Errors.sol";
import "../libraries/math/MiningCalculation.sol";
import "../interfaces/types/LiquidityMiningTypes.sol";
import "../interfaces/ILiquidityMiningInternal.sol";
import "../interfaces/IGovernanceToken.sol";
import "../interfaces/IPowerToken.sol";
import "../interfaces/AggregatorV3Interface.sol";
import "../security/MiningOwnableUpgradeable.sol";
import "../interfaces/IProxyImplementation.sol";
import "../libraries/ContractValidator.sol";

abstract contract LiquidityMiningInternal is
    Initializable,
    PausableUpgradeable,
    UUPSUpgradeable,
    MiningOwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    ILiquidityMiningInternal,
    IProxyImplementation
{
    using ContractValidator for address;
    using SafeCast for uint256;
    using SafeCast for int256;

    address public immutable routerAddress;
    address public immutable lpStEth;
    address public immutable ethUsdOracle;

    // @deprecated field is deprecated
    address internal _powerTokenDeprecated;
    address internal _pauseManager;

    mapping(address => bool) internal _lpTokens;
    mapping(address => uint256) internal _allocatedPwTokens;

    mapping(address => LiquidityMiningTypes.GlobalRewardsIndicators) internal _globalIndicators;

    /// @dev account address => lpToken address => account params
    mapping(address => mapping(address => LiquidityMiningTypes.AccountRewardsIndicators))
        internal _accountIndicators;

    constructor(address routerAddressInput, address lpStEthInput, address ethUsdOracleInput) {
        routerAddress = routerAddressInput.checkAddress();
        lpStEth = lpStEthInput.checkAddress();
        ethUsdOracle = ethUsdOracleInput.checkAddress();
    }

    modifier onlyPauseManager() {
        require(_msgSender() == _pauseManager, Errors.CALLER_NOT_PAUSE_MANAGER);
        _;
    }

    modifier onlyRouter() {
        require(_msgSender() == routerAddress, Errors.CALLER_NOT_ROUTER);
        _;
    }

    function initialize(address[] calldata lpTokens) public initializer {
        __Pausable_init_unchained();
        __Ownable_init_unchained();
        __UUPSUpgradeable_init_unchained();

        uint256 lpTokensLength = lpTokens.length;

        _pauseManager = _msgSender();

        for (uint256 i; i != lpTokensLength; ) {
            require(lpTokens[i] != address(0), Errors.WRONG_ADDRESS);

            _lpTokens[lpTokens[i]] = true;

            _globalIndicators[lpTokens[i]] = LiquidityMiningTypes.GlobalRewardsIndicators(
                0,
                0,
                0,
                0,
                0,
                0
            );
            unchecked {
                ++i;
            }
        }
    }

    function getVersion() external pure override returns (uint256) {
        return 2_001;
    }

    function getPauseManager() external view override returns (address) {
        return _pauseManager;
    }

    function isLpTokenSupported(address lpToken) external view override returns (bool) {
        return _lpTokens[lpToken];
    }

    function setRewardsPerBlock(address lpToken, uint32 pwTokenAmount) external override onlyOwner {
        _setRewardsPerBlock(lpToken, pwTokenAmount);
    }

    function newSupportedLpToken(address lpToken) external onlyOwner {
        require(lpToken != address(0), Errors.WRONG_ADDRESS);
        _lpTokens[lpToken] = true;

        emit NewLpTokenSupported(msg.sender, lpToken);
    }

    function phasingOutLpToken(address lpToken) external override onlyOwner {
        require(lpToken != address(0), Errors.WRONG_ADDRESS);
        _setRewardsPerBlock(lpToken, 0);
        _lpTokens[lpToken] = false;
        emit LpTokenSupportRemoved(msg.sender, lpToken);
    }

    function setPauseManager(address newPauseManagerAddr) external override onlyOwner {
        require(newPauseManagerAddr != address(0), Errors.WRONG_ADDRESS);
        _pauseManager = newPauseManagerAddr;
        emit PauseManagerChanged(newPauseManagerAddr);
    }

    function pause() external override onlyPauseManager {
        _pause();
    }

    function unpause() external override onlyPauseManager {
        _unpause();
    }

    function grantAllowanceForRouter(address erc20Token) external override onlyOwner {
        require(erc20Token != address(0), Errors.WRONG_ADDRESS);

        IERC20(erc20Token).approve(routerAddress, type(uint256).max);
        emit AllowanceGranted(erc20Token, routerAddress);
    }

    function revokeAllowanceForRouter(address erc20Token) external override onlyOwner {
        require(erc20Token != address(0), Errors.WRONG_ADDRESS);

        IERC20(erc20Token).approve(routerAddress, 0);
        emit AllowanceRevoked(erc20Token, routerAddress);
    }

    function getImplementation() external view override returns (address) {
        return StorageSlotUpgradeable.getAddressSlot(_IMPLEMENTATION_SLOT).value;
    }

    /// @dev Rebalance causes account's rewards to reset in current block.
    function _rebalanceIndicators(
        address account,
        address lpToken,
        uint256 accruedCompMultiplierCumulativePrevBlock,
        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators,
        LiquidityMiningTypes.AccountRewardsIndicators memory accountIndicators,
        uint256 lpTokenBalance,
        uint256 delegatedPwTokenBalance
    ) internal {
        uint256 accountPowerUp = MiningCalculation.calculateAccountPowerUp(
            delegatedPwTokenBalance,
            _calculateWeightedLpTokenBalance(lpToken, lpTokenBalance),
            _getVerticalShift(),
            _getHorizontalShift()
        );

        _accountIndicators[account][lpToken] = LiquidityMiningTypes.AccountRewardsIndicators(
            accruedCompMultiplierCumulativePrevBlock.toUint128(),
            lpTokenBalance.toUint128(),
            accountPowerUp.toUint72(),
            delegatedPwTokenBalance.toUint96()
        );

        uint256 aggregatedPowerUp = MiningCalculation.calculateAggregatedPowerUp(
            accountPowerUp,
            lpTokenBalance,
            accountIndicators.powerUp,
            accountIndicators.lpTokenBalance,
            globalIndicators.aggregatedPowerUp
        );

        uint256 accruedRewards;

        /// @dev checks if rewards should be updated, It's truggered if at least one account stakes lpTokens
        if (globalIndicators.aggregatedPowerUp == 0) {
            accruedRewards = globalIndicators.accruedRewards;
        } else {
            accruedRewards = MiningCalculation.calculateAccruedRewards(
                block.number,
                globalIndicators.blockNumber,
                globalIndicators.rewardsPerBlock,
                globalIndicators.accruedRewards
            );
        }

        uint256 compositeMultiplier = MiningCalculation.calculateCompositeMultiplier(
            globalIndicators.rewardsPerBlock,
            aggregatedPowerUp
        );

        _globalIndicators[lpToken] = LiquidityMiningTypes.GlobalRewardsIndicators(
            aggregatedPowerUp,
            compositeMultiplier.toUint128(),
            accruedCompMultiplierCumulativePrevBlock.toUint128(),
            block.number.toUint32(),
            globalIndicators.rewardsPerBlock,
            accruedRewards.toUint88()
        );
    }

    /// @notice Calculates the weighted balance of PW tokens based on the provided LP token and delegated balance.
    /// @dev If the provided LP token is not `lpStEth`, it simply returns the `delegatedPwTokenBalance`.
    /// If it is `lpStEth`, it calculates the weighted balance using the current ETH to USD price.
    /// @param lpToken Address of the LP token.
    /// @param lpTokenBalance The balance of lp tokens.
    /// @return uint256 The weighted balance of PW tokens.
    function _calculateWeightedLpTokenBalance(
        address lpToken,
        uint256 lpTokenBalance
    ) internal view returns (uint256) {
        if (lpToken != lpStEth) {
            return lpTokenBalance;
        }
        // @dev returned value has 8 decimal address on mainnet 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
        (, int256 answer, , , ) = AggregatorV3Interface(ethUsdOracle).latestRoundData();
        return MathOperation.division(lpTokenBalance * answer.toUint256(), 1e8);
    }

    function _calculateAccountRewards(
        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators,
        LiquidityMiningTypes.AccountRewardsIndicators memory accountIndicators
    )
        internal
        view
        returns (uint256 rewardsAmount, uint256 accruedCompMultiplierCumulativePrevBlock)
    {
        accruedCompMultiplierCumulativePrevBlock = MiningCalculation
            .calculateAccruedCompMultiplierCumulativePrevBlock(
                block.number,
                globalIndicators.blockNumber,
                globalIndicators.compositeMultiplierInTheBlock,
                globalIndicators.compositeMultiplierCumulativePrevBlock
            );

        rewardsAmount = MiningCalculation.calculateAccountRewards(
            accountIndicators.lpTokenBalance,
            accountIndicators.powerUp,
            accountIndicators.compositeMultiplierCumulativePrevBlock,
            accruedCompMultiplierCumulativePrevBlock
        );
    }

    function _setRewardsPerBlock(address lpToken, uint32 pwTokenAmount) internal {
        require(_lpTokens[lpToken], Errors.LP_TOKEN_NOT_SUPPORTED);

        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[
            lpToken
        ];
        uint256 blockNumber = block.number;

        uint256 accruedCompositeMultiplierCumulativePrevBlock = MiningCalculation
            .calculateAccruedCompMultiplierCumulativePrevBlock(
                blockNumber,
                globalIndicators.blockNumber,
                globalIndicators.compositeMultiplierInTheBlock,
                globalIndicators.compositeMultiplierCumulativePrevBlock
            );

        uint256 accruedRewards;
        if (globalIndicators.aggregatedPowerUp != 0) {
            accruedRewards = MiningCalculation.calculateAccruedRewards(
                blockNumber.toUint32(),
                globalIndicators.blockNumber,
                globalIndicators.rewardsPerBlock,
                globalIndicators.accruedRewards
            );
        } else {
            accruedRewards = globalIndicators.accruedRewards;
        }

        uint256 compositeMultiplier = MiningCalculation.calculateCompositeMultiplier(
            pwTokenAmount,
            globalIndicators.aggregatedPowerUp
        );

        _globalIndicators[lpToken] = LiquidityMiningTypes.GlobalRewardsIndicators(
            globalIndicators.aggregatedPowerUp,
            compositeMultiplier.toUint128(),
            accruedCompositeMultiplierCumulativePrevBlock.toUint128(),
            blockNumber.toUint32(),
            pwTokenAmount,
            accruedRewards.toUint88()
        );

        emit RewardsPerBlockChanged(lpToken, pwTokenAmount);
    }

    /// @notice Gets Horizontal shift param used in Liquidity Mining equations.
    /// @dev To pre-calculate this value from uint256, use {MiningCalculation._toQuadruplePrecision()} method.
    /// @dev 0.5 = ABDKMathQuad.div(ABDKMathQuad.fromUInt(5), ABDKMathQuad.fromUInt(10))
    /// @dev Notice! uint256 value before calculation has the following constraints: 0.5 <= Horizontal Shift <= 10^3
    /// @return horizontal shift - value represented in bytes16, quadruple precision, 128 bits, it takes into consideration 18 decimals
    function _getHorizontalShift() internal pure virtual returns (bytes16) {
        return 0x3ffe0000000000000000000000000000;
    }

    /// @notice Gets vertical shift param used in Liquidity Mining equations.
    /// @dev To pre-calculate this value from uint256, use {MiningCalculation._toQuadruplePrecision()} method.
    /// @dev 1.4 = ABDKMathQuad.div(ABDKMathQuad.fromUInt(14), ABDKMathQuad.fromUInt(10))
    /// @dev Notice! uint256 value before calculation has the following constraints: 10^(-4) <= Vertical Shift <= 3
    /// @return vertical shift - value represented in bytes16, quadruple precision, 128 bits, it takes into consideration 18 decimals
    function _getVerticalShift() internal pure virtual returns (bytes16) {
        return 0x3fff6666666666666666666666666666;
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
