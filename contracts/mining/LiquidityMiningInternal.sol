// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../libraries/errors/Errors.sol";
import "../libraries/math/MiningCalculation.sol";
import "../libraries/Constants.sol";
import "../interfaces/types/LiquidityMiningTypes.sol";
import "../interfaces/ILiquidityMining.sol";
import "../interfaces/ILiquidityMiningInternal.sol";
import "../interfaces/IPowerToken.sol";
import "../interfaces/IStakedToken.sol";
import "../interfaces/IPowerTokenInternal.sol";
import "../security/MiningOwnableUpgradeable.sol";

abstract contract LiquidityMiningInternal is
    Initializable,
    PausableUpgradeable,
    UUPSUpgradeable,
    MiningOwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    ILiquidityMiningInternal
{
    using SafeCast for uint256;
    using SafeCast for int256;

    bytes32 internal constant _STAKED_TOKEN_ID =
        0xdba05ed67d0251facfcab8345f27ccd3e72b5a1da8cebfabbcccf4316e6d053c;
    bytes32 internal constant _POWER_TOKEN_ID =
        0xbd22bf01cb7daed462db61de31bb111aabcdae27adc748450fb9a9ea1c419cce;

    address internal _powerToken;
    address internal _pauseManager;

    mapping(address => bool) internal _lpTokens;
    mapping(address => uint256) internal _allocatedPwTokens;

    mapping(address => LiquidityMiningTypes.GlobalRewardsIndicators) internal _globalIndicators;
    //  account address => lpToken address => account params
    mapping(address => mapping(address => LiquidityMiningTypes.AccountRewardsIndicators))
        internal _accountIndicators;

    modifier onlyPowerToken() {
        require(_msgSender() == _getPowerToken(), Errors.CALLER_NOT_POWER_TOKEN);
        _;
    }

    modifier onlyPauseManager() {
        require(_msgSender() == _pauseManager, Errors.CALLER_NOT_PAUSE_MANAGER);
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address[] calldata lpTokens,
        address powerToken,
        address stakedToken
    ) public initializer {
        __Pausable_init_unchained();
        __Ownable_init_unchained();
        __UUPSUpgradeable_init_unchained();

        require(powerToken != address(0), Errors.WRONG_ADDRESS);
        require(
            IPowerToken(powerToken).getContractId() == _POWER_TOKEN_ID,
            Errors.WRONG_CONTRACT_ID
        );
        require(stakedToken != address(0), Errors.WRONG_ADDRESS);
        require(
            IStakedToken(stakedToken).getContractId() == _STAKED_TOKEN_ID,
            Errors.WRONG_CONTRACT_ID
        );

        uint256 lpTokensLength = lpTokens.length;

        _powerToken = powerToken;
        _pauseManager = _msgSender();

        IStakedToken(stakedToken).approve(powerToken, Constants.MAX_VALUE);

        for (uint256 i; i != lpTokensLength; ++i) {
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
        }
    }

    function getVersion() external pure override returns (uint256) {
        return 2;
    }

    function getPauseManager() external view override returns (address) {
        return _pauseManager;
    }

    function isLpTokenSupported(address lpToken) external view override returns (bool) {
        return _lpTokens[lpToken];
    }

    function getGlobalIndicators(address lpToken)
        external
        view
        override
        returns (LiquidityMiningTypes.GlobalRewardsIndicators memory)
    {
        return _globalIndicators[lpToken];
    }

    function getAccountIndicators(address account, address lpToken)
        external
        view
        override
        returns (LiquidityMiningTypes.AccountRewardsIndicators memory)
    {
        return _accountIndicators[account][lpToken];
    }

    function delegatePwToken(
        address account,
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts
    ) external override onlyPowerToken whenNotPaused {
        uint256 rewards;
        uint256 lpTokensLength = lpTokens.length;
        uint256 rewardsIteration;
        uint256 accruedCompMultiplierCumulativePrevBlock;
        LiquidityMiningTypes.AccountRewardsIndicators memory accountIndicators;
        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators;

        for (uint256 i; i != lpTokensLength; ++i) {
            require(_lpTokens[lpTokens[i]], Errors.LP_TOKEN_NOT_SUPPORTED);

            accountIndicators = _accountIndicators[account][lpTokens[i]];
            globalIndicators = _globalIndicators[lpTokens[i]];

            /// @dev when account not stake any IP Token then calculation rewards and rebalancing is redundant
            if (accountIndicators.lpTokenBalance == 0) {
                uint256 newBalance = accountIndicators.delegatedPwTokenBalance + pwTokenAmounts[i];
                _accountIndicators[account][lpTokens[i]].delegatedPwTokenBalance = newBalance
                    .toUint96();
                emit PwTokenDelegated(account, lpTokens[i], pwTokenAmounts[i]);
                continue;
            }

            (rewardsIteration, accruedCompMultiplierCumulativePrevBlock) = _calculateAccountRewards(
                globalIndicators,
                accountIndicators
            );

            rewards += rewardsIteration;

            _rebalanceIndicators(
                account,
                lpTokens[i],
                accruedCompMultiplierCumulativePrevBlock,
                globalIndicators,
                accountIndicators,
                accountIndicators.lpTokenBalance,
                accountIndicators.delegatedPwTokenBalance + pwTokenAmounts[i]
            );
            emit PwTokenDelegated(account, lpTokens[i], pwTokenAmounts[i]);
        }

        if (rewards > 0) {
            _transferRewardsToPowerToken(account, rewards);
        }
    }

    function delegatePwTokenAndStakeLpToken(
        address account,
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts,
        uint256[] calldata lpTokenAmounts
    ) external override onlyPowerToken whenNotPaused {
        uint256 rewards;
        uint256 lpTokenAmount;
        uint256 pwTokenAmount;

        for (uint256 i; i != lpTokens.length; ++i) {
            require(_lpTokens[lpTokens[i]], Errors.LP_TOKEN_NOT_SUPPORTED);
            lpTokenAmount = lpTokenAmounts[i];
            pwTokenAmount = pwTokenAmounts[i];

            LiquidityMiningTypes.AccountRewardsIndicators
                memory accountIndicators = _accountIndicators[account][lpTokens[i]];
            LiquidityMiningTypes.GlobalRewardsIndicators
                memory globalIndicators = _globalIndicators[lpTokens[i]];

            /// @dev Order is important! First Stake, then Delegate.
            /// @dev Stake
            if (lpTokenAmount > 0) {
                IERC20Upgradeable(lpTokens[i]).transferFrom(account, address(this), lpTokenAmount);
            }

            /// @dev Delegate
            if (accountIndicators.lpTokenBalance == 0 && lpTokenAmount == 0) {
                _accountIndicators[account][lpTokens[i]]
                    .delegatedPwTokenBalance = (accountIndicators.delegatedPwTokenBalance +
                    pwTokenAmount).toUint96();
                emit PwTokenDelegated(account, lpTokens[i], pwTokenAmount);
                continue;
            }

            (
                uint256 rewardsIteration,
                uint256 accruedCompMultiplierCumulativePrevBlock
            ) = _calculateAccountRewards(globalIndicators, accountIndicators);

            rewards += rewardsIteration;

            _rebalanceIndicators(
                account,
                lpTokens[i],
                accruedCompMultiplierCumulativePrevBlock,
                globalIndicators,
                accountIndicators,
                accountIndicators.lpTokenBalance + lpTokenAmount,
                accountIndicators.delegatedPwTokenBalance + pwTokenAmount
            );
            emit PwTokenDelegatedAndLpTokenStaked(
                account,
                lpTokens[i],
                pwTokenAmount,
                lpTokenAmount
            );
        }

        if (rewards > 0) {
            _transferRewardsToPowerToken(account, rewards);
        }
    }

    function undelegatePwToken(
        address account,
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts
    ) external onlyPowerToken whenNotPaused {
        uint256 rewards;
        uint256 lpTokensLength = lpTokens.length;
        uint256 rewardsIteration;
        uint256 accruedCompMultiplierCumulativePrevBlock;
        LiquidityMiningTypes.AccountRewardsIndicators memory accountIndicators;
        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators;

        for (uint256 i; i != lpTokensLength; ++i) {
            require(_lpTokens[lpTokens[i]], Errors.LP_TOKEN_NOT_SUPPORTED);

            accountIndicators = _accountIndicators[account][lpTokens[i]];

            require(
                accountIndicators.delegatedPwTokenBalance >= pwTokenAmounts[i],
                Errors.ACC_DELEGATED_TO_LIQUIDITY_MINING_BALANCE_IS_TOO_LOW
            );

            globalIndicators = _globalIndicators[lpTokens[i]];

            (rewardsIteration, accruedCompMultiplierCumulativePrevBlock) = _calculateAccountRewards(
                globalIndicators,
                accountIndicators
            );

            rewards += rewardsIteration;

            _rebalanceIndicators(
                account,
                lpTokens[i],
                accruedCompMultiplierCumulativePrevBlock,
                globalIndicators,
                accountIndicators,
                accountIndicators.lpTokenBalance,
                accountIndicators.delegatedPwTokenBalance - pwTokenAmounts[i]
            );

            emit PwTokenUndelegated(account, lpTokens[i], pwTokenAmounts[i]);
        }

        if (rewards > 0) {
            _transferRewardsToPowerToken(account, rewards);
        }
    }

    function setRewardsPerBlock(address lpToken, uint32 pwTokenAmount) external override onlyOwner {
        _setRewardsPerBlock(lpToken, pwTokenAmount);
    }

    function addLpToken(address lpToken) external onlyOwner {
        require(lpToken != address(0), Errors.WRONG_ADDRESS);
        _lpTokens[lpToken] = true;

        emit LpTokenAdded(_msgSender(), lpToken);
    }

    function removeLpToken(address lpToken) external override onlyOwner {
        require(lpToken != address(0), Errors.WRONG_ADDRESS);
        _setRewardsPerBlock(lpToken, 0);
        _lpTokens[lpToken] = false;
        emit LpTokenRemoved(_msgSender(), lpToken);
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

    function _unstake(
        address lpToken,
        uint256 lpTokenAmount,
        bool claimRewards
    ) internal {
        require(lpTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        address msgSender = _msgSender();

        LiquidityMiningTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[
            msgSender
        ][lpToken];

        require(
            accountIndicators.lpTokenBalance >= lpTokenAmount,
            Errors.ACCOUNT_LP_TOKEN_BALANCE_IS_TOO_LOW
        );

        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[
            lpToken
        ];

        (
            uint256 rewardsAmount,
            uint256 accruedCompMultiplierCumulativePrevBlock
        ) = _calculateAccountRewards(globalIndicators, accountIndicators);

        _rebalanceIndicators(
            msgSender,
            lpToken,
            accruedCompMultiplierCumulativePrevBlock,
            globalIndicators,
            accountIndicators,
            accountIndicators.lpTokenBalance - lpTokenAmount,
            accountIndicators.delegatedPwTokenBalance
        );

        if (rewardsAmount > 0) {
            if (claimRewards) {
                _transferRewardsToPowerToken(msgSender, rewardsAmount);
            } else {
                _allocatedPwTokens[msgSender] += rewardsAmount;
            }
        }

        IERC20Upgradeable(lpToken).transfer(msgSender, lpTokenAmount);

        emit LpTokensUnstaked(msgSender, lpToken, lpTokenAmount);
    }

    /// @dev Rebalance makes that rewards for account are reset in current block.
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
            lpTokenBalance,
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

        /// @dev check if we should update rewards, it should happened when at least one account stakes lpTokens
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

        emit RewardsPerBlockChanged(_msgSender(), globalIndicators.rewardsPerBlock, pwTokenAmount);
    }

    /// @dev Claim not changes Internal Exchange Rate of Power Tokens in PowerToken smart contract.
    function _transferRewardsToPowerToken(address account, uint256 rewardsAmount) internal {
        IPowerTokenInternal(_getPowerToken()).receiveRewardsFromLiquidityMining(
            account,
            rewardsAmount
        );
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

    function _getPowerToken() internal view returns (address) {
        return _powerToken;
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
