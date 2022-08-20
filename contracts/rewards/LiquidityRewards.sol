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
import "../interfaces/ILiquidityRewards.sol";
import "../interfaces/types/LiquidityRewardsTypes.sol";
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
    //    user address => asset address => users params
    mapping(address => mapping(address => LiquidityRewardsTypes.UserRewardsParams)) _usersParams;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address[] memory assets, address pwIpor) public initializer {
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        uint256 assetsLength = assets.length;
        require(pwIpor != address(0), IporErrors.WRONG_ADDRESS);
        _pwIpor = pwIpor;
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

    function calculateUserRewards(address asset) external view returns (uint256) {
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParamsOld = _globalParameters[asset];
        LiquidityRewardsTypes.UserRewardsParams memory userParamsOld = _usersParams[_msgSender()][
            asset
        ];

        console.log(
            "LiquidityRewards->calculateUserRewards->globalParamsOld.compositeMultiplierInTheBlock: ",
            globalParamsOld.compositeMultiplierInTheBlock
        );

        console.log("LiquidityRewards->calculateUserRewards->block.number: ", block.number);

        uint256 compositeMultiplierCumulativeBeforeBlock = globalParamsOld
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParamsOld.blockNumber) *
            globalParamsOld.compositeMultiplierInTheBlock;

        console.log(
            "LiquidityRewards->calculateUserRewards->compositeMultiplierCumulative: ",
            compositeMultiplierCumulativeBeforeBlock + globalParamsOld.compositeMultiplierInTheBlock
        );

        uint256 accruedRewards = MiningCalculation.calculateAccruedRewards(
            block.number,
            globalParamsOld.blockNumber,
            globalParamsOld.blockRewords,
            globalParamsOld.accruedRewards
        );

        console.log("LiquidityRewards->calculateUserRewards->accruedRewards: ", accruedRewards);

        return
            MiningCalculation.calculateUserRewards(
                userParamsOld.ipTokensBalance,
                userParamsOld.powerUp,
                compositeMultiplierCumulativeBeforeBlock,
                userParamsOld.compositeMultiplierCumulative
            );
    }

    //    global per asset
    function setRewardsPerBlock(address asset, uint32 rewardsValue) external onlyOwner {
        require(_assets[asset], MiningErrors.ASSET_NOT_SUPPORTED);
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParamsOld = _globalParameters[asset];

        //       ReBalance GlobalParams
        //        TODO add rebalansing

        _saveGlobalParams(
            asset,
            LiquidityRewardsTypes.GlobalRewardsParams(
                0,
                0,
                0,
                0,
                uint32(block.number),
                rewardsValue
            )
        );
        // TODO: ADD event
    }

    function getGlobalParams(address asset)
        external
        view
        returns (LiquidityRewardsTypes.GlobalRewardsParams memory)
    {
        return _globalParameters[asset];
    }

    function getMyParams(address asset)
        external
        view
        returns (LiquidityRewardsTypes.UserRewardsParams memory)
    {
        return _usersParams[_msgSender()][asset];
    }

    function getRewardsPerBlock(address asset) external view returns (uint32) {
        LiquidityRewardsTypes.GlobalRewardsParams memory params = _globalParameters[asset];
        return params.blockRewords;
    }

    //    all per asset
    function stake(address asset, uint256 stakedIpTokens) external whenNotPaused {
        require(stakedIpTokens != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        require(_assets[asset], MiningErrors.ASSET_NOT_SUPPORTED);
        IERC20Upgradeable(asset).safeTransferFrom(_msgSender(), address(this), stakedIpTokens);
        LiquidityRewardsTypes.UserRewardsParams memory userParamsOld = _usersParams[_msgSender()][
            asset
        ];
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParamsOld = _globalParameters[asset];
        console.log(
            "LiquidityRewards->stake->globalParamsOld.blockNumber: ",
            globalParamsOld.blockNumber
        );
        if (globalParamsOld.blockNumber == 0) {
            globalParamsOld.blockNumber = uint32(block.number);
        }

        uint256 ipTokensBalance = userParamsOld.ipTokensBalance + stakedIpTokens;

        uint256 userPowerUp = MiningCalculation.calculateUserPowerUp(
            userParamsOld.delegatedPowerTokenBalance,
            userParamsOld.ipTokensBalance + stakedIpTokens,
            _verticalShift,
            _horizontalShift
        );
        console.log("LiquidityRewards->stake->userPowerUp: ", userPowerUp);

        uint256 compositeMultiplierCumulativeBeforeBlock = globalParamsOld
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParamsOld.blockNumber) *
            globalParamsOld.compositeMultiplierInTheBlock;

        console.log(
            "LiquidityRewards->stake->compositeMultiplierCumulativeBeforeBlock: ",
            compositeMultiplierCumulativeBeforeBlock
        );

        //        TODO add rebalansing

        _saveUserParams(
            _msgSender(),
            asset,
            LiquidityRewardsTypes.UserRewardsParams(
                userPowerUp,
                compositeMultiplierCumulativeBeforeBlock,
                ipTokensBalance,
                userParamsOld.delegatedPowerTokenBalance
            )
        );

        uint256 aggregatePowerUp = MiningCalculation.calculateAggregatePowerUp(
            userPowerUp,
            ipTokensBalance,
            userParamsOld.delegatedPowerTokenBalance,
            userParamsOld.ipTokensBalance,
            globalParamsOld.aggregatePowerUp
        );
        console.log("LiquidityRewards->stake->aggregatePowerUp: ", aggregatePowerUp);

        uint256 accruedRewards = MiningCalculation.calculateAccruedRewards(
            block.number,
            globalParamsOld.blockNumber,
            globalParamsOld.blockRewords,
            globalParamsOld.accruedRewards
        );

        console.log("LiquidityRewards->stake->accruedRewards: ", accruedRewards);

        uint256 compositeMultiplier = MiningCalculation.compositeMultiplier(
            globalParamsOld.blockRewords,
            aggregatePowerUp
        );

        console.log("LiquidityRewards->stake->compositeMultiplier: ", compositeMultiplier);

        //       ReBalance GlobalParams

        _saveGlobalParams(
            asset,
            LiquidityRewardsTypes.GlobalRewardsParams(
                aggregatePowerUp,
                accruedRewards,
                compositeMultiplier,
                compositeMultiplierCumulativeBeforeBlock,
                uint32(block.number),
                globalParamsOld.blockRewords
            )
        );
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
            LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[_msgSender()][
                asset
            ];
            balances[i] = LiquidityRewardsTypes.DelegatedPwIpor(
                asset,
                userParams.delegatedPowerTokenBalance
            );
        }
        return LiquidityRewardsTypes.BalanceOfDelegatedPwIpor(balances);
    }

    function _addPwIporToBalance(
        address user,
        address asset,
        uint256 amount
    ) internal returns (uint256 newBalance) {
        LiquidityRewardsTypes.UserRewardsParams memory userParamsOld = _usersParams[user][asset];
        LiquidityRewardsTypes.GlobalRewardsParams memory globalParamsOld = _globalParameters[asset];
        //        TODO: claim rewards in IL-685
        newBalance = userParamsOld.delegatedPowerTokenBalance + amount;
        _saveUserParams(
            user,
            asset,
            LiquidityRewardsTypes.UserRewardsParams(
                0,
                0, //userCompositeMultiplier,
                userParamsOld.ipTokensBalance,
                newBalance
            )
        );

        // TODO: ADD event
    }

    function isAssetSupported(address asset) external view returns (bool) {
        return _assets[asset];
    }

    function addAsset(address asset) external onlyOwner whenNotPaused {
        require(asset != address(0), IporErrors.WRONG_ADDRESS);
        _assets[asset] = true;
        _saveGlobalParams(
            asset,
            LiquidityRewardsTypes.GlobalRewardsParams(
                0,
                0,
                0,
                0,
                uint32(block.number),
                uint32(Constants.D8)
            )
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
