# Livetest Report

**URL:** https://weir-khaki.vercel.app
**Network:** Base Sepolia (84532)
**Mode:** Hybrid (Next.js frontend + deployed contracts)
**Version:** V1 — functional coverage
**Overall:** PASS
**Results:** 14 PASS / 0 FAIL / 2 SKIP

Rendered with Playwright driving system Chrome, because the Chrome extension used
elsewhere in this project refuses `localhost` without site permission. This run is the
first time the UI has actually been looked at.

---

## Interface Inventory

| Channel | Endpoint | Auth | Priority | Tested |
|---|---|---|---|---|
| Browser UI | https://weir-khaki.vercel.app | none | high | ✅ |
| GET /api/budget (x402-gated) | /api/budget?agent=0x… | x402 payment | high | ✅ |
| Subgraph GraphQL | api.studio.thegraph.com/query/1760272/weir/v0.0.1 | none | high | ✅ |
| Contract (Base Sepolia) | 0xE8b6f6C5cF6dB470c3a3Fe18a1977e55aC0Eb645 | none | high | ✅ |
| MCP server (stdio) | mcp/dist/index.js | none | medium | SKIP (unit-verified: 6 tools listed, 2 executed) |
| Privy sign-in | embedded wallet | email OTP | high | SKIP (needs a human to receive the code) |

## Domain Results

| # | Domain | Status | Evidence |
|---|---|---|---|
| 1 | Core user flows | PASS | index, solvency and accrual all render live and move between loads |
| 2 | API connectivity | PASS | UI 200, x402 route 402 (correct), subgraph 200, contract `nextId()=2` |
| 3 | Visual completeness | PASS | no `undefined`/`null`/`NaN`; the weir renders as reservoir + crest + spill + pool |
| 4 | Form functionality | PASS | endow form renders with asset select, principal, agent, floor, interval |
| 5 | Console errors | PASS | **0 console errors, 0 uncaught exceptions** |
| 6 | Auth flows | SKIP | Privy needs an email OTP a human must receive; injected-wallet fallback present |
| 7 | Mobile (375px) | PASS | `scrollW 375 = clientW 375`, no horizontal scroll |
| 8 | Post-PRD additions | PASS | solvency panel and x402 route both render/respond |
| 9 | Integration proof | PASS | see below |

## Live value assertions

```
Aave v3 liquidity index = 1.243993385288   (moves between loads)
observed APY            = 1.540%
principal committed     = 250000.00
aTokens actually held   = 250000.89        committed <= held, solvent by 0.896612
spilling now            = 0.896609         ticking ~116 units/second
paid to the agent       = 0.01
```

## Cross-Integration Proofs

| Integration | Proof |
|---|---|
| Weir → Aave v3 | `getReserveNormalizedIncome` drives every figure on the page |
| Agent → Weir.harvest | tx `0xeb03555c77939a47e728ef5337dc11abd83028597e06e31163dddc6d3cf22830` |
| Weir → The Graph | subgraph serving `endowmentCount 1`, `harvestCount 1`, caller = the agent |
| Weir → Uniswap | `harvestAndSwap` fork-tested: 10 WETH → 218.698043 USDC |
| Weir → x402 | `/api/budget` returns a spec-shaped 402, facilitator x402.org |

## Defects found and fixed during this run

| # | Severity | Defect | Fix | Re-verify |
|---|---|---|---|---|
| 1 | **P0** | The weir visual did not render. The reservoir never painted, so the centrepiece read as a stray teal bar rather than water held behind a crest. | Rebuilt with explicit inline colour instead of custom CSS classes | PASS — reservoir, crest, spill and pool all visible |
| 2 | **P1** | Horizontal scroll on mobile: `scrollW 386 > clientW 375`. The live figure was anchored from the left and overflowed at 375px. | Right-anchored it, responsive type, `overflow-hidden` on the figure | PASS — `375 = 375` |
| 3 | P2 | One console 404 — no favicon existed | Added `app/icon.svg` | PASS — 0 console errors |

## Critical Issues (P0)

_None remaining._

## Warnings (P1)

- **Privy sign-in has never completed.** The embedded-wallet path needs an email OTP that a
  human must receive. The injected-wallet fallback means the write path still works, but the
  Privy prize requires at least one wallet created and one flow completed.
- **The agent cannot pay the x402 fee.** The endowment pays Aave test USDC; x402 settles
  Circle USDC, which requires EIP-3009 that Aave's test token does not implement. The gap
  does not exist on mainnet, where Aave's Base USDC reserve *is* Circle USDC.

## For the demo

The three shots that are real and verified: the live index moving, `committed ≤ held` with
the solvency surplus, and the agent's own harvest transaction on Basescan. Do not promise a
completed x402 payment on camera; the 402 itself is real, the settlement is not.
