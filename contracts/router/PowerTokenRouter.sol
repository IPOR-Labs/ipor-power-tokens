// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./AccessControl.sol";
import "../libraries/errors/Errors.sol";
import "../interfaces/ILiquidityMiningLens.sol";
import "../interfaces/IPowerTokenLens.sol";
import "../interfaces/IPowerTokenStakeService.sol";
import "../interfaces/IPowerTokenFlowsService.sol";
import "../security/StorageLib.sol";

contract PowerTokenRouter is UUPSUpgradeable, AccessControl {
    address public immutable LIQUIDITY_MINING_ADDRESS;
    address public immutable POWER_TOKEN_ADDRESS;
    address public immutable LIQUIDITY_MINING_LENS;
    address public immutable POWER_TOKEN_LENS;
    address public immutable STAKE_SERVICE;
    address public immutable FLOWS_SERVICE;

    using Address for address;

    struct DeployedContracts {
        address liquidityMiningAddress;
        address powerTokenAddress;
        address liquidityMiningLens;
        address stakeService;
        address flowsService;
        address powerTokenLens;
    }

    constructor(DeployedContracts memory deployedContracts) {
        require(
            deployedContracts.liquidityMiningAddress != address(0),
            string.concat(Errors.WRONG_ADDRESS, " liquidityMiningAddress")
        );
        require(
            deployedContracts.powerTokenAddress != address(0),
            string.concat(Errors.WRONG_ADDRESS, " powerTokenAddress")
        );
        require(
            deployedContracts.liquidityMiningLens != address(0),
            string.concat(Errors.WRONG_ADDRESS, " liquidityMiningLens")
        );
        require(
            deployedContracts.stakeService != address(0),
            string.concat(Errors.WRONG_ADDRESS, " stakeService")
        );
        require(
            deployedContracts.flowsService != address(0),
            string.concat(Errors.WRONG_ADDRESS, " flowsService")
        );
        require(
            deployedContracts.powerTokenLens != address(0),
            string.concat(Errors.WRONG_ADDRESS, " powerTokenLens")
        );
        LIQUIDITY_MINING_LENS = deployedContracts.liquidityMiningLens;
        STAKE_SERVICE = deployedContracts.stakeService;
        FLOWS_SERVICE = deployedContracts.flowsService;
        LIQUIDITY_MINING_ADDRESS = deployedContracts.liquidityMiningAddress;
        POWER_TOKEN_ADDRESS = deployedContracts.powerTokenAddress;
        POWER_TOKEN_LENS = deployedContracts.powerTokenLens;
        _disableInitializers();
    }

    function initialize(uint256 pausedTemp) external initializer {
        __UUPSUpgradeable_init();
        StorageLib.getOwner().value = msg.sender;
        PauseManager.addPauseGuardian(msg.sender);
        StorageLib.getPaused().value = pausedTemp;
    }

    /// @notice Determines the implementation address based on the provided function signature.
    /// @dev This internal function is used by the fallback function to delegate the current call to the appropriate implementation.
    /// @param sig The function signature for which the implementation address needs to be determined.
    /// @return The address of the implementation contract.
    function getRouterImplementation(bytes4 sig) internal returns (address) {
        if (
            sig == IPowerTokenStakeService.stakeLpTokensToLiquidityMining.selector ||
            sig == IPowerTokenStakeService.unstakeLpTokensFromLiquidityMining.selector ||
            sig == IPowerTokenStakeService.stakeGovernanceTokenToPowerToken.selector ||
            sig == IPowerTokenStakeService.unstakeGovernanceTokenFromPowerToken.selector ||
            sig == IPowerTokenStakeService.pwTokenCooldown.selector ||
            sig == IPowerTokenStakeService.pwTokenCancelCooldown.selector ||
            sig == IPowerTokenStakeService.redeemPwToken.selector
        ) {
            _whenNotPaused();
            _enterReentrancy();
            return STAKE_SERVICE;
        }
        if (
            sig == IPowerTokenFlowsService.delegatePwTokensToLiquidityMining.selector ||
            sig == IPowerTokenFlowsService.updateIndicatorsInLiquidityMining.selector ||
            sig == IPowerTokenFlowsService.undelegatePwTokensFromLiquidityMining.selector ||
            sig == IPowerTokenFlowsService.claimRewardsFromLiquidityMining.selector
        ) {
            _whenNotPaused();
            _enterReentrancy();
            return FLOWS_SERVICE;
        }

        if (
            sig == ILiquidityMiningLens.balanceOfLpTokensStakedInLiquidityMining.selector ||
            sig == ILiquidityMiningLens.balanceOfPowerTokensDelegatedToLiquidityMining.selector ||
            sig == ILiquidityMiningLens.getAccruedRewardsInLiquidityMining.selector ||
            sig == ILiquidityMiningLens.getAccountIndicatorsFromLiquidityMining.selector ||
            sig == ILiquidityMiningLens.getGlobalIndicatorsFromLiquidityMining.selector ||
            sig == ILiquidityMiningLens.getAccountRewardsInLiquidityMining.selector
        ) {
            return LIQUIDITY_MINING_LENS;
        }

        if (
            sig == IPowerTokenLens.totalSupplyOfPwToken.selector ||
            sig == IPowerTokenLens.balanceOfPwToken.selector ||
            sig == IPowerTokenLens.balanceOfPwTokenDelegatedToLiquidityMining.selector ||
            sig == IPowerTokenLens.getPwTokensInCooldown.selector ||
            sig == IPowerTokenLens.getPwTokenUnstakeFee.selector ||
            sig == IPowerTokenLens.getPwTokenCooldownTime.selector
        ) {
            return POWER_TOKEN_LENS;
        }

        revert(Errors.ROUTER_INVALID_SIGNATURE);
    }

    /// @notice Fallback function that delegates the current call to the appropriate implementation.
    /// @dev This function is triggered when a function is called on the contract that doesn't match any specific function signature.
    ///      It delegates the call to the implementation contract based on the function signature using the getRouterImplementation() internal function.
    ///      The implementation contract is responsible for executing the actual logic of the function call.
    fallback() external {
        _delegate(getRouterImplementation(msg.sig));
    }

    /// @dev Delegates the current call to `implementation`.
    /// This function does not return to its internal call site, it will return directly to the external caller.
    function _delegate(address implementation) private {
        bytes memory result;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())
        }
        //todo: convert into assembly
        if (uint256(StorageLib.getReentrancyStatus().value) == _ENTERED) {
            _leaveReentrancy();
        }
        assembly {
            switch result
            // delegatecall returns 0 on error.
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    /// @notice Executes a batch of calls to different contracts.
    /// @dev Allows executing multiple function calls in a single transaction to other contracts.
    /// @param calls An array of encoded function calls, where each element represents the encoded data of a single function call.
    function batchExecutor(bytes[] calldata calls) external {
        uint256 length = calls.length;
        for (uint256 i; i != length; ) {
            address implementation = getRouterImplementation(bytes4(calls[i][:4]));
            implementation.functionDelegateCall(calls[i]);
            if (uint256(StorageLib.getReentrancyStatus().value) == _ENTERED) {
                _leaveReentrancy();
            }
            unchecked {
                ++i;
            }
        }
    }

    /// @notice Retrieves the addresses of the deployed contracts.
    /// @dev Returns a `DeployedContracts` struct containing the addresses of the deployed contracts.
    /// @return A `DeployedContracts` struct containing the addresses of the deployed contracts.
    function getConfiguration() external view returns (DeployedContracts memory) {
        return
            DeployedContracts(
                LIQUIDITY_MINING_ADDRESS,
                POWER_TOKEN_ADDRESS,
                LIQUIDITY_MINING_LENS,
                STAKE_SERVICE,
                FLOWS_SERVICE,
                POWER_TOKEN_LENS
            );
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal view override onlyOwner {}
}
