// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPool, IAToken} from "../../src/interfaces/IAaveV3.sol";
import {ISwapRouter02} from "../../src/interfaces/IUniswapV3.sol";

contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    /// @dev When true, transfers return false instead of reverting: the token
    ///      behaviour that silently breaks naive integrations.
    bool public returnsFalse;

    constructor(string memory n, string memory s, uint8 d) {
        name = n;
        symbol = s;
        decimals = d;
    }

    function setReturnsFalse(bool v) external {
        returnsFalse = v;
    }

    function mint(address to, uint256 amount) public {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function burn(address from, uint256 amount) public {
        balanceOf[from] -= amount;
        totalSupply -= amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        if (returnsFalse) return false;
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        if (returnsFalse) return false;
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (returnsFalse) return false;
        if (from != msg.sender) allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/// @notice Aave v3 with a liquidity index we can drive directly, plus the same
///         round-half-up scaled burn the real pool performs. That rounding is what
///         produced the principal leak the fork tests caught, so the mock has to
///         reproduce it or the offline suite would be testing a friendlier protocol.
contract MockAavePool is IPool {
    uint256 constant RAY = 1e27;

    mapping(address => uint256) public index; // asset => liquidity index, RAY
    mapping(address => address) public aTokenOf;
    mapping(address => mapping(address => uint256)) public scaled; // asset => user => scaled
    mapping(address => uint256) public totalScaled; // asset => sum of scaled
    address public immutable provider;

    constructor(address _provider) {
        provider = _provider;
    }

    /// @dev Raising the index means interest was earned, so the pool must actually
    ///      hold it. Real Aave does (borrowers pay it in); a mock that skips this is
    ///      silently insolvent and only fails once cumulative withdrawals exceed the
    ///      original deposits.
    function setIndex(address asset, uint256 i) external {
        index[asset] = i;
        uint256 owed = (totalScaled[asset] * i) / RAY;
        uint256 have = MockERC20(asset).balanceOf(address(this));
        if (owed > have) MockERC20(asset).mint(address(this), owed - have + 1);
    }

    function registerAToken(address asset, address aToken) external {
        aTokenOf[asset] = aToken;
    }

    function getReserveNormalizedIncome(address asset) external view returns (uint256) {
        return index[asset];
    }

    function getReserveAToken(address asset) external view returns (address) {
        return aTokenOf[asset];
    }

    function ADDRESSES_PROVIDER() external view returns (address) {
        return provider;
    }

    function supply(address asset, uint256 amount, address onBehalfOf, uint16) external {
        MockERC20(asset).transferFrom(msg.sender, address(this), amount);
        uint256 s = rayDivDown(amount, index[asset]);
        scaled[asset][onBehalfOf] += s;
        totalScaled[asset] += s;
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        // real Aave: scaledAmount = amount.rayDiv(index), which rounds HALF-UP
        uint256 burnScaled = rayDivHalfUp(amount, index[asset]);
        scaled[asset][msg.sender] -= burnScaled;
        totalScaled[asset] -= burnScaled;
        MockERC20(asset).transfer(to, amount);
        return amount;
    }

    function balanceOfUnderlying(address asset, address who) external view returns (uint256) {
        return (scaled[asset][who] * index[asset]) / RAY;
    }

    function rayDivDown(uint256 a, uint256 i) internal pure returns (uint256) {
        return (a * RAY) / i;
    }

    function rayDivHalfUp(uint256 a, uint256 i) internal pure returns (uint256) {
        return (a * RAY + i / 2) / i;
    }
}

/// @notice Reports the pool's underlying balance, like a real aToken.
contract MockAToken is IAToken {
    MockAavePool public immutable pool;
    address public immutable asset;

    constructor(MockAavePool _pool, address _asset) {
        pool = _pool;
        asset = _asset;
    }

    function balanceOf(address who) external view returns (uint256) {
        return pool.balanceOfUnderlying(asset, who);
    }

    function scaledBalanceOf(address who) external view returns (uint256) {
        return pool.scaled(asset, who);
    }
}

contract MockAddressesProvider {
    address public oracle;

    constructor(address _oracle) {
        oracle = _oracle;
    }

    function getPriceOracle() external view returns (address) {
        return oracle;
    }
}

contract MockOracle {
    mapping(address => uint256) public price; // 8dp USD

    function BASE_CURRENCY_UNIT() external pure returns (uint256) {
        return 1e8;
    }

    function setPrice(address asset, uint256 p) external {
        price[asset] = p;
    }

    function getAssetPrice(address asset) external view returns (uint256) {
        return price[asset];
    }
}

/// @notice A router whose execution price we control, so slippage can be simulated.
contract MockRouter is ISwapRouter02 {
    MockOracle public immutable oracle;
    /// @dev basis points of the oracle-implied output actually delivered.
    uint256 public fillBps = 10_000;

    constructor(MockOracle _oracle) {
        oracle = _oracle;
    }

    function setFillBps(uint256 v) external {
        fillBps = v;
    }

    function exactInputSingle(ExactInputSingleParams calldata p) external payable returns (uint256 amountOut) {
        MockERC20(p.tokenIn).transferFrom(msg.sender, address(this), p.amountIn);
        uint256 unitIn = 10 ** MockERC20(p.tokenIn).decimals();
        uint256 unitOut = 10 ** MockERC20(p.tokenOut).decimals();
        uint256 expected =
            (p.amountIn * oracle.getAssetPrice(p.tokenIn) * unitOut) / (oracle.getAssetPrice(p.tokenOut) * unitIn);
        amountOut = (expected * fillBps) / 10_000;
        require(amountOut >= p.amountOutMinimum, "Too little received");
        MockERC20(p.tokenOut).mint(p.recipient, amountOut);
    }
}
