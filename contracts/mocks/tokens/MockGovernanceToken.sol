// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Staked Token in standard ERC20 mocked.
contract MockGovernanceToken is ERC20 {
    /**
     * @dev Contract id.
     * This is the keccak-256 hash of "io.ipor.IporToken" subtracted by 1
     */
    function getContractId() external pure returns (bytes32) {
        return 0xdba05ed67d0251facfcab8345f27ccd3e72b5a1da8cebfabbcccf4316e6d053c;
    }

    uint8 private immutable _decimals;

    constructor(
        string memory name,
        string memory symbol,
        address daoWalletAddress
    ) ERC20(name, symbol) {
        require(address(0) != daoWalletAddress, "PT_000");
        _decimals = 18;
        _mint(daoWalletAddress, 100_000_000 * 1e18);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
