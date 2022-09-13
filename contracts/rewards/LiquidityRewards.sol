// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../security/IporOwnableUpgradeable.sol";
import "../libraries/errors/IporErrors.sol";
import "../libraries/errors/MiningErrors.sol";
import "../libraries/math/MiningCalculation.sol";
import "../libraries/Constants.sol";
import "../interfaces/ILiquidityRewards.sol";
import "../interfaces/ILiquidityRewardsInternal.sol";
import "../interfaces/types/LiquidityRewardsTypes.sol";
import "../interfaces/IPwIporToken.sol";
import "../interfaces/IPwIporTokenInternal.sol";
import "../tokens/IporToken.sol";
//TODO: remove at the end
import "hardhat/console.sol";

contract LiquidityRewards is
    Initializable,
    PausableUpgradeable,
    UUPSUpgradeable,
    IporOwnableUpgradeable,
    ILiquidityRewardsInternal,
    ILiquidityRewards
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeCast for uint256;
    using SafeCast for int256;
    address private _pwIpor;
    mapping(address => bool) private _ipTokens;

    //  asset address -> global parameters for asset
    mapping(address => LiquidityRewardsTypes.GlobalRewardsParams) private _globalParameters;
    //  account address => ipToken address => account params
    mapping(address => mapping(address => LiquidityRewardsTypes.AccountRewardsParams)) _accountsParams;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address[] memory ipTokens,
        address pwIpor,
        address iporToken
    ) public initializer {
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        require(pwIpor != address(0), IporErrors.WRONG_ADDRESS);
        require(iporToken != address(0), IporErrors.WRONG_ADDRESS);
        uint256 assetsLength = ipTokens.length;
        _pwIpor = pwIpor;
        IporToken(iporToken).approve(pwIpor, Constants.MAX_VALUE);
        for (uint256 i = 0; i != assetsLength; i++) {
            require(ipTokens[i] != address(0), IporErrors.WRONG_ADDRESS);
            _ipTokens[ipTokens[i]] = true;
            _saveGlobalParams(
                ipTokens[i],
                LiquidityRewardsTypes.GlobalRewardsParams(0, 0, 0, 0, 0, uint32(Constants.D8))
            );
        }
    }

    modifier onlyPwIpor() {
        require(_msgSender() == _getPwIpor(), MiningErrors.CALLER_NOT_PW_IPOR);
        _;
    }

    function getVersion() external pure override returns (uint256) {
        return 1;
    }

    // TODO: userRewards -> accountRewards
    function userRewards(address ipToken) external view override returns (uint256) {
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];
        LiquidityRewardsTypes.AccountRewardsParams memory accountParams = _accountsParams[
            _msgSender()
        ][ipToken];
        return _accountRewards(accountParams, globalParams);
    }

    function accruedRewards(address ipToken) external view override returns (uint256) {
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];
        if (globalParams.aggregatePowerUp == 0) {
            return globalParams.accruedRewards;
        }
        return
            MiningCalculation.calculateAccruedRewards(
                block.number,
                globalParams.blockNumber,
                globalParams.blockRewords,
                globalParams.accruedRewards
            );
    }

    function globalParams(address ipToken)
        external
        view
        override
        returns (LiquidityRewardsTypes.GlobalRewardsParams memory)
    {
        return _globalParameters[ipToken];
    }

    //todo account
    function accountParams(address ipToken)
        external
        view
        override
        returns (LiquidityRewardsTypes.AccountRewardsParams memory)
    {
        return _accountsParams[_msgSender()][ipToken];
    }

    function rewardsPerBlock(address ipToken) external view override returns (uint32) {
        return _globalParameters[ipToken].blockRewords;
    }

    function balanceOfDelegatedPwIpor(address account, address[] memory requestIpTokens)
        external
        view
        override
        returns (LiquidityRewardsTypes.BalanceOfDelegatedPwIpor memory)
    {
        LiquidityRewardsTypes.DelegatedPwIpor[]
            memory balances = new LiquidityRewardsTypes.DelegatedPwIpor[](requestIpTokens.length);
        for (uint256 i = 0; i != requestIpTokens.length; i++) {
            address ipToken = requestIpTokens[i];
            require(_ipTokens[ipToken], MiningErrors.ASSET_NOT_SUPPORTED);
            balances[i] = LiquidityRewardsTypes.DelegatedPwIpor(
                ipToken,
                _accountsParams[account][ipToken].delegatedPwTokenBalance
            );
        }
        return LiquidityRewardsTypes.BalanceOfDelegatedPwIpor(balances);
    }

    function isAssetSupported(address ipToken) external view override returns (bool) {
        return _ipTokens[ipToken];
    }

    function balanceOf(address ipToken) external view override returns (uint256) {
        return _accountsParams[_msgSender()][ipToken].ipTokensBalance;
    }

    function stake(address ipToken, uint256 ipTokenAmount) external override whenNotPaused {
        require(ipTokenAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        require(_ipTokens[ipToken], MiningErrors.ASSET_NOT_SUPPORTED);

        IERC20Upgradeable(ipToken).safeTransferFrom(_msgSender(), address(this), ipTokenAmount);

        LiquidityRewardsTypes.AccountRewardsParams memory accountParams = _accountsParams[
            _msgSender()
        ][ipToken];
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];

        // assumption we start counting from first person who can get rewards
        if (globalParams.blockNumber == 0) {
            globalParams.blockNumber = block.number.toUint32();
        }

        uint256 rewards = _accountRewards(accountParams, globalParams);

        if (rewards > 0) {
            _claim(_msgSender(), ipToken, rewards, accountParams, globalParams);
        }

        _rebalanceParams(
            accountParams,
            globalParams,
            accountParams.ipTokensBalance + ipTokenAmount,
            accountParams.delegatedPwTokenBalance,
            ipToken,
            _msgSender()
        );
        emit StakeIpTokens(block.timestamp, _msgSender(), ipToken, ipTokenAmount);
    }

    function unstake(address ipToken, uint256 ipTokenAmount) external override whenNotPaused {
        require(_ipTokens[ipToken], MiningErrors.ASSET_NOT_SUPPORTED);
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];
        LiquidityRewardsTypes.AccountRewardsParams memory accountParams = _accountsParams[
            _msgSender()
        ][ipToken];

        uint256 rewards = _accountRewards(accountParams, globalParams);

        if (rewards > 0) {
            _claim(_msgSender(), ipToken, rewards, accountParams, globalParams);
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

        emit UnstakeIpTokens(block.timestamp, _msgSender(), ipToken, ipTokenAmount);
    }

    function delegatePwIpor(
        address account,
        address[] memory ipTokens,
        uint256[] memory pwTokenAmounts
    ) external override onlyPwIpor whenNotPaused {
        for (uint256 i = 0; i != ipTokens.length; i++) {
            require(_ipTokens[ipTokens[i]], MiningErrors.ASSET_NOT_SUPPORTED);
            _addPwIporToBalance(account, ipTokens[i], pwTokenAmounts[i]);
        }
    }

    function withdrawFromDelegation(
        address account,
        address ipToken,
        uint256 pwTokenAmount
    ) external onlyPwIpor whenNotPaused {
        require(_ipTokens[ipToken], MiningErrors.ASSET_NOT_SUPPORTED);
        LiquidityRewardsTypes.AccountRewardsParams memory accountParams = _accountsParams[account][
            ipToken
        ];
        require(
            accountParams.delegatedPwTokenBalance >= pwTokenAmount,
            MiningErrors.DELEGATED_BALANCE_TOO_LOW
        );
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];
        uint256 rewards = _accountRewards(accountParams, globalParams);

        if (rewards > 0) {
            IPwIporTokenInternal(_getPwIpor()).receiveRewards(account, rewards);
        }
        _rebalanceParams(
            accountParams,
            globalParams,
            accountParams.ipTokensBalance,
            accountParams.delegatedPwTokenBalance - pwTokenAmount,
            ipToken,
            account
        );

        emit WithdrawFromDelegation(block.timestamp, account, ipToken, pwTokenAmount);
    }

    function claim(address ipToken) external override whenNotPaused {
        LiquidityRewardsTypes.AccountRewardsParams memory accountParams = _accountsParams[
            _msgSender()
        ][ipToken];
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];

        uint256 rewards = _accountRewards(accountParams, globalParams);
        require(rewards > 0, MiningErrors.NO_REWARDS_TO_CLAIM);

        _claim(_msgSender(), ipToken, rewards, accountParams, globalParams);
        _rebalanceParams(
            accountParams,
            globalParams,
            accountParams.ipTokensBalance,
            accountParams.delegatedPwTokenBalance,
            ipToken,
            _msgSender()
        );

        emit Claim(block.timestamp, _msgSender(), ipToken, rewards);
    }

    function setRewardsPerBlock(address ipToken, uint32 rewardsValue) external override onlyOwner {
        require(_ipTokens[ipToken], MiningErrors.ASSET_NOT_SUPPORTED);
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];

        uint256 compositeMultiplierCumulativeBeforeBlock = globalParams
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParams.blockNumber) *
            globalParams.compositeMultiplierInTheBlock;

        uint256 accruedRewards;
        if (globalParams.aggregatePowerUp != 0) {
            accruedRewards = MiningCalculation.calculateAccruedRewards(
                block.number.toUint32(),
                globalParams.blockNumber,
                globalParams.blockRewords,
                globalParams.accruedRewards
            );
        } else {
            accruedRewards = globalParams.accruedRewards;
        }

        uint256 compositeMultiplier = MiningCalculation.compositeMultiplier(
            rewardsValue,
            globalParams.aggregatePowerUp
        );

        _saveGlobalParams(
            ipToken,
            LiquidityRewardsTypes.GlobalRewardsParams(
                globalParams.aggregatePowerUp,
                accruedRewards,
                compositeMultiplier,
                compositeMultiplierCumulativeBeforeBlock,
                block.number.toUint32(),
                rewardsValue
            )
        );
        emit RewardsPerBlockChanged(block.timestamp, _msgSender(), rewardsValue);
    }

    function addAsset(address ipToken) external onlyOwner whenNotPaused {
        require(ipToken != address(0), IporErrors.WRONG_ADDRESS);
        _ipTokens[ipToken] = true;
        _saveGlobalParams(
            ipToken,
            LiquidityRewardsTypes.GlobalRewardsParams(0, 0, 0, 0, 0, uint32(Constants.D8))
        );
        emit AssetAdded(block.timestamp, _msgSender(), ipToken);
    }

    function removeAsset(address ipToken) external override onlyOwner {
        require(ipToken != address(0), IporErrors.WRONG_ADDRESS);
        _ipTokens[ipToken] = false;
        emit AssetRemoved(block.timestamp, _msgSender(), ipToken);
    }

    function pause() external override onlyOwner {
        _pause();
    }

    function unpause() external override onlyOwner {
        _unpause();
    }

    function _claim(
        address account,
        address ipToken,
        uint256 rewards,
        LiquidityRewardsTypes.AccountRewardsParams memory accountParams,
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams
    ) internal {
        IPwIporTokenInternal(_getPwIpor()).receiveRewards(account, rewards);
    }

    function _accountRewards(
        LiquidityRewardsTypes.AccountRewardsParams memory accountParams,
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams
    ) internal view returns (uint256) {
        uint256 compositeMultiplierCumulativeBeforeBlock = globalParams
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParams.blockNumber) *
            globalParams.compositeMultiplierInTheBlock;

        return
            MiningCalculation.calculateAccountRewards(
                accountParams.ipTokensBalance,
                accountParams.powerUp,
                compositeMultiplierCumulativeBeforeBlock,
                accountParams.compositeMultiplierCumulative
            );
    }

    function _rebalanceParams(
        LiquidityRewardsTypes.AccountRewardsParams memory accountParams,
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams,
        uint256 ipTokensBalance,
        uint256 delegatedPwTokens,
        address ipToken,
        address account
    ) internal {
        uint256 accountPowerUp = MiningCalculation.calculateAccountPowerUp(
            delegatedPwTokens,
            ipTokensBalance,
            _verticalShift(),
            _horizontalShift()
        );

        uint256 compositeMultiplierCumulativeBeforeBlock = globalParams
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParams.blockNumber) *
            globalParams.compositeMultiplierInTheBlock;

        _saveAccountParams(
            account,
            ipToken,
            LiquidityRewardsTypes.AccountRewardsParams(
                accountPowerUp,
                compositeMultiplierCumulativeBeforeBlock,
                ipTokensBalance,
                delegatedPwTokens
            )
        );

        uint256 aggregatePowerUp = MiningCalculation.calculateAggregatePowerUp(
            accountPowerUp,
            ipTokensBalance,
            accountParams.powerUp,
            accountParams.ipTokensBalance,
            globalParams.aggregatePowerUp
        );

        uint256 accruedRewards;
        //        check if we should update rewards, it should happened when at least one accounts stake ipTokens
        if (globalParams.aggregatePowerUp == 0) {
            accruedRewards = globalParams.accruedRewards;
        } else {
            accruedRewards = MiningCalculation.calculateAccruedRewards(
                block.number,
                globalParams.blockNumber,
                globalParams.blockRewords,
                globalParams.accruedRewards
            );
        }

        uint256 compositeMultiplier = MiningCalculation.compositeMultiplier(
            globalParams.blockRewords,
            aggregatePowerUp
        );

        _saveGlobalParams(
            ipToken,
            LiquidityRewardsTypes.GlobalRewardsParams(
                aggregatePowerUp,
                accruedRewards,
                compositeMultiplier,
                compositeMultiplierCumulativeBeforeBlock,
                block.number.toUint32(),
                globalParams.blockRewords
            )
        );
    }

    function _addPwIporToBalance(
        address account,
        address ipToken,
        uint256 pwTokenAmount
    ) internal {
        LiquidityRewardsTypes.AccountRewardsParams memory accountParams = _accountsParams[account][
            ipToken
        ];
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];

        if (accountParams.ipTokensBalance == 0) {
            _accountsParams[account][ipToken].delegatedPwTokenBalance =
                accountParams.delegatedPwTokenBalance +
                pwTokenAmount;
            emit AddPwIporToBalance(block.timestamp, account, ipToken, pwTokenAmount);
            return;
        }

        uint256 rewards = _accountRewards(accountParams, globalParams);

        if (rewards > 0) {
            _claim(account, ipToken, rewards, accountParams, globalParams);
        }

        _rebalanceParams(
            accountParams,
            globalParams,
            accountParams.ipTokensBalance,
            accountParams.delegatedPwTokenBalance + pwTokenAmount,
            ipToken,
            account
        );
        emit AddPwIporToBalance(block.timestamp, account, ipToken, pwTokenAmount);
    }

    function _horizontalShift() internal pure returns (uint256) {
        return 1000000000000000000;
    }

    function _verticalShift() internal pure returns (uint256) {
        return 400000000000000000;
    }

    function _getPwIpor() internal view returns (address) {
        return _pwIpor;
    }

    function _saveAccountParams(
        address account,
        address ipToken,
        LiquidityRewardsTypes.AccountRewardsParams memory params
    ) internal virtual {
        _accountsParams[account][ipToken] = params;
    }

    function _saveGlobalParams(
        address ipAsset,
        LiquidityRewardsTypes.GlobalRewardsParams memory params
    ) internal virtual {
        _globalParameters[ipAsset] = params;
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
