# Uniswap Developer Feedback — Weir (ETHOnline 2026)

**Project:** Weir, a perpetual endowment for autonomous agents.
**Repo:** https://github.com/Leihyn/weir
**What we used:** Uniswap v3 `SwapRouter02` on Base (`0x2626664c2603336E57B271c5C0b26F421741e481`)

## Where the integration lives

| What | File | Lines |
|---|---|---|
| `harvestAndSwap`, the swap entry point | `contracts/src/Weir.sol` | `harvestAndSwap(uint256,uint24,uint256)` |
| Oracle-derived slippage floor | `contracts/src/Weir.sol` | `_oracleFloor(address,uint256)` |
| Router interface | `contracts/src/interfaces/IUniswapV3.sol` | whole file |
| Router address wiring | `contracts/script/Deploy.s.sol` | `UNI_ROUTER_BASE` |
| Fork tests against the live Base pool | `contracts/test/Weir.fork.t.sol` | `test_wethEndowmentPaysAgentInUsdc`, `test_oracleFloorIsEnforcedEvenWhenCallerPassesZero`, `test_sandwichAttemptRevertsAgainstOracleFloor` |
| Deterministic swap tests | `contracts/test/Weir.unit.t.sol` | `test_oracleFloorRejectsBadFill`, `test_swapWithinTolerancePaysAgentInUsdc`, `test_callerCanRaiseButNotLowerTheFloor` |

## What we were solving

Weir lets an owner commit principal into Aave and lets an agent spend only the yield.
An endowment can be held in WETH while the agent needs USDC to spend, so the accrued
yield has to be converted on release. Uniswap is that conversion.

The hard part was that `harvest` in Weir is **permissionless** by design. The release
amount and the recipient both come from storage, so there is nothing for a caller to
abuse. Adding a swap reintroduced exactly one attackable parameter: `amountOutMinimum`.
A caller could pass zero and sandwich the agent.

We solved it by flooring `amountOutMinimum` against Aave's own Chainlink-backed oracle:

```solidity
uint256 floorOut = _oracleFloor(e.asset, amountIn);
uint256 effectiveMin = minOut > floorOut ? minOut : floorOut;
```

A caller may raise the guard, never lower it. This keeps the swap permissionless with
no keeper and no relayer.

**Measured on a Base fork:** a 10 WETH endowment accrued 0.08638 WETH over 180 days and
paid the agent **218.698043 USDC**, within two cents of the oracle price of $2,531.54.

## Feedback

### What worked well

- `SwapRouter02.exactInputSingle` was the right level of abstraction. One struct, one
  call, and `recipient` meant we could send proceeds straight to the agent without the
  funds resting in our contract. That removed a whole class of custody risk from our
  design and we did not have to write a withdrawal path for swapped output.
- Testing against the real Base pool on a pinned fork worked with no special setup.
  We never needed to mock a pool to get a believable execution price.
- Deploy addresses were easy to find and stable.

### What was harder than it should have been

1. **Choosing a fee tier is guesswork from the contract's point of view.** We hardcode
   `fee` as a caller-supplied `uint24` and have no on-chain way to know which tier is
   deepest for a given pair right now. If liquidity migrates between tiers, integrators
   silently execute worse. A canonical on-chain "best tier for this pair" view, or a
   router entry point that picks, would remove a real footgun. Right now every
   integrator reimplements this off-chain or hardcodes 500 and hopes.

2. **Slippage protection is the integrator's whole problem.** `amountOutMinimum` is the
   only guard and the router has no opinion about whether the value is sane. Every
   permissionless integration has to solve "where does a trustworthy reference price
   come from" independently, and most do not. We used Aave's oracle because we already
   depended on it. A first-party TWAP helper that compiles under Solidity 0.8 would be
   widely used. `OracleLibrary` exists in v3-periphery but is pinned to 0.7.6, so
   modern integrators either vendor a fork of `TickMath` or, more often, skip the check.
   That pragma gap is doing real damage to integration quality.

3. **Docs skew toward the frontend and SDK path.** We were writing a contract that swaps
   on behalf of a third party from inside another protocol's accounting. Guidance for
   that shape (approve-then-call patterns, what happens to dust, whether `recipient` can
   safely be an arbitrary third party) was thinner than the SDK material.

4. **No natural way to assert "this swap executed near fair value" after the fact.** We
   emit our computed floor in `HarvestedAndSwapped` so an observer can audit it, but we
   built that ourselves. A standard event or helper for post-trade execution quality
   would help protocols that swap on users' behalf prove they did not get sandwiched.

### What we would build next with more time

A v4 hook version. The endowment release is a scheduled, predictable, small,
price-insensitive flow, which is close to ideal counterparty flow for an LP. A hook that
recognises endowment harvests and prices them differently from toxic flow would benefit
both sides. We ran out of hours before we could try it.

### Versions

Solidity 0.8.35, Foundry 1.5.1, Base mainnet, `SwapRouter02`.
