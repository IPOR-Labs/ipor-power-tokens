// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./AccessControl.sol";
import "../libraries/errors/Errors.sol";
import "../interfaces/ILiquidityMiningLens.sol";
import "../interfaces/IPowerTokenLens.sol";
import "../interfaces/IStakeService.sol";
import "../interfaces/IFlowsService.sol";

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
        address miningService;
        address powerTokenLens;
    }

    constructor(DeployedContracts memory deployedContracts) {
        LIQUIDITY_MINING_LENS = deployedContracts.liquidityMiningLens;
        STAKE_SERVICE = deployedContracts.stakeService;
        FLOWS_SERVICE = deployedContracts.miningService;
        LIQUIDITY_MINING_ADDRESS = deployedContracts.liquidityMiningAddress;
        POWER_TOKEN_ADDRESS = deployedContracts.powerTokenAddress;
        POWER_TOKEN_LENS = deployedContracts.powerTokenLens;
        _disableInitializers();
    }

    function initialize(uint256 paused) external initializer {
        __UUPSUpgradeable_init();
        _owner = msg.sender;
        _paused = paused;
    }

    function getRouterImplementation(bytes4 sig) public returns (address) {
        if (
            sig == IStakeService.stakeLpTokens.selector ||
            sig == IStakeService.unstakeLpTokens.selector ||
            sig == IStakeService.stakeIporToken.selector ||
            sig == IStakeService.unstakeIporToken.selector ||
            sig == IStakeService.cooldown.selector ||
            sig == IStakeService.cancelCooldown.selector ||
            sig == IStakeService.redeem.selector
        ) {
            whenNotPaused();
            nonReentrant();
            _reentrancyStatus = _ENTERED;
            return STAKE_SERVICE;
        }
        if (
            sig == IFlowsService.delegate.selector ||
            sig == IFlowsService.updateIndicators.selector ||
            sig == IFlowsService.undelegate.selector ||
            sig == IFlowsService.claim.selector
        ) {
            whenNotPaused();
            nonReentrant();
            _reentrancyStatus = _ENTERED;
            return FLOWS_SERVICE;
        }

        if (
            sig == ILiquidityMiningLens.getLiquidityMiningContractId.selector ||
            sig == ILiquidityMiningLens.liquidityMiningBalanceOf.selector ||
            sig == ILiquidityMiningLens.balanceOfDelegatedPwToken.selector ||
            sig == ILiquidityMiningLens.calculateAccruedRewards.selector ||
            sig == ILiquidityMiningLens.getAccountIndicators.selector ||
            sig == ILiquidityMiningLens.getGlobalIndicators.selector ||
            sig == ILiquidityMiningLens.calculateAccountRewards.selector
        ) {
            return LIQUIDITY_MINING_LENS;
        }

        if (
            sig == IPowerTokenLens.powerTokenName.selector ||
            sig == IPowerTokenLens.getPowerTokenContractId.selector ||
            sig == IPowerTokenLens.powerTokenSymbol.selector ||
            sig == IPowerTokenLens.powerTokenDecimals.selector ||
            sig == IPowerTokenLens.powerTokenTotalSupply.selector ||
            sig == IPowerTokenLens.powerTokenBalanceOf.selector ||
            sig == IPowerTokenLens.delegatedToLiquidityMiningBalanceOf.selector ||
            sig == IPowerTokenLens.getActiveCooldown.selector
        ) {
            return POWER_TOKEN_LENS;
        }

        revert(Errors.ROUTER_INVALID_SIGNATURE);
    }

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
        if (_reentrancyStatus == _ENTERED) {
            _reentrancyStatus = _NOT_ENTERED;
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

    function batchExecutor(bytes[] calldata calls) external {
        uint256 length = calls.length;
        for (uint256 i; i != length; ) {
            bytes4 sig = bytes4(calls[i][:4]);
            address implementation = getRouterImplementation(sig);
            implementation.functionDelegateCall(calls[i]);
            if (_reentrancyStatus == _ENTERED) {
                _reentrancyStatus = _NOT_ENTERED;
            }
            unchecked {
                ++i;
            }
        }
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal view override onlyOwner {}
}
