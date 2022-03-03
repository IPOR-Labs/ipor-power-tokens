pragma solidity 0.8.9;

interface Comptroller {
    function claimComp(address) external;

    function compSpeeds(address _cToken) external view returns (uint256);

    function claimComp(
        address[] calldata holders,
        address[] calldata cTokens,
        bool borrowers,
        bool suppliers
    ) external;
}
