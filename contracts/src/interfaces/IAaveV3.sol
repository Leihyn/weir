// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal Aave v3 Pool surface used by Weir.
interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    /// @notice Monotonically increasing liquidity index, in RAY (1e27).
    ///         An aToken balance is scaledBalance * index / RAY, exactly as a
    ///         Token-2022 scaled-UI balance is rawBalance * multiplier.
    function getReserveNormalizedIncome(address asset) external view returns (uint256);
    function getReserveAToken(address asset) external view returns (address);
}

interface IAToken {
    function balanceOf(address) external view returns (uint256);
    function scaledBalanceOf(address) external view returns (uint256);
}
