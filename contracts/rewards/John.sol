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
        return _accountParams[_msgSender()][ipToken].ipTokenBalance;
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
                _accountParams[account][ipToken].delegatedPwIporBalance
            );
        }
        return JohnTypes.BalanceOfDelegatedPwIpor(balances);
    }

    function getRewardsPerBlock(address ipToken) external view override returns (uint32) {
        return _globalParams[ipToken].blockRewards;
    }

    function calculateAccruedRewards(address ipToken) external view override returns (uint256) {
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParams[ipToken];
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
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParams[ipToken];
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
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParams[ipToken];

        // assumption we start counting from first person who can get rewards
        //        TODO remove
        if (globalParams.blockNumber == 0) {
            globalParams.blockNumber = block.number.toUint32();
        }

        _claimWhenRewardsExists(_msgSender(), globalParams, accountParams);
        _rebalanceParams(
            _msgSender(),
            ipToken,
            globalParams,
            accountParams,
            accountParams.ipTokenBalance + ipTokenAmount,
            accountParams.delegatedPwIporBalance
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
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParams[ipToken];
        JohnTypes.AccountRewardsParams memory accountParams = _accountParams[_msgSender()][ipToken];

        _claimWhenRewardsExists(_msgSender(), globalParams, accountParams);

        require(ipTokenAmount <= accountParams.ipTokenBalance, MiningErrors.STAKED_BALANCE_TOO_LOW);

        _rebalanceParams(
            _msgSender(),
            ipToken,
            globalParams,
            accountParams,
            accountParams.ipTokenBalance - ipTokenAmount,
            accountParams.delegatedPwIporBalance
        );

        IERC20Upgradeable(ipToken).transfer(_msgSender(), ipTokenAmount);

        emit UnstakeIpTokens(_msgSender(), ipToken, ipTokenAmount);
    }

    function claim(address ipToken) external override whenNotPaused nonReentrant {
        JohnTypes.AccountRewardsParams memory accountParams = _accountParams[_msgSender()][ipToken];
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParams[ipToken];

        uint256 rewards = _calculateAccountRewards(accountParams, globalParams);
        require(rewards > 0, MiningErrors.NO_REWARDS_TO_CLAIM);

        _claim(_msgSender(), rewards);

        uint256 accountPowerUp = MiningCalculation.calculateAccountPowerUp(
            accountParams.delegatedPwIporBalance,
            accountParams.ipTokenBalance,
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
                compositeMultiplierCumulativeBeforeBlock.toUint128(),
                accountParams.ipTokenBalance,
                accountPowerUp.toUint72(),
                accountParams.delegatedPwIporBalance
            )
        );

        emit Claim(_msgSender(), ipToken, rewards);
    }
}
