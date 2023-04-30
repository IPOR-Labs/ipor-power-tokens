// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "forge-std/Test.sol";
import "../interfaces/ILiquidityMiningV2.sol";
import "./LiquidityMiningInternalV2.sol";

/// @title Smart contract responsible for distribution of Power Token rewards across accounts contributing to Liquidity Mining
/// by staking lpTokens and / or delegating Power Tokens.
contract LiquidityMiningV2 is LiquidityMiningInternalV2, ILiquidityMiningV2 {
    using SafeCast for uint256;
    using SafeCast for int256;
    //    ----------------------------------------------
    //    New implementation
    //    ----------------------------------------------
    address internal immutable ROUTER_ADDRESS; // Router address

    modifier onlyRouter() {
        require(_msgSender() == ROUTER_ADDRESS, Errors.NOT_ROUTER);
        _;
    }

    constructor(address routerAddress) {
        require(routerAddress != address(0), Errors.WRONG_ADDRESS);
        ROUTER_ADDRESS = routerAddress;
        _disableInitializers();
    }

    //    ----------------------------------------------
    //    New implementation
    //    ----------------------------------------------

    function getContractId() external pure returns (bytes32) {
        return 0x9b1f3aa590476fc9aa58d44ad1419ab53d34c344bd5ed46b12e4af7d27c38e06;
    }

    function balanceOf(address account, address lpToken) external view override returns (uint256) {
        return _accountIndicators[account][lpToken].lpTokenBalance;
    }

    function balanceOfDelegatedPwToken(address account, address[] calldata lpTokens)
        external
        view
        override
        returns (LiquidityMiningTypes.DelegatedPwTokenBalance[] memory balances)
    {
        uint256 lpTokensLength = lpTokens.length;
        balances = new LiquidityMiningTypes.DelegatedPwTokenBalance[](lpTokensLength);
        address lpToken;

        for (uint256 i; i != lpTokensLength; ++i) {
            lpToken = lpTokens[i];
            require(_lpTokens[lpToken], Errors.LP_TOKEN_NOT_SUPPORTED);
            balances[i] = LiquidityMiningTypes.DelegatedPwTokenBalance(
                lpToken,
                _accountIndicators[account][lpToken].delegatedPwTokenBalance
            );
        }
    }

    function balanceOfAllocatedPwTokens(address account)
        external
        view
        returns (uint256 allocatedPwTokens)
    {
        allocatedPwTokens = _allocatedPwTokens[account];
    }

    function calculateAccruedRewards(address lpToken) external view override returns (uint256) {
        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[
            lpToken
        ];
        if (globalIndicators.aggregatedPowerUp == 0) {
            return globalIndicators.accruedRewards;
        }
        return
            MiningCalculation.calculateAccruedRewards(
                block.number,
                globalIndicators.blockNumber,
                globalIndicators.rewardsPerBlock,
                globalIndicators.accruedRewards
            );
    }

    function calculateAccountRewards(address account, address lpToken)
        external
        view
        override
        returns (uint256)
    {
        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[
            lpToken
        ];
        LiquidityMiningTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[
            account
        ][lpToken];

        (uint256 rewardsAmount, ) = _calculateAccountRewards(globalIndicators, accountIndicators);

        return rewardsAmount;
    }

    function updateIndicators(address account, address[] calldata lpTokens)
        external
        override
        nonReentrant
        whenNotPaused
    {
        //        require(account != address(0), Errors.WRONG_ADDRESS);
        //        uint256 lpTokensLength = lpTokens.length;
        //        uint256 rewardsAmountToTransfer;
        //        for (uint256 i; i != lpTokensLength; ++i) {
        //            address lpToken = lpTokens[i];
        //            LiquidityMiningTypes.AccountRewardsIndicators
        //                memory accountIndicators = _accountIndicators[account][lpToken];
        //            LiquidityMiningTypes.GlobalRewardsIndicators
        //                memory globalIndicators = _globalIndicators[lpToken];
        //
        //            if (accountIndicators.lpTokenBalance == 0) {
        //                continue;
        //            }
        //
        //            (
        //                uint256 rewardsAmount,
        //                uint256 accruedCompMultiplierCumulativePrevBlock
        //            ) = _calculateAccountRewards(globalIndicators, accountIndicators);
        //            rewardsAmountToTransfer += rewardsAmount;
        //            _rebalanceIndicators(
        //                account,
        //                lpToken,
        //                accruedCompMultiplierCumulativePrevBlock,
        //                globalIndicators,
        //                accountIndicators,
        //                accountIndicators.lpTokenBalance,
        //                accountIndicators.delegatedPwTokenBalance
        //            );
        //            emit IndicatorsUpdated(account, lpToken);
        //        }
        //        if (rewardsAmountToTransfer > 0) {
        //            _transferRewardsToPowerToken(account, rewardsAmountToTransfer);
        //        }
    }

    function stake(address lpToken, uint256 lpTokenAmount)
        external
        override
        nonReentrant
        whenNotPaused
    {}

    function unstake(address lpToken, uint256 lpTokenAmount)
        external
        override
        nonReentrant
        whenNotPaused
    {}

    function unstakeAndAllocatePwTokens(address lpToken, uint256 lpTokenAmount)
        external
        override
        nonReentrant
        whenNotPaused
    {
        //        _unstake(lpToken, lpTokenAmount, false);
    }

    function claim(address lpToken) external override whenNotPaused nonReentrant {
        //        address msgSender = _msgSender();
        //
        //        LiquidityMiningTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[
        //            msgSender
        //        ][lpToken];
        //        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[
        //            lpToken
        //        ];
        //
        //        (
        //            uint256 rewardsAmount,
        //            uint256 accruedCompMultiplierCumulativePrevBlock
        //        ) = _calculateAccountRewards(globalIndicators, accountIndicators);
        //
        //        require(rewardsAmount > 0, Errors.NO_REWARDS_TO_CLAIM);
        //
        //        _accountIndicators[msgSender][lpToken] = LiquidityMiningTypes.AccountRewardsIndicators(
        //            accruedCompMultiplierCumulativePrevBlock.toUint128(),
        //            accountIndicators.lpTokenBalance,
        //            accountIndicators.powerUp,
        //            accountIndicators.delegatedPwTokenBalance
        //        );
        //
        //        _transferRewardsToPowerToken(msgSender, rewardsAmount);
        //
        //        emit Claimed(msgSender, lpToken, rewardsAmount);
    }

    function claimAllocatedPwTokens() external override whenNotPaused nonReentrant {
        //        address msgSender = _msgSender();
        //        uint256 allocatedRewards = _allocatedPwTokens[msgSender];
        //        require(allocatedRewards > 0, Errors.NO_REWARDS_TO_CLAIM);
        //        _allocatedPwTokens[msgSender] = 0;
        //        _transferRewardsToPowerToken(msgSender, allocatedRewards);
        //        emit AllocatedTokensClaimed(msgSender, allocatedRewards);
    }

    //    ----------------------------------------------
    //    New implementation
    //    ----------------------------------------------

    function addLpTokens(ILiquidityMiningV2.UpdateLpToken[] memory updateLpToken)
        external
        override
        onlyRouter
        whenNotPaused
    {
        uint256 length = updateLpToken.length;
        for (uint256 i; i != length; ) {
            UpdateLpToken memory update = updateLpToken[i];
            require(update.lpTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);
            require(_lpTokens[update.lpToken], Errors.LP_TOKEN_NOT_SUPPORTED);

            LiquidityMiningTypes.AccountRewardsIndicators
                memory accountIndicators = _accountIndicators[update.onBehalfOf][update.lpToken];
            LiquidityMiningTypes.GlobalRewardsIndicators
                memory globalIndicators = _globalIndicators[update.lpToken];

            (
                uint256 rewardsAmount,
                uint256 accruedCompMultiplierCumulativePrevBlock
            ) = _calculateAccountRewards(globalIndicators, accountIndicators);

            _rebalanceIndicators(
                update.onBehalfOf,
                update.lpToken,
                accruedCompMultiplierCumulativePrevBlock,
                globalIndicators,
                accountIndicators,
                accountIndicators.lpTokenBalance + update.lpTokenAmount,
                accountIndicators.delegatedPwTokenBalance
            );

            if (rewardsAmount > 0) {
                _allocatedPwTokens[update.onBehalfOf] += rewardsAmount;
            }
            unchecked {
                ++i;
            }
        }
    }

    function getGlobalIndicators(address[] calldata lpTokens)
        external
        view
        override
        returns (ILiquidityMiningV2.GlobalIndicatorsResult[] memory)
    {
        uint256 length = lpTokens.length;

        ILiquidityMiningV2.GlobalIndicatorsResult[]
            memory accountIndicators = new ILiquidityMiningV2.GlobalIndicatorsResult[](length);

        for (uint256 i; i != length; ) {
            accountIndicators[i] = ILiquidityMiningV2.GlobalIndicatorsResult(
                lpTokens[i],
                _globalIndicators[lpTokens[i]]
            );
            unchecked {
                ++i;
            }
        }
        return accountIndicators;
    }

    function getAccountIndicators(address account, address[] calldata lpTokens)
        external
        view
        override
        returns (ILiquidityMiningV2.AccountIndicatorsResult[] memory)
    {
        uint256 length = lpTokens.length;

        ILiquidityMiningV2.AccountIndicatorsResult[]
            memory accountIndicators = new ILiquidityMiningV2.AccountIndicatorsResult[](length);

        for (uint256 i; i != length; ) {
            accountIndicators[i] = ILiquidityMiningV2.AccountIndicatorsResult(
                lpTokens[i],
                _accountIndicators[account][lpTokens[i]]
            );
            unchecked {
                ++i;
            }
        }
        return accountIndicators;
    }
}
