// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import "../interfaces/ILiquidityMining.sol";
import "./LiquidityMiningInternal.sol";

/// @title Smart contract responsible for distribution IPOR token rewards across accounts contributed in IPOR Protocol
/// by staking ipTokens and / or delegating Power Ipor Tokens to LiquidityMining. IpTokens can be staked directly to LiquidityMining,
/// Power Ipor Tokens account can get stake IPOR Tokens in PowerIpor smart contract.
contract LiquidityMining is LiquidityMiningInternal, ILiquidityMining {
    using SafeCast for uint256;
    using SafeCast for int256;

    function getContractId() external pure returns (bytes32) {
        return 0x9b1f3aa590476fc9aa58d44ad1419ab53d34c344bd5ed46b12e4af7d27c38e06;
    }

    function balanceOf(address account, address ipToken) external view override returns (uint256) {
        return _accountIndicators[account][ipToken].ipTokenBalance;
    }

    function balanceOfDelegatedPwIpor(address account, address[] calldata requestIpTokens)
        external
        view
        override
        returns (LiquidityMiningTypes.DelegatedPwIporBalance[] memory balances)
    {
        uint256 ipTokensLength = requestIpTokens.length;
        balances = new LiquidityMiningTypes.DelegatedPwIporBalance[](ipTokensLength);
        address ipToken;

        for (uint256 i; i != ipTokensLength; ++i) {
            ipToken = requestIpTokens[i];
            require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);
            balances[i] = LiquidityMiningTypes.DelegatedPwIporBalance(
                ipToken,
                _accountIndicators[account][ipToken].delegatedPwIporBalance
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

    function calculateAccruedRewards(address ipToken) external view override returns (uint256) {
        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[
            ipToken
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

    function calculateAccountRewards(address account, address ipToken)
        external
        view
        override
        returns (uint256)
    {
        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[
            ipToken
        ];
        LiquidityMiningTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[
            account
        ][ipToken];

        (uint256 rewards, ) = _calculateAccountRewards(globalIndicators, accountIndicators);

        return rewards;
    }

    function stake(address ipToken, uint256 ipTokenAmount)
        external
        override
        nonReentrant
        whenNotPaused
    {
        require(ipTokenAmount > 0, MiningErrors.VALUE_NOT_GREATER_THAN_ZERO);
        require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);

        address msgSender = _msgSender();

        IERC20Upgradeable(ipToken).transferFrom(msgSender, address(this), ipTokenAmount);

        LiquidityMiningTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[
            msgSender
        ][ipToken];
        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[
            ipToken
        ];

        (
            uint256 rewards,
            uint256 accruedCompMultiplierCumulativePrevBlock
        ) = _calculateAccountRewards(globalIndicators, accountIndicators);

        _rebalanceIndicators(
            msgSender,
            ipToken,
            accruedCompMultiplierCumulativePrevBlock,
            globalIndicators,
            accountIndicators,
            accountIndicators.ipTokenBalance + ipTokenAmount,
            accountIndicators.delegatedPwIporBalance
        );

        if (rewards > 0) {
            _transferRewardsToPowerIpor(msgSender, rewards);
        }

        emit StakeIpTokens(msgSender, ipToken, ipTokenAmount);
    }

    function unstake(address ipToken, uint256 ipTokenAmount)
        external
        override
        nonReentrant
        whenNotPaused
    {
        _unstake(ipToken, ipTokenAmount, true);
    }

    function unstakeAndAllocatePwTokens(address ipToken, uint256 ipTokenAmount)
        external
        override
        nonReentrant
        whenNotPaused
    {
        _unstake(ipToken, ipTokenAmount, false);
    }

    function claim(address ipToken) external override whenNotPaused nonReentrant {
        address msgSender = _msgSender();

        LiquidityMiningTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[
            msgSender
        ][ipToken];
        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[
            ipToken
        ];

        (
            uint256 iporTokenAmount,
            uint256 accruedCompMultiplierCumulativePrevBlock
        ) = _calculateAccountRewards(globalIndicators, accountIndicators);

        require(iporTokenAmount > 0, MiningErrors.NO_REWARDS_TO_CLAIM);

        uint256 accountPowerUp = MiningCalculation.calculateAccountPowerUp(
            accountIndicators.delegatedPwIporBalance,
            accountIndicators.ipTokenBalance,
            _getVerticalShift(),
            _getHorizontalShift()
        );

        _accountIndicators[msgSender][ipToken] = LiquidityMiningTypes.AccountRewardsIndicators(
            accruedCompMultiplierCumulativePrevBlock.toUint128(),
            accountIndicators.ipTokenBalance,
            accountPowerUp.toUint72(),
            accountIndicators.delegatedPwIporBalance
        );

        _transferRewardsToPowerIpor(msgSender, iporTokenAmount);

        emit Claim(msgSender, ipToken, iporTokenAmount);
    }

    function claimAllocatedPwTokens() external override whenNotPaused nonReentrant {
        address msgSender = _msgSender();
        uint256 iporTokenAmount = _allocatedPwTokens[msgSender];
        require(iporTokenAmount > 0, MiningErrors.NO_REWARDS_TO_CLAIM);
        _allocatedPwTokens[msgSender] = 0;
        _transferRewardsToPowerIpor(msgSender, iporTokenAmount);
        emit ClaimAllocatedTokens(msgSender, iporTokenAmount);
    }
}
