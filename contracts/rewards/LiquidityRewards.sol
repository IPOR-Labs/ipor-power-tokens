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
        }
    }

    modifier onlyPwIpor() {
        require(_msgSender() == _getPwIpor(), MiningErrors.CALLER_NOT_PW_IPOR);
        _;
    }

    function getVersion() external pure returns (uint256) {
        return 1;
    }

    //    global per asset
    function setRewardsPerBlock(address asset, uint32 amount) external onlyOwner {
        require(_assets[asset], MiningErrors.ASSET_NOT_SUPPORTED);
        LiquidityRewardsTypes.GlobalRewardsParams memory params = _globalParameters[asset];
        params.blockRewords = amount;
        params.lastRebalancingBlockNumber = uint32(block.number);
        _globalParameters[asset] = params;
        // TODO: ADD event
    }

    function getRewardsPerBlock(address asset) external view returns (uint32) {
        LiquidityRewardsTypes.GlobalRewardsParams memory params = _globalParameters[asset];
        return params.blockRewords;
    }

    //    all per asset
    function stake(address asset, uint256 amount) external whenNotPaused {
        require(amount != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        require(_assets[asset], MiningErrors.ASSET_NOT_SUPPORTED);
        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[_msgSender()][
            asset
        ];
        uint256 oldUserBalance = userParams.ipTokensBalance;
        IERC20Upgradeable(asset).safeTransferFrom(_msgSender(), address(this), amount);
        userParams.ipTokensBalance = oldUserBalance + amount;
        _usersParams[_msgSender()][asset] = userParams;
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
        LiquidityRewardsTypes.UserRewardsParams memory userParams = _usersParams[_msgSender()][
            asset
        ];
        uint256 oldBalance = userParams.delegatedPowerTokenBalance;
        newBalance = oldBalance + amount;
        userParams.delegatedPowerTokenBalance = newBalance;
        _usersParams[_msgSender()][asset] = userParams;
        // TODO: ADD event
    }

    function isAssetSupported(address asset) external view returns (bool) {
        return _assets[asset];
    }

    function addAsset(address asset) external onlyOwner whenNotPaused {
        require(asset != address(0), IporErrors.WRONG_ADDRESS);
        _assets[asset] = true;
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

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
