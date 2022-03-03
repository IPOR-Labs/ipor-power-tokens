pragma solidity 0.8.9;

interface StakedAaveInterface {
    function redeem(address to, uint256 amount) external;

    function cooldown() external;

    function stakersCooldowns(address user) external view returns (uint256);

    function COOLDOWN_SECONDS() external view returns (uint256);

    function UNSTAKE_WINDOW() external view returns (uint256);
}