// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "../interfaces/IJohn.sol";
import "./JohnInternal.sol";
//TODO: remove at the end
import "hardhat/console.sol";

/// @title Smart contract responsible for distribution IPOR token rewards across accounts contributed in IPOR Protocol
/// by staking ipTokens and / or delegating Power Ipor Tokens to John. IpTokens can be staked directly to John,
/// Power Ipor Tokens account can get stake IPOR Tokens in PowerIpor smart contract.
contract John is JohnInternal, IJohn {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeCast for uint256;
    using SafeCast for int256;

    function balanceOf(address ipToken) external view override returns (uint256) {
        return _accountIndicators[_msgSender()][ipToken].ipTokenBalance;
    }

    function balanceOfDelegatedPwIpor(address account, address[] memory requestIpTokens)
        external
        view
        override
        returns (JohnTypes.DelegatedPwIporBalance[] memory balances)
    {
        balances = new JohnTypes.DelegatedPwIporBalance[](requestIpTokens.length);

        for (uint256 i = 0; i != requestIpTokens.length; i++) {
            address ipToken = requestIpTokens[i];
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

    function calculateAccountRewards(address ipToken) external view override returns (uint256) {
        JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[ipToken];
        JohnTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[
            _msgSender()
        ][ipToken];
        return _calculateAccountRewards(accountIndicators, globalIndicators);
    }

    function stake(address ipToken, uint256 ipTokenAmount)
        external
        override
        nonReentrant
        whenNotPaused
    {
        require(ipTokenAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);

        IERC20Upgradeable(ipToken).safeTransferFrom(_msgSender(), address(this), ipTokenAmount);

        JohnTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[
            _msgSender()
        ][ipToken];
        JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[ipToken];

        _claimWhenRewardsExists(_msgSender(), globalIndicators, accountIndicators);
        _rebalanceParams(
            _msgSender(),
            ipToken,
            globalIndicators,
            accountIndicators,
            accountIndicators.ipTokenBalance + ipTokenAmount,
            accountIndicators.delegatedPwIporBalance
        );
        emit StakeIpTokens(_msgSender(), ipToken, ipTokenAmount);
    }

    function unstake(address ipToken, uint256 ipTokenAmount)
        external
        override
        nonReentrant
        whenNotPaused
    {
        require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);
        JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[ipToken];
        JohnTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[
            _msgSender()
        ][ipToken];

        _claimWhenRewardsExists(_msgSender(), globalIndicators, accountIndicators);

        require(
            ipTokenAmount <= accountIndicators.ipTokenBalance,
            MiningErrors.STAKED_BALANCE_TOO_LOW
        );

        _rebalanceParams(
            _msgSender(),
            ipToken,
            globalIndicators,
            accountIndicators,
            accountIndicators.ipTokenBalance - ipTokenAmount,
            accountIndicators.delegatedPwIporBalance
        );

        IERC20Upgradeable(ipToken).transfer(_msgSender(), ipTokenAmount);

        emit UnstakeIpTokens(_msgSender(), ipToken, ipTokenAmount);
    }

    function claim(address ipToken) external override whenNotPaused nonReentrant {
        JohnTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[
            _msgSender()
        ][ipToken];
        JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[ipToken];

        uint256 iporTokenAmount = _calculateAccountRewards(accountIndicators, globalIndicators);
        require(iporTokenAmount > 0, MiningErrors.NO_REWARDS_TO_CLAIM);

        _claim(_msgSender(), iporTokenAmount);

        uint256 accountPowerUp = MiningCalculation.calculateAccountPowerUp(
            accountIndicators.delegatedPwIporBalance,
            accountIndicators.ipTokenBalance,
            _verticalShift(),
            _horizontalShift()
        );

        uint256 compositeMultiplierCumulativePrevBlock = globalIndicators
            .compositeMultiplierCumulativePrevBlock +
            (block.number - globalIndicators.blockNumber) *
            globalIndicators.compositeMultiplierInTheBlock;
        _saveAccountIndicators(
            _msgSender(),
            ipToken,
            JohnTypes.AccountRewardsIndicators(
                compositeMultiplierCumulativePrevBlock.toUint128(),
                accountIndicators.ipTokenBalance,
                accountPowerUp.toUint72(),
                accountIndicators.delegatedPwIporBalance
            )
        );

        emit Claim(_msgSender(), ipToken, iporTokenAmount);
    }
}
