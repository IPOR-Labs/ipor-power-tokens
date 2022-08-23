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
    address private _pwIpor;
    mapping(address => bool) private _assets;
    uint256 internal constant _horizontalShift = 1000000000000000000;
    uint256 internal constant _verticalShift = 400000000000000000;

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

    function getVersion() external pure returns (uint256) {
        return 1;
    }

    function userRewards(address asset) external view returns (uint256) {
        console.log("LiquidityRewards->userRewards->block.number: ", block.number);
        return _userRewards(asset, _msgSender());
    }

    function getAccruedRewards(address asset) external view returns (uint256) {
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[asset];
        return
            MiningCalculation.calculateAccruedRewards(
                block.number,
                globalParams.blockNumber,
                globalParams.blockRewords,
                globalParams.accruedRewards
            );
    }

    function getGlobalParams(address asset)
        external
        view
        returns (LiquidityRewardsTypes.GlobalRewardsParams memory)
    {
        return _globalParameters[asset];
    }

    //    global per asset
    function setRewardsPerBlock(address asset, uint32 rewardsValue) external onlyOwner {
        require(_assets[asset], MiningErrors.ASSET_NOT_SUPPORTED);
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[asset];
        console.log(
            "LiquidityRewards->setRewardsPerBlock->globalParamsOld.blockNumber: ",
            globalParams.blockNumber
        );

        uint256 compositeMultiplierCumulativeBeforeBlock = globalParams
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParams.blockNumber) *
            globalParams.compositeMultiplierInTheBlock;

        console.log(
            "LiquidityRewards->setRewardsPerBlock->compositeMultiplierCumulativeBeforeBlock: ",
            compositeMultiplierCumulativeBeforeBlock
        );

        uint256 accruedRewards = MiningCalculation.calculateAccruedRewards(
            uint32(block.number),
            globalParams.blockNumber,
            globalParams.blockRewords,
            globalParams.accruedRewards
        );

        console.log("LiquidityRewards->setRewardsPerBlock->accruedRewards: ", accruedRewards);

        uint256 compositeMultiplier = MiningCalculation.compositeMultiplier(
            rewardsValue,
            globalParams.aggregatePowerUp
        );

        console.log(
            "LiquidityRewards->setRewardsPerBlock->compositeMultiplier: ",
            compositeMultiplier
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
        // TODO: ADD event
    }

    function getMyParams(address asset)
        external
        view
        returns (LiquidityRewardsTypes.UserRewardsParams memory)
    {
        return _usersParams[_msgSender()][asset];
    }

    function getRewardsPerBlock(address asset) external view returns (uint32) {
        return _globalParameters[asset].blockRewords;
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
        console.log(
            "LiquidityRewards->stake->globalParamsOld.blockNumber: ",
            globalParams.blockNumber
        );

        // TODO: assumption we start counting from first person who can get rewards
        if (globalParams.blockNumber == 0) {
            globalParams.blockNumber = uint32(block.number);
        }
        uint256 rewards = _userRewards(asset, _msgSender());

        if (rewards > 0) {
            _claim(_msgSender(), asset, rewards);
        }
        console.log("LiquidityRewards->stake->stakedIpTokens: ", stakedIpTokens);
        _rebalanceParams(userParams, globalParams, stakedIpTokens, 0, asset, _msgSender());
        // TODO: ADD event
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

    function claim(address asset) external whenNotPaused {
        uint256 rewards = _userRewards(asset, _msgSender());
        console.log("LiquidityRewards->claim->rewards: ", rewards);
        require(rewards > 0, MiningErrors.NO_REWARDS_TO_CLAIM);
        _claim(_msgSender(), asset, rewards);
        // TODO: ADD event
    }

    function balanceOfDelegatedPwIpor(address user, address[] memory requestAssets)
        external
        view
        returns (LiquidityRewardsTypes.BalanceOfDelegatedPwIpor memory)
    {
        LiquidityRewardsTypes.DelegatedPwIpor[]
            memory balances = new LiquidityRewardsTypes.DelegatedPwIpor[](requestAssets.length);
        for (uint256 i = 0; i != requestAssets.length; i++) {
            address asset = requestAssets[i];
            require(_assets[asset], MiningErrors.ASSET_NOT_SUPPORTED);
            LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[user][asset];
            balances[i] = LiquidityRewardsTypes.DelegatedPwIpor(
                asset,
                userParams.delegatedPwTokenBalance
            );
        }
        return LiquidityRewardsTypes.BalanceOfDelegatedPwIpor(balances);
    }

    function isAssetSupported(address asset) external view returns (bool) {
        return _assets[asset];
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

    function balanceOf(address asset) external view returns (uint256) {
        return _usersParams[_msgSender()][asset].ipTokensBalance;
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
        uint256 rewards
    ) internal {
        console.log("LiquidityRewards->_claim->block.number: ", block.number);
        IPwIporToken(_getPwIpor()).receiveRewords(user, rewards);

        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[asset];
        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[user][asset];

        _rebalanceParams(userParams, globalParams, 0, 0, asset, user);
    }

    function _userRewards(address asset, address user) internal view returns (uint256) {
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParams = _globalParameters[asset];
        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[user][asset];

        console.log(
            "LiquidityRewards->calculateUserRewards->globalParamsOld.compositeMultiplierInTheBlock: ",
            globalParams.compositeMultiplierInTheBlock
        );
        console.log("LiquidityRewards->calculateUserRewards->block.number: ", block.number);

        uint256 compositeMultiplierCumulativeBeforeBlock = globalParams
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParams.blockNumber) *
            globalParams.compositeMultiplierInTheBlock;

        console.log(
            "LiquidityRewards->calculateUserRewards->compositeMultiplierCumulative: ",
            compositeMultiplierCumulativeBeforeBlock + globalParams.compositeMultiplierInTheBlock
        );

        uint256 accruedRewards = MiningCalculation.calculateAccruedRewards(
            block.number,
            globalParams.blockNumber,
            globalParams.blockRewords,
            globalParams.accruedRewards
        );

        console.log("LiquidityRewards->calculateUserRewards->accruedRewards: ", accruedRewards);

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
        uint256 newStakedIpTokens,
        uint256 newDelegatedPwToken,
        address asset,
        address user
    ) internal {
        uint256 ipTokensBalance = userParams.ipTokensBalance + newStakedIpTokens;
        uint256 delegatedPwTokens = userParams.delegatedPwTokenBalance + newDelegatedPwToken;
        uint256 userPowerUp = MiningCalculation.calculateUserPowerUp(
            delegatedPwTokens,
            ipTokensBalance,
            _verticalShift,
            _horizontalShift
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

        uint256 accruedRewards = MiningCalculation.calculateAccruedRewards(
            block.number,
            globalParams.blockNumber,
            globalParams.blockRewords,
            globalParams.accruedRewards
        );

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

        uint256 rewards = _userRewards(asset, user);

        console.log("LiquidityRewards->_addPwIporToBalance->rewards: ", rewards);

        if (rewards > 0) {
            _claim(user, asset, rewards);
        }
        _rebalanceParams(userParams, globalParams, 0, delegatedPwTokens, asset, user);
        // TODO: ADD event
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
