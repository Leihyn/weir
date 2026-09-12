// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPool, IAToken, IPoolAddressesProvider, IAaveOracle} from "./interfaces/IAaveV3.sol";
import {ISwapRouter02} from "./interfaces/IUniswapV3.sol";
import {IERC20} from "./interfaces/IERC20.sol";

/// @title  Weir
/// @notice An endowment for autonomous agents. An owner commits principal once;
///         the agent may spend only the yield and can never touch the principal,
///         because the released amount is derived from Aave's liquidity index
///         rather than chosen by whoever calls harvest.
///
///         For an endowment of P asset units opened at index I0, the amount
///         releasable at index I1 is
///
///             accrued = P * (I1 - I0) / I0
///
///         which is the same quantity as redeeming d = S * (1 - I0/I1) of the
///         scaled balance S. Principal is exactly preserved in asset terms:
///         after withdrawing `accrued`, the remaining aToken balance is P again.
contract Weir {
    uint256 private constant RAY = 1e27;

    struct Endowment {
        address owner;
        address agent;
        address asset;
        uint256 principal; // asset units, invariant across harvests
        uint256 lastIndex; // Aave liquidity index at last settlement, RAY
        uint256 minPayout; // accrual floor in asset units, prevents dust harvests
        uint256 totalPaid;
        uint256 withheld; // rounding reserve accumulated across harvests
        uint64 minInterval; // seconds enforced between harvests
        uint64 lastHarvest;
        bool active;
    }

    IPool public immutable pool;
    /// @notice Where non-matching endowment yield is swapped to, so an agent is
    ///         always paid in one spendable asset regardless of how it was endowed.
    address public immutable payoutToken;
    ISwapRouter02 public immutable router;

    /// @notice Ceiling on how far below the oracle-implied output a swap may land.
    ///         This is what lets `harvestAndSwap` stay permissionless: a caller
    ///         cannot pass a rotten `amountOutMinimum` and sandwich the agent.
    uint256 public constant MAX_SLIPPAGE_BPS = 100; // 1%

    uint256 public nextId = 1;
    mapping(uint256 => Endowment) public endowments;
    mapping(address => uint256[]) public endowmentsOfOwner;
    mapping(address => uint256[]) public endowmentsOfAgent;
    /// @notice Sum of live principal per asset. Solvency check: never exceeds the aToken balance.
    mapping(address => uint256) public committedPrincipal;

    uint256 private _lock;

    event EndowmentOpened(
        uint256 indexed id,
        address indexed owner,
        address indexed agent,
        address asset,
        uint256 principal,
        uint256 index,
        uint256 minPayout,
        uint64 minInterval
    );
    event Harvested(
        uint256 indexed id,
        address indexed agent,
        address asset,
        uint256 amount,
        uint256 fromIndex,
        uint256 toIndex,
        uint256 totalPaid
    );
    event ToppedUp(uint256 indexed id, uint256 added, uint256 newPrincipal);
    event AgentChanged(uint256 indexed id, address indexed oldAgent, address indexed newAgent);
    event RuleChanged(uint256 indexed id, uint256 minPayout, uint64 minInterval);
    event EndowmentClosed(uint256 indexed id, address indexed owner, uint256 principalReturned);
    event HarvestedAndSwapped(
        uint256 indexed id,
        address indexed agent,
        address assetIn,
        uint256 amountIn,
        address assetOut,
        uint256 amountOut,
        uint256 oracleFloor,
        uint256 fromIndex,
        uint256 toIndex
    );

    error NotOwner();
    error Inactive();
    error ZeroAmount();
    error ZeroAddress();
    error NothingAccrued();
    error BelowFloor(uint256 accruedAmount, uint256 floor);
    error TooSoon(uint64 nextAllowed);
    error WithdrawShortfall(uint256 requested, uint256 received);
    error Reentrancy();
    error TokenCallFailed(address token);
    error NoSwapNeeded();
    error OraclePriceUnavailable();

    modifier nonReentrant() {
        if (_lock == 1) revert Reentrancy();
        _lock = 1;
        _;
        _lock = 0;
    }

    modifier onlyOwnerOf(uint256 id) {
        if (endowments[id].owner != msg.sender) revert NotOwner();
        if (!endowments[id].active) revert Inactive();
        _;
    }

    constructor(IPool _pool, ISwapRouter02 _router, address _payoutToken) {
        if (address(_pool) == address(0) || address(_router) == address(0) || _payoutToken == address(0)) {
            revert ZeroAddress();
        }
        pool = _pool;
        router = _router;
        payoutToken = _payoutToken;
    }

    // ---------------------------------------------------------------- views

    /// @notice Amount of `asset` the agent may currently be paid.
    /// @dev    Rounds down, then withholds a small reserve. Aave burns
    ///         `amount.rayDiv(index)` with round-half-up, so withdrawing the exact
    ///         accrual can burn one extra scaled unit and leave the remaining
    ///         balance just under principal. Withholding `index/RAY + 1` asset
    ///         units per harvest keeps principal whole and keeps
    ///         `committedPrincipal <= aTokens held` true forever. The reserve is
    ///         tracked in `withheld` and paid to the agent on close, so it is never
    ///         stranded and never silently taken from principal.
    function accrued(uint256 id) public view returns (uint256) {
        Endowment storage e = endowments[id];
        if (!e.active) return 0;
        (uint256 amount,) = _releasable(e, pool.getReserveNormalizedIncome(e.asset));
        return amount;
    }

    function _releasable(Endowment storage e, uint256 i1) private view returns (uint256 amount, uint256 reserve) {
        uint256 i0 = e.lastIndex;
        if (i1 <= i0) return (0, 0);
        uint256 gross = (e.principal * (i1 - i0)) / i0;
        reserve = (i1 / RAY) + 1;
        amount = gross > reserve ? gross - reserve : 0;
    }

    /// @notice True when a harvest would succeed right now.
    function harvestable(uint256 id) external view returns (bool) {
        Endowment storage e = endowments[id];
        if (!e.active) return false;
        uint256 a = accrued(id);
        if (a == 0 || a < e.minPayout) return false;
        return block.timestamp >= uint256(e.lastHarvest) + e.minInterval;
    }

    function idsOfOwner(address owner) external view returns (uint256[] memory) {
        return endowmentsOfOwner[owner];
    }

    function idsOfAgent(address agent) external view returns (uint256[] memory) {
        return endowmentsOfAgent[agent];
    }

    /// @notice Principal committed vs aTokens actually held. `held >= committed` must always hold.
    function solvency(address asset) external view returns (uint256 committed, uint256 held) {
        committed = committedPrincipal[asset];
        held = IAToken(pool.getReserveAToken(asset)).balanceOf(address(this));
    }

    // ------------------------------------------------------------ lifecycle

    /// @notice Commit `amount` of `asset` as a perpetual endowment for `agent`.
    function open(address asset, uint256 amount, address agent, uint256 minPayout, uint64 minInterval)
        external
        nonReentrant
        returns (uint256 id)
    {
        if (amount == 0) revert ZeroAmount();
        if (agent == address(0) || asset == address(0)) revert ZeroAddress();

        _pull(asset, msg.sender, amount);
        _supply(asset, amount);

        id = nextId++;
        uint256 index = pool.getReserveNormalizedIncome(asset);
        endowments[id] = Endowment({
            owner: msg.sender,
            agent: agent,
            asset: asset,
            principal: amount,
            lastIndex: index,
            minPayout: minPayout,
            totalPaid: 0,
            withheld: 0,
            minInterval: minInterval,
            lastHarvest: uint64(block.timestamp),
            active: true
        });
        endowmentsOfOwner[msg.sender].push(id);
        endowmentsOfAgent[agent].push(id);
        committedPrincipal[asset] += amount;

        emit EndowmentOpened(id, msg.sender, agent, asset, amount, index, minPayout, minInterval);
    }

    /// @notice Pay the accrued yield to the agent. Permissionless by design: the
    ///         amount and the destination both come from storage, so a caller has
    ///         no parameter to abuse and cannot redirect or oversize the payment.
    function harvest(uint256 id) external nonReentrant returns (uint256 amount) {
        Endowment storage e = endowments[id];
        if (!e.active) revert Inactive();

        uint64 nextAllowed = e.lastHarvest + e.minInterval;
        if (block.timestamp < nextAllowed) revert TooSoon(nextAllowed);

        uint256 i0 = e.lastIndex;
        uint256 i1 = pool.getReserveNormalizedIncome(e.asset);
        if (i1 <= i0) revert NothingAccrued();

        (uint256 releasable, uint256 reserve) = _releasable(e, i1);
        amount = releasable;
        if (amount == 0) revert NothingAccrued();
        if (amount < e.minPayout) revert BelowFloor(amount, e.minPayout);
        e.withheld += reserve;

        // Settle before paying out. `lastIndex` advances to i1, so the accrual
        // window closes exactly at the amount we are about to release.
        e.lastIndex = i1;
        e.lastHarvest = uint64(block.timestamp);
        e.totalPaid += amount;

        uint256 got = pool.withdraw(e.asset, amount, address(this));
        if (got < amount) revert WithdrawShortfall(amount, got);
        _push(e.asset, e.agent, amount);

        emit Harvested(id, e.agent, e.asset, amount, i0, i1, e.totalPaid);
    }

    /// @notice Release the accrued yield of a non-payout-token endowment, convert it
    ///         on Uniswap and send the proceeds to the agent. Still permissionless:
    ///         the amount comes from the index, the recipient comes from storage, and
    ///         the minimum output is floored by Aave's oracle, so a caller can raise
    ///         the slippage guard but never lower it.
    function harvestAndSwap(uint256 id, uint24 fee, uint256 minOut) external nonReentrant returns (uint256 amountOut) {
        Endowment storage e = endowments[id];
        if (!e.active) revert Inactive();
        if (e.asset == payoutToken) revert NoSwapNeeded();

        uint64 nextAllowed = e.lastHarvest + e.minInterval;
        if (block.timestamp < nextAllowed) revert TooSoon(nextAllowed);

        uint256 i0 = e.lastIndex;
        uint256 i1 = pool.getReserveNormalizedIncome(e.asset);
        if (i1 <= i0) revert NothingAccrued();

        (uint256 amountIn, uint256 reserve) = _releasable(e, i1);
        if (amountIn == 0) revert NothingAccrued();
        if (amountIn < e.minPayout) revert BelowFloor(amountIn, e.minPayout);

        e.lastIndex = i1;
        e.lastHarvest = uint64(block.timestamp);
        e.withheld += reserve;
        e.totalPaid += amountIn; // denominated in the endowment's asset

        uint256 got = pool.withdraw(e.asset, amountIn, address(this));
        if (got < amountIn) revert WithdrawShortfall(amountIn, got);

        uint256 floorOut = _oracleFloor(e.asset, amountIn);
        uint256 effectiveMin = minOut > floorOut ? minOut : floorOut;

        _approve(e.asset, address(router), amountIn);
        amountOut = router.exactInputSingle(
            ISwapRouter02.ExactInputSingleParams({
                tokenIn: e.asset,
                tokenOut: payoutToken,
                fee: fee,
                recipient: e.agent,
                amountIn: amountIn,
                amountOutMinimum: effectiveMin,
                sqrtPriceLimitX96: 0
            })
        );

        emit HarvestedAndSwapped(id, e.agent, e.asset, amountIn, payoutToken, amountOut, floorOut, i0, i1);
    }

    /// @notice Add principal. Settles any pending accrual to the agent first so
    ///         the single `lastIndex` baseline stays correct for the new size.
    function topUp(uint256 id, uint256 amount) external onlyOwnerOf(id) nonReentrant {
        if (amount == 0) revert ZeroAmount();
        Endowment storage e = endowments[id];

        _settleTo(e, id);

        _pull(e.asset, msg.sender, amount);
        _supply(e.asset, amount);
        e.principal += amount;
        committedPrincipal[e.asset] += amount;

        emit ToppedUp(id, amount, e.principal);
    }

    /// @notice Return principal to the owner, after paying the agent what it earned.
    function close(uint256 id) external onlyOwnerOf(id) nonReentrant {
        Endowment storage e = endowments[id];
        _settleTo(e, id);

        uint256 principal = e.principal;
        uint256 claim = principal + e.withheld;
        e.active = false;
        e.principal = 0;
        e.withheld = 0;
        committedPrincipal[e.asset] -= principal;

        // Claim principal plus the rounding reserve withheld over this endowment's
        // life, capped at what is actually held so the final close can never revert
        // on a rounding unit. Principal goes to the owner; the reserve was always
        // withheld yield, so whatever is left over goes to the agent.
        uint256 held = IAToken(pool.getReserveAToken(e.asset)).balanceOf(address(this));
        uint256 amount = claim < held ? claim : held;

        uint256 got = pool.withdraw(e.asset, amount, address(this));
        if (got < amount) revert WithdrawShortfall(amount, got);

        uint256 toOwner = got < principal ? got : principal;
        _push(e.asset, e.owner, toOwner);
        uint256 toAgent = got - toOwner;
        if (toAgent != 0) {
            e.totalPaid += toAgent;
            _push(e.asset, e.agent, toAgent);
        }

        emit EndowmentClosed(id, e.owner, toOwner);
    }

    function setAgent(uint256 id, address newAgent) external onlyOwnerOf(id) {
        if (newAgent == address(0)) revert ZeroAddress();
        Endowment storage e = endowments[id];
        address old = e.agent;
        e.agent = newAgent;
        endowmentsOfAgent[newAgent].push(id);
        emit AgentChanged(id, old, newAgent);
    }

    function setRule(uint256 id, uint256 minPayout, uint64 minInterval) external onlyOwnerOf(id) {
        Endowment storage e = endowments[id];
        e.minPayout = minPayout;
        e.minInterval = minInterval;
        emit RuleChanged(id, minPayout, minInterval);
    }

    // ------------------------------------------------------------- internals

    function _supply(address asset, uint256 amount) private {
        _approve(asset, address(pool), amount);
        pool.supply(asset, amount, address(this), 0);
    }

    /// @dev Oracle-implied output for `amountIn`, less MAX_SLIPPAGE_BPS. Uses the
    ///      same Chainlink-backed oracle Aave itself prices collateral with, so this
    ///      introduces no trust assumption Weir did not already carry.
    function _oracleFloor(address assetIn, uint256 amountIn) private view returns (uint256) {
        IAaveOracle oracle = IAaveOracle(IPoolAddressesProvider(pool.ADDRESSES_PROVIDER()).getPriceOracle());
        uint256 priceIn = oracle.getAssetPrice(assetIn);
        uint256 priceOut = oracle.getAssetPrice(payoutToken);
        if (priceIn == 0 || priceOut == 0) revert OraclePriceUnavailable();

        uint256 unitIn = 10 ** IERC20(assetIn).decimals();
        uint256 unitOut = 10 ** IERC20(payoutToken).decimals();
        uint256 expected = (amountIn * priceIn * unitOut) / (priceOut * unitIn);
        return (expected * (10_000 - MAX_SLIPPAGE_BPS)) / 10_000;
    }

    function _pull(address asset, address from, uint256 amount) private {
        _check(asset, abi.encodeCall(IERC20.transferFrom, (from, address(this), amount)));
    }

    function _push(address asset, address to, uint256 amount) private {
        _check(asset, abi.encodeCall(IERC20.transfer, (to, amount)));
    }

    function _approve(address asset, address spender, uint256 amount) private {
        _check(asset, abi.encodeCall(IERC20.approve, (spender, amount)));
    }

    /// @dev Accepts a bare success (some tokens return no data) or an explicit `true`.
    ///      Rejects the `false`-returning tokens that silently break naive integrations.
    function _check(address token, bytes memory data) private {
        (bool ok, bytes memory ret) = token.call(data);
        if (!ok) revert TokenCallFailed(token);
        if (ret.length != 0 && !abi.decode(ret, (bool))) revert TokenCallFailed(token);
    }

    /// @dev Pays out any accrual, ignoring the floor and interval. Used by topUp
    ///      and close so the agent is never shortchanged by an owner action.
    function _settleTo(Endowment storage e, uint256 id) private {
        uint256 i0 = e.lastIndex;
        uint256 i1 = pool.getReserveNormalizedIncome(e.asset);
        if (i1 <= i0) return;

        (uint256 amount, uint256 reserve) = _releasable(e, i1);
        e.lastIndex = i1;
        e.withheld += reserve;
        if (amount == 0) return;

        e.totalPaid += amount;
        uint256 got = pool.withdraw(e.asset, amount, address(this));
        if (got < amount) revert WithdrawShortfall(amount, got);
        _push(e.asset, e.agent, amount);
        emit Harvested(id, e.agent, e.asset, amount, i0, i1, e.totalPaid);
    }
}
