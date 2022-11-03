// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title IPOR Token in standard ERC20.
contract IporToken is ERC20 {
    /**
     * @dev Contract id.
     * This is the keccak-256 hash of "io.ipor.ipor.token" subtracted by 1
     */
    function getContractId() external pure returns (bytes32) {
        return 0x1381a7188760c470320204bcfd7e56fb198c5c4148f74567e6369a65320a6d7c;
    }

    uint8 private immutable _decimals;

    constructor(
        string memory name,
        string memory symbol,
        address daoWalletAddress
    ) ERC20(name, symbol) {
        _decimals = 18;
        _mint(daoWalletAddress, 100_000_000 * 1e18);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
