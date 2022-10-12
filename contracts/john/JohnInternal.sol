// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../libraries/errors/IporErrors.sol";
import "../libraries/errors/MiningErrors.sol";
import "../libraries/Constants.sol";
import "../interfaces/types/JohnTypes.sol";
import "../interfaces/IJohn.sol";
import "../interfaces/IJohnInternal.sol";
import "../interfaces/IPowerIpor.sol";
import "../interfaces/IPowerIporInternal.sol";
import "../security/IporOwnableUpgradeable.sol";
import "../libraries/math/MiningCalculation.sol";
import "../tokens/IporToken.sol";

abstract contract JohnInternal is
    Initializable,
    PausableUpgradeable,
    UUPSUpgradeable,
    IporOwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IJohnInternal
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeCast for uint256;
    using SafeCast for int256;

    address internal _powerIpor;
    address internal _pauseManager;

    mapping(address => bool) internal _ipTokens;

    //  ipToken (ipUSDT, ipUSDC, ipDAI, etc) address -> global parameters for ipToken
    mapping(address => JohnTypes.GlobalRewardsIndicators) internal _globalIndicators;
    //  account address => ipToken address => account params
    mapping(address => mapping(address => JohnTypes.AccountRewardsIndicators))
        internal _accountIndicators;

    modifier onlyPowerIpor() {
        require(_msgSender() == _getPowerIpor(), MiningErrors.CALLER_NOT_POWER_IPOR);
        _;
    }

    modifier onlyPauseManager() {
        require(_msgSender() == _pauseManager, MiningErrors.CALLER_NOT_PAUSE_MANAGER);
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address[] memory ipTokens,
        address powerIpor,
        address iporToken
    ) public initializer {
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();

        require(powerIpor != address(0), IporErrors.WRONG_ADDRESS);
        require(iporToken != address(0), IporErrors.WRONG_ADDRESS);

        uint256 ipTokensLength = ipTokens.length;

        _powerIpor = powerIpor;
        _pauseManager = _msgSender();

        IporToken(iporToken).approve(powerIpor, Constants.MAX_VALUE);

        for (uint256 i = 0; i != ipTokensLength; i++) {
            require(ipTokens[i] != address(0), IporErrors.WRONG_ADDRESS);

            _ipTokens[ipTokens[i]] = true;

            _globalIndicators[ipTokens[i]] = JohnTypes.GlobalRewardsIndicators(
                0,
                0,
                0,
                0,
                uint32(Constants.D8),
                0
            );
        }
    }

    function getVersion() external pure override returns (uint256) {
        return 1;
    }

    function getPauseManager() external view override returns (address) {
        return _pauseManager;
    }

    function isIpTokenSupported(address ipToken) external view override returns (bool) {
        return _ipTokens[ipToken];
    }

    function getGlobalIndicators(address ipToken)
        external
        view
        override
        returns (JohnTypes.GlobalRewardsIndicators memory)
    {
        return _globalIndicators[ipToken];
    }

    function getAccountIndicators(address account, address ipToken)
        external
        view
        override
        returns (JohnTypes.AccountRewardsIndicators memory)
    {
        return _accountIndicators[account][ipToken];
    }

    function delegatePwIpor(
        address account,
        address[] memory ipTokens,
        uint256[] memory pwIporAmounts
    ) external override onlyPowerIpor whenNotPaused {
        uint256 rewards;

        for (uint256 i = 0; i != ipTokens.length; i++) {
            require(_ipTokens[ipTokens[i]], MiningErrors.IP_TOKEN_NOT_SUPPORTED);

            JohnTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[
                account
            ][ipTokens[i]];
            JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[
                ipTokens[i]
            ];

            /// @dev when account not stake any IP Token then calculation rewards and rebalancing is redundant
            if (accountIndicators.ipTokenBalance == 0) {
                uint256 newBalance = accountIndicators.delegatedPwIporBalance + pwIporAmounts[i];
                _accountIndicators[account][ipTokens[i]].delegatedPwIporBalance = newBalance
                    .toUint96();
                emit DelegatePwIpor(account, ipTokens[i], pwIporAmounts[i]);
                continue;
            }

            (
                uint256 rewardsIteration,
                uint256 accruedCompMultiplierCumulativePrevBlock
            ) = _calculateAccountRewards(globalIndicators, accountIndicators);

            rewards += rewardsIteration;

            _rebalanceIndicators(
                account,
                ipTokens[i],
                accruedCompMultiplierCumulativePrevBlock,
                globalIndicators,
                accountIndicators,
                accountIndicators.ipTokenBalance,
                accountIndicators.delegatedPwIporBalance + pwIporAmounts[i]
            );
            emit DelegatePwIpor(account, ipTokens[i], pwIporAmounts[i]);
        }

        if (rewards > 0) {
            _transferRewardsToPowerIpor(account, rewards);
        }
    }

    function delegatePwIporAndStakeIpToken(
        address account,
        address[] memory ipTokens,
        uint256[] memory pwIporAmounts,
        uint256[] memory ipTokenAmounts
    ) external override onlyPowerIpor whenNotPaused {
        uint256 rewards;

        for (uint256 i = 0; i != ipTokens.length; i++) {
            require(_ipTokens[ipTokens[i]], MiningErrors.IP_TOKEN_NOT_SUPPORTED);

            JohnTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[
                account
            ][ipTokens[i]];
            JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[
                ipTokens[i]
            ];

            /// @dev Order is important! First Stake, then Delegate.
            /// @dev Stake
            if (ipTokenAmounts[i] > 0) {
                IERC20Upgradeable(ipTokens[i]).safeTransferFrom(
                    account,
                    address(this),
                    ipTokenAmounts[i]
                );
            }

            /// @dev Delegate
            if (accountIndicators.ipTokenBalance == 0 && ipTokenAmounts[i] == 0) {
                uint256 newBalance = accountIndicators.delegatedPwIporBalance + pwIporAmounts[i];
                _accountIndicators[account][ipTokens[i]].delegatedPwIporBalance = newBalance
                    .toUint96();
                emit DelegatePwIpor(account, ipTokens[i], pwIporAmounts[i]);
                continue;
            }

            (
                uint256 rewardsIteration,
                uint256 accruedCompMultiplierCumulativePrevBlock
            ) = _calculateAccountRewards(globalIndicators, accountIndicators);

            rewards += rewardsIteration;

            _rebalanceIndicators(
                account,
                ipTokens[i],
                accruedCompMultiplierCumulativePrevBlock,
                globalIndicators,
                accountIndicators,
                accountIndicators.ipTokenBalance + ipTokenAmounts[i],
                accountIndicators.delegatedPwIporBalance + pwIporAmounts[i]
            );
            emit DelegatePwIporAndStakeIpToken(
                account,
                ipTokens[i],
                pwIporAmounts[i],
                ipTokenAmounts[i]
            );
        }

        if (rewards > 0) {
            _transferRewardsToPowerIpor(account, rewards);
        }
    }

    function undelegatePwIpor(
        address account,
        address[] memory ipTokens,
        uint256[] memory pwIporAmounts
    ) external onlyPowerIpor whenNotPaused {
        uint256 rewards;

        for (uint256 i; i != ipTokens.length; i++) {
            require(_ipTokens[ipTokens[i]], MiningErrors.IP_TOKEN_NOT_SUPPORTED);

            JohnTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[
                account
            ][ipTokens[i]];

            require(
                accountIndicators.delegatedPwIporBalance >= pwIporAmounts[i],
                MiningErrors.ACC_DELEGATED_TO_JOHN_BALANCE_IS_TOO_LOW
            );

            JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[
                ipTokens[i]
            ];

            (
                uint256 rewardsIteration,
                uint256 accruedCompMultiplierCumulativePrevBlock
            ) = _calculateAccountRewards(globalIndicators, accountIndicators);

            rewards += rewardsIteration;

            _rebalanceIndicators(
                account,
                ipTokens[i],
                accruedCompMultiplierCumulativePrevBlock,
                globalIndicators,
                accountIndicators,
                accountIndicators.ipTokenBalance,
                accountIndicators.delegatedPwIporBalance - pwIporAmounts[i]
            );

            emit UndelegatePwIpor(account, ipTokens[i], pwIporAmounts[i]);
        }

        if (rewards > 0) {
            _transferRewardsToPowerIpor(account, rewards);
        }
    }

    function setRewardsPerBlock(address ipToken, uint32 iporTokenAmount)
        external
        override
        onlyOwner
    {
        _setRewardsPerBlock(ipToken, iporTokenAmount);
    }

    function addIpTokenAsset(address ipToken) external onlyOwner {
        require(ipToken != address(0), IporErrors.WRONG_ADDRESS);
        _ipTokens[ipToken] = true;

        emit IpTokenAdded(_msgSender(), ipToken);
    }

    function removeIpTokenAsset(address ipToken) external override onlyOwner {
        require(ipToken != address(0), IporErrors.WRONG_ADDRESS);
        _setRewardsPerBlock(ipToken, 0);
        _ipTokens[ipToken] = false;
        emit IpTokenRemoved(_msgSender(), ipToken);
    }

    function setPauseManager(address newPauseManagerAddr) external override onlyOwner {
        require(newPauseManagerAddr != address(0), IporErrors.WRONG_ADDRESS);
        address oldPauseManagerAddr = _pauseManager;
        _pauseManager = newPauseManagerAddr;
        emit PauseManagerChanged(_msgSender(), oldPauseManagerAddr, newPauseManagerAddr);
    }

    function pause() external override onlyPauseManager {
        _pause();
    }

    function unpause() external override onlyPauseManager {
        _unpause();
    }

    /// @dev Rebalance makes that rewards for account are reset in current block.
    function _rebalanceIndicators(
        address account,
        address ipToken,
        uint256 accruedCompMultiplierCumulativePrevBlock,
        JohnTypes.GlobalRewardsIndicators memory globalIndicators,
        JohnTypes.AccountRewardsIndicators memory accountIndicators,
        uint256 ipTokenBalance,
        uint256 delegatedPwIporBalance
    ) internal {
        uint256 accountPowerUp = MiningCalculation.calculateAccountPowerUp(
            delegatedPwIporBalance,
            ipTokenBalance,
            _verticalShift(),
            _horizontalShift()
        );

        _accountIndicators[account][ipToken] = JohnTypes.AccountRewardsIndicators(
            accruedCompMultiplierCumulativePrevBlock.toUint128(),
            ipTokenBalance.toUint128(),
            accountPowerUp.toUint72(),
            delegatedPwIporBalance.toUint96()
        );

        uint256 aggregatedPowerUp = MiningCalculation.calculateAggregatedPowerUp(
            accountPowerUp,
            ipTokenBalance,
            accountIndicators.powerUp,
            accountIndicators.ipTokenBalance,
            globalIndicators.aggregatedPowerUp
        );

        uint256 accruedRewards;

        /// @dev check if we should update rewards, it should happened when at least one account stakes ipTokens
        if (globalIndicators.aggregatedPowerUp == 0) {
            accruedRewards = globalIndicators.accruedRewards;
        } else {
            accruedRewards = MiningCalculation.calculateAccruedRewards(
                block.number,
                globalIndicators.blockNumber,
                globalIndicators.rewardsPerBlock,
                globalIndicators.accruedRewards
            );
        }

        uint256 compositeMultiplier = MiningCalculation.calculateCompositeMultiplier(
            globalIndicators.rewardsPerBlock,
            aggregatedPowerUp
        );

        _globalIndicators[ipToken] = JohnTypes.GlobalRewardsIndicators(
            aggregatedPowerUp,
            compositeMultiplier.toUint128(),
            accruedCompMultiplierCumulativePrevBlock.toUint128(),
            block.number.toUint32(),
            globalIndicators.rewardsPerBlock,
            accruedRewards.toUint88()
        );
    }

    function _calculateAccountRewards(
        JohnTypes.GlobalRewardsIndicators memory globalIndicators,
        JohnTypes.AccountRewardsIndicators memory accountIndicators
    ) internal view returns (uint256 rewards, uint256 accruedCompMultiplierCumulativePrevBlock) {
        accruedCompMultiplierCumulativePrevBlock = MiningCalculation
            .calculateAccruedCompMultiplierCumulativePrevBlock(
                block.number,
                globalIndicators.blockNumber,
                globalIndicators.compositeMultiplierInTheBlock,
                globalIndicators.compositeMultiplierCumulativePrevBlock
            );

        rewards = MiningCalculation.calculateAccountRewards(
            accountIndicators.ipTokenBalance,
            accountIndicators.powerUp,
            accountIndicators.compositeMultiplierCumulativePrevBlock,
            accruedCompMultiplierCumulativePrevBlock
        );
    }

    function _setRewardsPerBlock(address ipToken, uint32 iporTokenAmount) internal {
        require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);

        JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[ipToken];
        uint256 blockNumber = block.number;

        uint256 accruedCompositeMultiplierCumulativePrevBlock = MiningCalculation
            .calculateAccruedCompMultiplierCumulativePrevBlock(
                blockNumber,
                globalIndicators.blockNumber,
                globalIndicators.compositeMultiplierInTheBlock,
                globalIndicators.compositeMultiplierCumulativePrevBlock
            );

        uint256 accruedRewards;
        if (globalIndicators.aggregatedPowerUp != 0) {
            accruedRewards = MiningCalculation.calculateAccruedRewards(
                blockNumber.toUint32(),
                globalIndicators.blockNumber,
                globalIndicators.rewardsPerBlock,
                globalIndicators.accruedRewards
            );
        } else {
            accruedRewards = globalIndicators.accruedRewards;
        }

        uint256 compositeMultiplier = MiningCalculation.calculateCompositeMultiplier(
            iporTokenAmount,
            globalIndicators.aggregatedPowerUp
        );

        _globalIndicators[ipToken] = JohnTypes.GlobalRewardsIndicators(
            globalIndicators.aggregatedPowerUp,
            compositeMultiplier.toUint128(),
            accruedCompositeMultiplierCumulativePrevBlock.toUint128(),
            blockNumber.toUint32(),
            iporTokenAmount,
            accruedRewards.toUint88()
        );

        emit RewardsPerBlockChanged(
            _msgSender(),
            globalIndicators.rewardsPerBlock,
            iporTokenAmount
        );
    }

    /// @dev Claim not changes Internal Exchange Rate of Power Ipor Tokens in Power Ipor smart contract.
    function _transferRewardsToPowerIpor(address account, uint256 rewards) internal {
        IPowerIporInternal(_getPowerIpor()).receiveRewardsFromJohn(account, rewards);
    }

    function _horizontalShift() internal pure returns (uint256) {
        return 1000000000000000000;
    }

    function _verticalShift() internal pure returns (uint256) {
        return 400000000000000000;
    }

    function _getPowerIpor() internal view returns (address) {
        return _powerIpor;
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
