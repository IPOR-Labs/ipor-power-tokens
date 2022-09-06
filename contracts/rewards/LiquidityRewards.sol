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

    function userRewards(address asset) external view override returns (uint256) {
        console.log("LiquidityRewards->userRewards->block.number: ", block.number);
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[asset];
        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[_msgSender()][
            asset
        ];
        return _userRewards(userParams, globalParams);
    }

    function accruedRewards(address asset) external view override returns (uint256) {
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[asset];
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

    function globalParams(address asset)
        external
        view
        override
        returns (LiquidityRewardsTypes.GlobalRewardsParams memory)
    {
        return _globalParameters[asset];
    }

    function userParams(address asset)
        external
        view
        override
        returns (LiquidityRewardsTypes.UserRewardsParams memory)
    {
        return _usersParams[_msgSender()][asset];
    }

    function rewardsPerBlock(address asset) external view override returns (uint32) {
        return _globalParameters[asset].blockRewords;
    }

    //    TODO
    function balanceOfDelegatedPwIpor(address user, address[] memory requestAssets)
        external
        view
        override
        returns (LiquidityRewardsTypes.BalanceOfDelegatedPwIpor memory)
    {
        LiquidityRewardsTypes.DelegatedPwIpor[]
            memory balances = new LiquidityRewardsTypes.DelegatedPwIpor[](requestAssets.length);
        for (uint256 i = 0; i != requestAssets.length; i++) {
            address asset = requestAssets[i];
            require(_assets[asset], MiningErrors.ASSET_NOT_SUPPORTED);
            balances[i] = LiquidityRewardsTypes.DelegatedPwIpor(
                asset,
                _usersParams[user][asset].delegatedPwTokenBalance
            );
        }
        return LiquidityRewardsTypes.BalanceOfDelegatedPwIpor(balances);
    }

    function isAssetSupported(address asset) external view override returns (bool) {
        return _assets[asset];
    }

    function balanceOf(address asset) external view override returns (uint256) {
        return _usersParams[_msgSender()][asset].ipTokensBalance;
    }

    //    all per asset
    function stake(address asset, uint256 stakedIpTokens) external whenNotPaused {
        require(stakedIpTokens != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        require(_assets[asset], MiningErrors.ASSET_NOT_SUPPORTED);

        IERC20Upgradeable(asset).safeTransferFrom(_msgSender(), address(this), stakedIpTokens);

        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[_msgSender()][
            asset
        ];
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[asset];

        // TODO: assumption we start counting from first person who can get rewards
        if (globalParams.blockNumber == 0) {
            globalParams.blockNumber = uint32(block.number);
        }

        uint256 rewards = _userRewards(userParams, globalParams);

        if (rewards > 0) {
            _claim(_msgSender(), asset, rewards, userParams, globalParams);
        }

        uint256 ipTokensBalance = userParams.ipTokensBalance + stakedIpTokens;

        _rebalanceParams(
            userParams,
            globalParams,
            ipTokensBalance,
            userParams.delegatedPwTokenBalance,
            asset,
            _msgSender()
        );
        // TODO: ADD event
    }

    function unstake(address asset, uint256 unstakeAmount) external whenNotPaused {
        require(_assets[asset], MiningErrors.ASSET_NOT_SUPPORTED);
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[asset];
        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[_msgSender()][
            asset
        ];
        uint256 rewards = _userRewards(userParams, globalParams);

        console.log("LiquidityRewards->_addPwIporToBalance->rewards: ", rewards);

        if (rewards > 0) {
            _claim(_msgSender(), asset, rewards, userParams, globalParams);
        }

        require(unstakeAmount <= userParams.ipTokensBalance, MiningErrors.STAKED_BALANCE_TOO_LOW);
        uint256 ipTokensBalance = (userParams.ipTokensBalance.toInt256() - unstakeAmount.toInt256())
            .toUint256();
        _rebalanceParams(
            userParams,
            globalParams,
            ipTokensBalance,
            userParams.delegatedPwTokenBalance,
            asset,
            _msgSender()
        );
        ERC20(asset).transfer(_msgSender(), unstakeAmount);
    }

    //all per asset
    function delegatePwIpor(
        address user,
        address[] memory assets,
        uint256[] memory amounts
    ) external onlyPwIpor whenNotPaused {
        for (uint256 i = 0; i != assets.length; i++) {
            require(_assets[assets[i]], MiningErrors.ASSET_NOT_SUPPORTED);
            _addPwIporToBalance(user, assets[i], amounts[i]);
        }
        // TODO: ADD event
    }

    function withdrawFromDelegation(
        address user,
        address asset,
        uint256 amount
    ) external onlyPwIpor whenNotPaused {
        require(_assets[asset], MiningErrors.ASSET_NOT_SUPPORTED);
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[asset];
        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[user][asset];
        uint256 rewards = _userRewards(userParams, globalParams);

        require(
            userParams.delegatedPwTokenBalance >= amount,
            MiningErrors.DELEGATED_BALANCE_TOO_LOW
        );
        if (rewards > 0) {
            IPwIporTokenInternal(_getPwIpor()).receiveRewords(user, rewards);
        }
        _rebalanceParams(
            userParams,
            globalParams,
            userParams.ipTokensBalance,
            userParams.delegatedPwTokenBalance - amount,
            asset,
            user
        );
    }

    function claim(address asset) external whenNotPaused {
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[asset];
        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[_msgSender()][
            asset
        ];

        uint256 rewards = _userRewards(userParams, globalParams);
        console.log("LiquidityRewards->claim->rewards: ", rewards);
        require(rewards > 0, MiningErrors.NO_REWARDS_TO_CLAIM);
        _claim(_msgSender(), asset, rewards, userParams, globalParams);
        _rebalanceParams(
            userParams,
            globalParams,
            userParams.ipTokensBalance,
            userParams.delegatedPwTokenBalance,
            asset,
            _msgSender()
        );
        // TODO: ADD event
    }

    function setRewardsPerBlock(address asset, uint32 rewardsValue) external onlyOwner {
        require(_assets[asset], MiningErrors.ASSET_NOT_SUPPORTED);
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[asset];

        uint256 compositeMultiplierCumulativeBeforeBlock = globalParams
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParams.blockNumber) *
            globalParams.compositeMultiplierInTheBlock;

        uint256 accruedRewards = MiningCalculation.calculateAccruedRewards(
            uint32(block.number),
            globalParams.blockNumber,
            globalParams.blockRewords,
            globalParams.accruedRewards
        );

        uint256 compositeMultiplier = MiningCalculation.compositeMultiplier(
            rewardsValue,
            globalParams.aggregatePowerUp
        );

        _saveGlobalParams(
            asset,
            LiquidityRewardsTypes.GlobalRewardsParams(
                globalParams.aggregatePowerUp,
                accruedRewards,
                compositeMultiplier,
                compositeMultiplierCumulativeBeforeBlock,
                uint32(block.number),
                rewardsValue
            )
        );
        emit RewardsPerBlockChanged(block.timestamp, _msgSender(), rewardsValue);
    }

    function addAsset(address asset) external onlyOwner whenNotPaused {
        require(asset != address(0), IporErrors.WRONG_ADDRESS);
        _assets[asset] = true;
        _saveGlobalParams(
            asset,
            LiquidityRewardsTypes.GlobalRewardsParams(0, 0, 0, 0, 0, uint32(Constants.D8))
        );
        // TODO: ADD event
    }

    function removeAsset(address asset) external onlyOwner {
        require(asset != address(0), IporErrors.WRONG_ADDRESS);
        _assets[asset] = false;
        // TODO: ADD event
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _claim(
        address user,
        address asset,
        uint256 rewards,
        LiquidityRewardsTypes.UserRewardsParams memory userParams,
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams
    ) internal {
        console.log("LiquidityRewards->_claim->block.number: ", block.number);
        IPwIporTokenInternal(_getPwIpor()).receiveRewords(user, rewards);
    }

    function _userRewards(
        LiquidityRewardsTypes.UserRewardsParams memory userParams,
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams
    ) internal view returns (uint256) {
        uint256 compositeMultiplierCumulativeBeforeBlock = globalParams
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParams.blockNumber) *
            globalParams.compositeMultiplierInTheBlock;

        uint256 accruedRewards = MiningCalculation.calculateAccruedRewards(
            block.number,
            globalParams.blockNumber,
            globalParams.blockRewords,
            globalParams.accruedRewards
        );

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
        address asset,
        address user
    ) internal {
        uint256 userPowerUp = MiningCalculation.calculateUserPowerUp(
            delegatedPwTokens,
            ipTokensBalance,
            _verticalShift(),
            _horizontalShift()
        );
        console.log("LiquidityRewards->stake->userPowerUp: ", userPowerUp);

        uint256 compositeMultiplierCumulativeBeforeBlock = globalParams
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParams.blockNumber) *
            globalParams.compositeMultiplierInTheBlock;

        console.log(
            "LiquidityRewards->stake->compositeMultiplierCumulativeBeforeBlock: ",
            compositeMultiplierCumulativeBeforeBlock
        );

        _saveUserParams(
            user,
            asset,
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
        console.log("LiquidityRewards->stake->aggregatePowerUp: ", aggregatePowerUp);

        uint256 accruedRewards;
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

        console.log("LiquidityRewards->stake->accruedRewards: ", accruedRewards);

        uint256 compositeMultiplier = MiningCalculation.compositeMultiplier(
            globalParams.blockRewords,
            aggregatePowerUp
        );

        console.log("LiquidityRewards->stake->compositeMultiplier: ", compositeMultiplier);

        _saveGlobalParams(
            asset,
            LiquidityRewardsTypes.GlobalRewardsParams(
                aggregatePowerUp,
                accruedRewards,
                compositeMultiplier,
                compositeMultiplierCumulativeBeforeBlock,
                uint32(block.number),
                globalParams.blockRewords
            )
        );
    }

    function _addPwIporToBalance(
        address user,
        address asset,
        uint256 delegatedPwTokens
    ) internal {
        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[user][asset];
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[asset];
        console.log(
            "LiquidityRewards->_addPwIporToBalance->globalParamsOld.blockNumber: ",
            globalParams.blockNumber
        );

        if (userParams.ipTokensBalance == 0) {
            _usersParams[user][asset].delegatedPwTokenBalance =
                userParams.delegatedPwTokenBalance +
                delegatedPwTokens;
            return;
        }

        // TODO: assumption we start counting from first person who stake pwToken and ipToken rewards
        if (globalParams.blockNumber == 0) {
            globalParams.blockNumber = uint32(block.number);
        }

        uint256 rewards = _userRewards(userParams, globalParams);

        console.log("LiquidityRewards->_addPwIporToBalance->rewards: ", rewards);

        if (rewards > 0) {
            _claim(user, asset, rewards, userParams, globalParams);
        }

        uint256 delegatedPwTokens = userParams.delegatedPwTokenBalance + delegatedPwTokens;

        _rebalanceParams(
            userParams,
            globalParams,
            userParams.ipTokensBalance,
            delegatedPwTokens,
            asset,
            user
        );
        // TODO: ADD event
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
        address user,
        address asset,
        LiquidityRewardsTypes.UserRewardsParams memory params
    ) internal virtual {
        _usersParams[user][asset] = params;
        // TODO: ADD event
    }

    function _saveGlobalParams(
        address asset,
        LiquidityRewardsTypes.GlobalRewardsParams memory params
    ) internal virtual {
        _globalParameters[asset] = params;
        // TODO: ADD event
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
