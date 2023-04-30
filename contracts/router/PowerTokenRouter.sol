// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./AccessControl.sol";
import "../libraries/errors/Errors.sol";

import "../interfaces/ILiquidityMiningLens.sol";
import "../interfaces/IStakeService.sol";
import "../interfaces/IMiningService.sol";

contract PowerTokenRouter is UUPSUpgradeable, AccessControl {
    address public immutable LIQUIDITY_MINING_ADDRESS;
    address public immutable POWER_TOKEN_ADDRESS;
    address public immutable LIQUIDITY_MINING_LENS;
    address public immutable STAKE_SERVICE;
    address public immutable MINING_SERVICE;

    struct DeployedContracts {
        address liquidityMiningAddress;
        address powerTokenAddress;
        address liquidityMiningLens;
        address stakeService;
        address miningService;
    }

    constructor(DeployedContracts memory deployedContracts) {
        LIQUIDITY_MINING_LENS = deployedContracts.liquidityMiningLens;
        STAKE_SERVICE = deployedContracts.stakeService;
        MINING_SERVICE = deployedContracts.miningService;
        LIQUIDITY_MINING_ADDRESS = deployedContracts.liquidityMiningAddress;
        POWER_TOKEN_ADDRESS = deployedContracts.powerTokenAddress;
        _disableInitializers();
    }

    function initialize(uint256 paused) external initializer {
        __UUPSUpgradeable_init();
        _owner = msg.sender;
        _paused = paused;
    }

    function getRouterImplementation(bytes4 sig) public returns (address) {
        if (sig == IStakeService.stakeLpTokens.selector) {
            whenNotPaused();
            _reentrancyStatus = _ENTERED;
            return STAKE_SERVICE;
        }
        if (
            sig == ILiquidityMiningLens.getGlobalIndicators.selector ||
            sig == ILiquidityMiningLens.getAccountIndicators.selector
        ) {
            return LIQUIDITY_MINING_LENS;
        }
        revert(Errors.ROUTER_INVALID_SIGNATURE);
    }

    fallback() external {
        _delegate(getRouterImplementation(msg.sig));
    }

    /// @dev Delegates the current call to `implementation`.
    /// This function does not return to its internal call site, it will return directly to the external caller.
    function _delegate(address implementation) private {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }

        if (_reentrancyStatus == _ENTERED) {
            _reentrancyStatus = _NOT_ENTERED;
        }
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override {
        onlyOwner();
    }
}
