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

// TODO: ipAsset -> ipToken
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
    mapping(address => bool) private _assets;

    //  asset address -> global parameters for asset
    mapping(address => LiquidityRewardsTypes.GlobalRewardsParams) private _globalParameters;
    //  user address => asset address => users params
    mapping(address => mapping(address => LiquidityRewardsTypes.UserRewardsParams)) _usersParams;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address[] memory assets,
        address pwIpor,
        address iporToken
    ) public initializer {
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        require(pwIpor != address(0), IporErrors.WRONG_ADDRESS);
        require(iporToken != address(0), IporErrors.WRONG_ADDRESS);
        uint256 assetsLength = assets.length;
        _pwIpor = pwIpor;
        IporToken(iporToken).approve(pwIpor, Constants.MAX_VALUE);
        for (uint256 i = 0; i != assetsLength; i++) {
            require(assets[i] != address(0), IporErrors.WRONG_ADDRESS);
            _assets[assets[i]] = true;
            _saveGlobalParams(
                assets[i],
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
    function userRewards(address ipAsset) external view override returns (uint256) {
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipAsset];
        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[_msgSender()][
            ipAsset
        ];
        return _userRewards(userParams, globalParams);
    }

    function accruedRewards(address ipAsset) external view override returns (uint256) {
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipAsset];
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

    function globalParams(address ipAsset)
        external
        view
        override
        returns (LiquidityRewardsTypes.GlobalRewardsParams memory)
    {
        return _globalParameters[ipAsset];
    }

    //todo account
    function userParams(address ipAsset)
        external
        view
        override
        returns (LiquidityRewardsTypes.UserRewardsParams memory)
    {
        return _usersParams[_msgSender()][ipAsset];
    }

    function rewardsPerBlock(address ipAsset) external view override returns (uint32) {
        return _globalParameters[ipAsset].blockRewords;
    }

    function balanceOfDelegatedPwIpor(address account, address[] memory requestIpAssets)
        external
        view
        override
        returns (LiquidityRewardsTypes.BalanceOfDelegatedPwIpor memory)
    {
        LiquidityRewardsTypes.DelegatedPwIpor[]
            memory balances = new LiquidityRewardsTypes.DelegatedPwIpor[](requestIpAssets.length);
        for (uint256 i = 0; i != requestIpAssets.length; i++) {
            address asset = requestIpAssets[i];
            require(_assets[asset], MiningErrors.ASSET_NOT_SUPPORTED);
            balances[i] = LiquidityRewardsTypes.DelegatedPwIpor(
                asset,
                _usersParams[account][asset].delegatedPwTokenBalance
            );
        }
        return LiquidityRewardsTypes.BalanceOfDelegatedPwIpor(balances);
    }

    function isAssetSupported(address ipAsset) external view override returns (bool) {
        return _assets[ipAsset];
    }

    function balanceOf(address ipAsset) external view override returns (uint256) {
        return _usersParams[_msgSender()][ipAsset].ipTokensBalance;
    }

    function stake(address ipAsset, uint256 ipTokenAmount) external override whenNotPaused {
        require(ipTokenAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        require(_assets[ipAsset], MiningErrors.ASSET_NOT_SUPPORTED);

        IERC20Upgradeable(ipAsset).safeTransferFrom(_msgSender(), address(this), ipTokenAmount);

        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[_msgSender()][
            ipAsset
        ];
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipAsset];

        // assumption we start counting from first person who can get rewards
        if (globalParams.blockNumber == 0) {
            globalParams.blockNumber = block.number.toUint32();
        }

        uint256 rewards = _userRewards(userParams, globalParams);

        if (rewards > 0) {
            _claim(_msgSender(), ipAsset, rewards, userParams, globalParams);
        }

        _rebalanceParams(
            userParams,
            globalParams,
            userParams.ipTokensBalance + ipTokenAmount,
            userParams.delegatedPwTokenBalance,
            ipAsset,
            _msgSender()
        );
        emit StakeIpTokens(block.timestamp, _msgSender(), ipAsset, ipTokenAmount);
    }

    function unstake(address ipAsset, uint256 ipTokenAmount) external override whenNotPaused {
        require(_assets[ipAsset], MiningErrors.ASSET_NOT_SUPPORTED);
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipAsset];
        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[_msgSender()][
            ipAsset
        ];

        uint256 rewards = _userRewards(userParams, globalParams);

        if (rewards > 0) {
            _claim(_msgSender(), ipAsset, rewards, userParams, globalParams);
        }

        require(ipTokenAmount <= userParams.ipTokensBalance, MiningErrors.STAKED_BALANCE_TOO_LOW);

        _rebalanceParams(
            userParams,
            globalParams,
            userParams.ipTokensBalance - ipTokenAmount,
            userParams.delegatedPwTokenBalance,
            ipAsset,
            _msgSender()
        );

        IERC20Upgradeable(ipAsset).transfer(_msgSender(), ipTokenAmount);

        emit UnstakeIpTokens(block.timestamp, _msgSender(), ipAsset, ipTokenAmount);
    }

    function delegatePwIpor(
        address account,
        address[] memory ipAssets,
        uint256[] memory pwTokenAmounts
    ) external override onlyPwIpor whenNotPaused {
        for (uint256 i = 0; i != ipAssets.length; i++) {
            require(_assets[ipAssets[i]], MiningErrors.ASSET_NOT_SUPPORTED);
            _addPwIporToBalance(account, ipAssets[i], pwTokenAmounts[i]);
        }
    }

    function withdrawFromDelegation(
        address account,
        address ipAsset,
        uint256 pwTokenAmount
    ) external onlyPwIpor whenNotPaused {
        require(_assets[ipAsset], MiningErrors.ASSET_NOT_SUPPORTED);
        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[account][ipAsset];
        require(
            userParams.delegatedPwTokenBalance >= pwTokenAmount,
            MiningErrors.DELEGATED_BALANCE_TOO_LOW
        );
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipAsset];
        uint256 rewards = _userRewards(userParams, globalParams);

        if (rewards > 0) {
            IPwIporTokenInternal(_getPwIpor()).receiveRewards(account, rewards);
        }
        _rebalanceParams(
            userParams,
            globalParams,
            userParams.ipTokensBalance,
            userParams.delegatedPwTokenBalance - pwTokenAmount,
            ipAsset,
            account
        );

        emit WithdrawFromDelegation(block.timestamp, account, ipAsset, pwTokenAmount);
    }

    function claim(address ipAsset) external override whenNotPaused {
        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[_msgSender()][
            ipAsset
        ];
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipAsset];

        uint256 rewards = _userRewards(userParams, globalParams);
        require(rewards > 0, MiningErrors.NO_REWARDS_TO_CLAIM);

        _claim(_msgSender(), ipAsset, rewards, userParams, globalParams);
        _rebalanceParams(
            userParams,
            globalParams,
            userParams.ipTokensBalance,
            userParams.delegatedPwTokenBalance,
            ipAsset,
            _msgSender()
        );

        emit Claim(block.timestamp, _msgSender(), ipAsset, rewards);
    }

    function setRewardsPerBlock(address ipAsset, uint32 rewardsValue) external override onlyOwner {
        require(_assets[ipAsset], MiningErrors.ASSET_NOT_SUPPORTED);
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipAsset];

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
            ipAsset,
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

    function addAsset(address ipAsset) external onlyOwner whenNotPaused {
        require(ipAsset != address(0), IporErrors.WRONG_ADDRESS);
        _assets[ipAsset] = true;
        _saveGlobalParams(
            ipAsset,
            LiquidityRewardsTypes.GlobalRewardsParams(0, 0, 0, 0, 0, uint32(Constants.D8))
        );
        emit AssetAdded(block.timestamp, _msgSender(), ipAsset);
    }

    function removeAsset(address ipAsset) external override onlyOwner {
        require(ipAsset != address(0), IporErrors.WRONG_ADDRESS);
        _assets[ipAsset] = false;
        emit AssetRemoved(block.timestamp, _msgSender(), ipAsset);
    }

    function pause() external override onlyOwner {
        _pause();
    }

    function unpause() external override onlyOwner {
        _unpause();
    }

    function _claim(
        address account,
        address ipAsset,
        uint256 rewards,
        LiquidityRewardsTypes.UserRewardsParams memory userParams,
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams
    ) internal {
        IPwIporTokenInternal(_getPwIpor()).receiveRewards(account, rewards);
    }

    function _userRewards(
        LiquidityRewardsTypes.UserRewardsParams memory userParams,
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams
    ) internal view returns (uint256) {
        uint256 compositeMultiplierCumulativeBeforeBlock = globalParams
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParams.blockNumber) *
            globalParams.compositeMultiplierInTheBlock;

        return
            MiningCalculation.calculateUserRewards(
                userParams.ipTokensBalance,
                userParams.powerUp,
                compositeMultiplierCumulativeBeforeBlock,
                userParams.compositeMultiplierCumulative
            );
    }

    function _rebalanceParams(
        LiquidityRewardsTypes.UserRewardsParams memory userParams,
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams,
        uint256 ipTokensBalance,
        uint256 delegatedPwTokens,
        address ipAsset,
        address account
    ) internal {
        uint256 userPowerUp = MiningCalculation.calculateUserPowerUp(
            delegatedPwTokens,
            ipTokensBalance,
            _verticalShift(),
            _horizontalShift()
        );

        uint256 compositeMultiplierCumulativeBeforeBlock = globalParams
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParams.blockNumber) *
            globalParams.compositeMultiplierInTheBlock;

        _saveUserParams(
            account,
            ipAsset,
            LiquidityRewardsTypes.UserRewardsParams(
                userPowerUp,
                compositeMultiplierCumulativeBeforeBlock,
                ipTokensBalance,
                delegatedPwTokens
            )
        );

        uint256 aggregatePowerUp = MiningCalculation.calculateAggregatePowerUp(
            userPowerUp,
            ipTokensBalance,
            userParams.powerUp,
            userParams.ipTokensBalance,
            globalParams.aggregatePowerUp
        );

        uint256 accruedRewards;
        //        check if we should update rewards, it should happened when at least one users stake ipTokens
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
            ipAsset,
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
        address ipAsset,
        uint256 pwTokenAmount
    ) internal {
        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[account][ipAsset];
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipAsset];

        if (userParams.ipTokensBalance == 0) {
            _usersParams[account][ipAsset].delegatedPwTokenBalance =
                userParams.delegatedPwTokenBalance +
                pwTokenAmount;
            emit AddPwIporToBalance(block.timestamp, account, ipAsset, pwTokenAmount);
            return;
        }

        uint256 rewards = _userRewards(userParams, globalParams);

        if (rewards > 0) {
            _claim(account, ipAsset, rewards, userParams, globalParams);
        }

        _rebalanceParams(
            userParams,
            globalParams,
            userParams.ipTokensBalance,
            userParams.delegatedPwTokenBalance + pwTokenAmount,
            ipAsset,
            account
        );
        emit AddPwIporToBalance(block.timestamp, account, ipAsset, pwTokenAmount);
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

    function _saveUserParams(
        address account,
        address ipAsset,
        LiquidityRewardsTypes.UserRewardsParams memory params
    ) internal virtual {
        _usersParams[account][ipAsset] = params;
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
