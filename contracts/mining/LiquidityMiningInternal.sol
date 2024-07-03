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
import "../security/MiningOwnableUpgradeable.sol";
import "../security/PauseManager.sol";
import "../interfaces/IProxyImplementation.sol";
import "../libraries/math/MiningCalculationAccountPowerUp.sol";

abstract contract LiquidityMiningInternal is
    Initializable,
    PausableUpgradeable,
    UUPSUpgradeable,
    MiningOwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    ILiquidityMiningInternal,
    IProxyImplementation
{
    using SafeCast for uint256;
    using SafeCast for int256;

    address public immutable routerAddress;

    // @deprecated field is deprecated
    address internal _powerTokenDeprecated;
    // @deprecated field is deprecated
    address internal _pauseManagerDeprecated;

    mapping(address => bool) internal _lpTokens;
    mapping(address => uint256) internal _allocatedPwTokens;

    mapping(address => LiquidityMiningTypes.GlobalRewardsIndicators) internal _globalIndicators;

    /// @dev account address => lpToken address => account params
    mapping(address => mapping(address => LiquidityMiningTypes.AccountRewardsIndicators))
        internal _accountIndicators;

    mapping(address lpToken => LiquidityMiningTypes.PoolPowerUpModifier)
        internal _accountPowerUpModifiers;

    constructor(address routerAddressInput) {
        routerAddress = routerAddressInput;
    }

    /// @dev Throws an error if called by any account other than the pause guardian.
    modifier onlyPauseGuardian() {
        require(PauseManager.isPauseGuardian(msg.sender), Errors.CALLER_NOT_GUARDIAN);
        _;
    }

    modifier onlyRouter() {
        require(msg.sender == routerAddress, Errors.CALLER_NOT_ROUTER);
        _;
    }

    function initialize(address[] calldata lpTokens) public initializer {
        __Pausable_init_unchained();
        __Ownable_init_unchained();
        __UUPSUpgradeable_init_unchained();

        for (uint256 i; i != lpTokens.length; ) {
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
        return 2_002;
    }

    function isLpTokenSupported(address lpToken) external view override returns (bool) {
        return _lpTokens[lpToken];
    }

    function setRewardsPerBlock(
        address[] calldata lpTokens,
        uint32[] calldata pwTokenAmounts
    ) external override onlyOwner {
        require(lpTokens.length == pwTokenAmounts.length, Errors.INPUT_ARRAYS_LENGTH_MISMATCH);

        for (uint256 i; i < lpTokens.length; ) {
            _setRewardsPerBlock(lpTokens[i], pwTokenAmounts[i]);
            unchecked {
                ++i;
            }
        }
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

    function pause() external override onlyPauseGuardian {
        _pause();
    }

    function unpause() external override onlyOwner {
        _unpause();
    }

    /// @notice Adds a new pause guardian to the contract.
    /// @param guardians The addresses of the new pause guardians.
    /// @dev Only the contract owner can call this function.
    function addPauseGuardians(address[] calldata guardians) external onlyOwner {
        PauseManager.addPauseGuardians(guardians);
    }

    /// @notice Removes a pause guardian from the contract.
    /// @param guardians The addresses of the pause guardians to be removed.
    /// @dev Only the contract owner can call this function.
    function removePauseGuardians(address[] calldata guardians) external onlyOwner {
        PauseManager.removePauseGuardians(guardians);
    }

    /// @notice Checks if an address is a pause guardian.
    /// @param guardian The address to be checked.
    /// @return A boolean indicating whether the address is a pause guardian (true) or not (false).
    function isPauseGuardian(address guardian) external view returns (bool) {
        return PauseManager.isPauseGuardian(guardian);
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

    function getPoolPowerUpModifiers(
        address lpToken
    )
        public
        view
        override
        returns (uint256 pwTokenModifier, uint256 logBase, uint256 vectorOfCurve)
    {
        LiquidityMiningTypes.PoolPowerUpModifier memory data = _accountPowerUpModifiers[lpToken];
        if (data.pwTokenModifier == 0) {
            return (2e18, 2e18, 0);
        }
        /// @dev value in storage have 10 decimals, and at the output we want to have 18 decimals
        return (
            uint256(data.pwTokenModifier) * 1e8,
            uint256(data.logBase) * 1e8,
            uint256(data.vectorOfCurve) * 1e8
        );
    }

    function setPoolPowerUpModifiers(
        address[] memory lpTokens,
        LiquidityMiningTypes.PoolPowerUpModifier[] memory modifiers
    ) external override onlyOwner {
        uint256 length = lpTokens.length;

        require(length == modifiers.length, Errors.INPUT_ARRAYS_LENGTH_MISMATCH);

        for (uint256 i; i < length; ++i) {
            require(lpTokens[i] != address(0), Errors.WRONG_ADDRESS);
            require(modifiers[i].pwTokenModifier > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);
            require(modifiers[i].logBase != 0 && modifiers[i].logBase != 1e10, Errors.WRONG_VALUE);

            _accountPowerUpModifiers[lpTokens[i]] = LiquidityMiningTypes.PoolPowerUpModifier({
                pwTokenModifier: modifiers[i].pwTokenModifier,
                logBase: modifiers[i].logBase,
                vectorOfCurve: modifiers[i].vectorOfCurve
            });
            emit AccountPowerUpModifiersUpdated(
                lpTokens[i],
                modifiers[i].logBase,
                modifiers[i].pwTokenModifier,
                modifiers[i].vectorOfCurve
            );
        }
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
        (uint256 pwTokenModifier, uint256 logBase, uint256 vectorOfCurve) = getPoolPowerUpModifiers(
            lpToken
        );
        uint256 accountPowerUp = MiningCalculationAccountPowerUp.calculateAccountPowerUp(
            AccountPowerUpData({
                accountPwTokenAmount: delegatedPwTokenBalance,
                accountLpTokenAmount: _calculateWeightedLpTokenBalance(lpToken, lpTokenBalance),
                verticalShift: _getVerticalShift(),
                horizontalShift: _getHorizontalShift(),
                logBase: logBase,
                pwTokenModifier: pwTokenModifier,
                vectorOfCurve: vectorOfCurve
            })
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

    function _calculateWeightedLpTokenBalance(
        address lpToken,
        uint256 lpTokenBalance
    ) internal view virtual returns (uint256);

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
