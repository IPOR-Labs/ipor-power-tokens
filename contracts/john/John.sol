// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "../interfaces/IJohn.sol";
import "./JohnInternal.sol";

/// @title Smart contract responsible for distribution IPOR token rewards across accounts contributed in IPOR Protocol
/// by staking ipTokens and / or delegating Power Ipor Tokens to John. IpTokens can be staked directly to John,
/// Power Ipor Tokens account can get stake IPOR Tokens in PowerIpor smart contract.
contract John is JohnInternal, IJohn {
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
        returns (JohnTypes.DelegatedPwIporBalance[] memory balances)
    {
        uint256 ipTokensLength = requestIpTokens.length;
        balances = new JohnTypes.DelegatedPwIporBalance[](ipTokensLength);
        address ipToken;

        for (uint256 i; i != ipTokensLength; ++i) {
            ipToken = requestIpTokens[i];
            require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);
            balances[i] = JohnTypes.DelegatedPwIporBalance(
                ipToken,
                _accountIndicators[account][ipToken].delegatedPwIporBalance
            );
        }
    }

    function calculateAccruedRewards(address ipToken) external view override returns (uint256) {
        JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[ipToken];
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
        JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[ipToken];
        JohnTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[account][
            ipToken
        ];

        (uint256 rewards, ) = _calculateAccountRewards(globalIndicators, accountIndicators);

        return rewards;
    }

    function stake(address ipToken, uint256 ipTokenAmount)
        external
        override
        nonReentrant
        whenNotPaused
    {
        require(ipTokenAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);

        address msgSender = _msgSender();

        IERC20Upgradeable(ipToken).transferFrom(msgSender, address(this), ipTokenAmount);

        JohnTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[msgSender][
            ipToken
        ];
        JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[ipToken];

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
        require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);
        require(ipTokenAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        address msgSender = _msgSender();

        JohnTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[msgSender][
            ipToken
        ];

        require(
            accountIndicators.ipTokenBalance >= ipTokenAmount,
            MiningErrors.ACCOUNT_IP_TOKEN_BALANCE_IS_TOO_LOW
        );

        JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[ipToken];

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
            accountIndicators.ipTokenBalance - ipTokenAmount,
            accountIndicators.delegatedPwIporBalance
        );

        if (rewards > 0) {
            _transferRewardsToPowerIpor(msgSender, rewards);
        }

        IERC20Upgradeable(ipToken).transfer(msgSender, ipTokenAmount);

        emit UnstakeIpTokens(msgSender, ipToken, ipTokenAmount);
    }

    function claim(address ipToken) external override whenNotPaused nonReentrant {
        address msgSender = _msgSender();

        JohnTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[msgSender][
            ipToken
        ];
        JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[ipToken];

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

        _accountIndicators[msgSender][ipToken] = JohnTypes.AccountRewardsIndicators(
            accruedCompMultiplierCumulativePrevBlock.toUint128(),
            accountIndicators.ipTokenBalance,
            accountPowerUp.toUint72(),
            accountIndicators.delegatedPwIporBalance
        );

        _transferRewardsToPowerIpor(msgSender, iporTokenAmount);

        emit Claim(msgSender, ipToken, iporTokenAmount);
    }
}
