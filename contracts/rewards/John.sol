// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "../interfaces/IJohn.sol";
import "./JohnInternal.sol";
//TODO: remove at the end
import "hardhat/console.sol";

contract John is JohnInternal, IJohn {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeCast for uint256;
    using SafeCast for int256;

    function balanceOf(address ipToken) external view override returns (uint256) {
        return _accountParams[_msgSender()][ipToken].ipTokensBalance;
    }

    function balanceOfDelegatedPwIpor(address account, address[] memory requestIpTokens)
        external
        view
        override
        returns (JohnTypes.BalanceOfDelegatedPwIpor memory)
    {
        JohnTypes.DelegatedPwIpor[] memory balances = new JohnTypes.DelegatedPwIpor[](
            requestIpTokens.length
        );
        for (uint256 i = 0; i != requestIpTokens.length; i++) {
            address ipToken = requestIpTokens[i];
            require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);
            balances[i] = JohnTypes.DelegatedPwIpor(
                ipToken,
                _accountParams[account][ipToken].delegatedPwTokenBalance
            );
        }
        return JohnTypes.BalanceOfDelegatedPwIpor(balances);
    }

    function getRewardsPerBlock(address ipToken) external view override returns (uint32) {
        return _globalParameters[ipToken].blockRewards;
    }

    function calculateAccruedRewards(address ipToken) external view override returns (uint256) {
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];
        if (globalParams.aggregatePowerUp == 0) {
            return globalParams.accruedRewards;
        }
        return
            MiningCalculation.calculateAccruedRewards(
                block.number,
                globalParams.blockNumber,
                globalParams.blockRewards,
                globalParams.accruedRewards
            );
    }

    function calculateAccountRewards(address ipToken) external view override returns (uint256) {
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];
        JohnTypes.AccountRewardsParams memory accountParams = _accountParams[_msgSender()][ipToken];
        return _calculateAccountRewards(accountParams, globalParams);
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

        JohnTypes.AccountRewardsParams memory accountParams = _accountParams[_msgSender()][ipToken];
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];

        // assumption we start counting from first person who can get rewards
        if (globalParams.blockNumber == 0) {
            globalParams.blockNumber = block.number.toUint32();
        }

        uint256 rewards = _calculateAccountRewards(accountParams, globalParams);

        if (rewards > 0) {
            _claim(_msgSender(), rewards);
        }

        _rebalanceParams(
            accountParams,
            globalParams,
            accountParams.ipTokensBalance + ipTokenAmount,
            accountParams.delegatedPwTokenBalance,
            ipToken,
            _msgSender()
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
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];
        JohnTypes.AccountRewardsParams memory accountParams = _accountParams[_msgSender()][ipToken];

        uint256 rewards = _calculateAccountRewards(accountParams, globalParams);

        if (rewards > 0) {
            _claim(_msgSender(), rewards);
        }

        require(
            ipTokenAmount <= accountParams.ipTokensBalance,
            MiningErrors.STAKED_BALANCE_TOO_LOW
        );

        _rebalanceParams(
            accountParams,
            globalParams,
            accountParams.ipTokensBalance - ipTokenAmount,
            accountParams.delegatedPwTokenBalance,
            ipToken,
            _msgSender()
        );

        IERC20Upgradeable(ipToken).transfer(_msgSender(), ipTokenAmount);

        emit UnstakeIpTokens(_msgSender(), ipToken, ipTokenAmount);
    }

    function claim(address ipToken) external override whenNotPaused nonReentrant {
        JohnTypes.AccountRewardsParams memory accountParams = _accountParams[_msgSender()][ipToken];
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];

        uint256 rewards = _calculateAccountRewards(accountParams, globalParams);
        require(rewards > 0, MiningErrors.NO_REWARDS_TO_CLAIM);

        _claim(_msgSender(), rewards);

        uint256 accountPowerUp = MiningCalculation.calculateAccountPowerUp(
            accountParams.delegatedPwTokenBalance,
            accountParams.ipTokensBalance,
            _verticalShift(),
            _horizontalShift()
        );

        uint256 compositeMultiplierCumulativeBeforeBlock = globalParams
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParams.blockNumber) *
            globalParams.compositeMultiplierInTheBlock;

        _saveAccountParams(
            _msgSender(),
            ipToken,
            JohnTypes.AccountRewardsParams(
                accountPowerUp,
                compositeMultiplierCumulativeBeforeBlock,
                accountParams.ipTokensBalance,
                accountParams.delegatedPwTokenBalance
            )
        );

        emit Claim(_msgSender(), ipToken, rewards);
    }
}
