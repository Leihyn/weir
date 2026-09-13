# Weir

**An endowment your agent cannot outspend.**

## Live on Base Sepolia

| | |
|---|---|
| Weir contract | [`0xE8b6f6C5cF6dB470c3a3Fe18a1977e55aC0Eb645`](https://sepolia.basescan.org/address/0xE8b6f6C5cF6dB470c3a3Fe18a1977e55aC0Eb645) |
| Endowment #1 | 250,000 test USDC, floor $0.01, min interval 60s |
| Agent | [`0xD3EFF0247E7b61d75A34e1965939e736fe69C4c2`](https://sepolia.basescan.org/address/0xD3EFF0247E7b61d75A34e1965939e736fe69C4c2) |
| Aave v3 Pool | `0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27` |
| Uniswap SwapRouter02 | `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4` |

**First live harvest**, by the agent paying itself:
[`0xeb03555c77939a47e728ef5337dc11abd83028597e06e31163dddc6d3cf22830`](https://sepolia.basescan.org/tx/0xeb03555c77939a47e728ef5337dc11abd83028597e06e31163dddc6d3cf22830)

```
amount released : 0.016172 USDC
agent balance   : 0 -> 16,615
solvency        : committed 250000000000   held 250000000222
```

Principal exactly intact. The agent chose nothing: not the amount, not the destination.

Base Sepolia is deliberate, not a compromise. A $20 mainnet endowment throws off $0.002/day,
which is invisible. Here the faucet is permissionless, so a 250,000 endowment throws off
about $10/day and the mechanic is legible. Aave v3 on Base Sepolia is a real market with a
real, moving index (USDC 1.4618% APR, WETH 19.05% APY), not a mock.

## The problem

You give an autonomous agent $1,000 and a $1/day budget. In a thousand days it is dead.

Every funded agent today is mortal by construction. You hand it a lump sum and a
spending cap, and the cap is a policy: a session key that drains, an allowance
someone can raise, a config line in a service you hope nobody edits. The agent
spends principal because principal is the only thing it has. When the money is
gone, the agent stops, and whatever it was maintaining stops with it.

There is a financial instrument for exactly this problem and it is six hundred
years old. A university does not spend its endowment. It spends what the
endowment throws off, forever. Nothing on-chain does this for agents.

## What Weir does

An owner commits principal once. The agent may spend the yield and **can never
touch the principal**, because the released amount is computed from Aave's
liquidity index rather than chosen by whoever calls the contract. There is no
amount parameter to abuse and no destination to redirect. The cap is arithmetic,
not a promise about off-chain behaviour.

The owner can close the endowment and take 100% of the principal back at any time.

## How the number is derived

An Aave aToken is a scaled-balance token. Your balance is a raw balance times a
global index:

```
balance = scaledBalance × index / RAY
```

For principal `P` committed at index `i0`, the releasable amount at index `i1` is:

```
accrued = P × (i1 − i0) / i0        equivalently   d = S × (1 − i0/i1)
```

After withdrawing exactly that, the remaining balance is `P` again. Principal is
preserved by construction rather than by a check that could be forgotten.

This is the same arithmetic as a Token-2022 scaled-UI multiplier tick on Solana.
An Aave liquidity index and a scaled-UI multiplier are the same idea, which is why
the formula transfers unchanged.

### The rounding reserve

Aave burns `amount.rayDiv(index)` with round-half-up, so withdrawing the exact
accrual burns up to one extra scaled unit and leaves the balance a hair *below*
principal. Left alone that leaks roughly one unit per harvest, and with several
endowments sharing one aToken position the shortfall compounds until the last
owner to close is short.

Weir withholds `i1 / RAY + 1` asset units per harvest, tracks the total in
`withheld`, and pays it to the agent on close. Principal is never touched and
nothing is stranded. `test_solvencyNeverLeaksAcrossManyHarvests` runs 48 harvests
across two endowments and asserts both.

## Why harvest is permissionless

Anyone may call `harvest(id)`. The amount comes from the index and the destination
comes from storage, so a caller has nothing to choose and nothing to gain. There
is no keeper to trust, no relayer to run, and no liveness dependency on us. The
agent can even call it and pay itself.

`test_permissionlessHarvestCannotBeRedirected` has a stranger call `harvest`; the
agent receives the full accrual and the caller receives zero.

## Quick start

```bash
# offline: 10 unit and fuzz tests, deterministic, no RPC needed
cd contracts && forge test --match-contract WeirUnitTest -vv

# fork: 13 tests against live Aave v3 on Base at a pinned block, no mocks.
# --threads 1 is required: concurrent fork requests trigger TLS failures.
BASE_RPC_URL=https://base.drpc.org forge test --match-contract WeirForkTest --threads 1 -vv

# app
cd app && cp env.example .env.local   # fill in NEXT_PUBLIC_*
pnpm install && pnpm dev

# the agent's view of its own solvency
cd mcp && pnpm install && pnpm build
WEIR_SUBGRAPH_URL=... WEIR_ADDRESS=0x... node dist/index.js

# an endowed agent that harvests itself and buys an x402-gated call
cd agent && pnpm install
AGENT_PRIVATE_KEY=0x... WEIR_ADDRESS=0x... X402_URL=https://... pnpm start
```

## Two test suites, on purpose

The **fork suite** proves Weir works against the real protocol: real Aave, real index,
real Uniswap pool, pinned block, no mocks. The **offline suite** proves the arithmetic
holds across the whole input space, including states the live chain will not produce on
demand, and it runs in under half a second with no network.

The mock pool deliberately reproduces Aave's round-half-up scaled burn and funds the
interest it claims to have earned. An earlier version of it did neither, and was
silently insolvent in a way that only failed once cumulative withdrawals exceeded the
original deposits.

The sandwich rejection that the fork suite cannot run on a free RPC is covered offline
by `test_oracleFloorRejectsBadFill`, where the router fills 10% below oracle and the
1% floor rejects it even though the caller passed `minOut = 0`.

## Measured, not quoted

Against Aave v3 USDC on Base at the pinned fork block:

| Endowment | Per day | Per month | Per year |
|---|---|---|---|
| $1,000 | $0.0975 | $2.93 | $35.60 |
| $10,000 | $0.9755 | $29.26 | $356.05 |
| $100,000 | $9.7547 | $292.64 | $3,560.47 |

The fork test prints `$28.75` of 30-day accrual on a $10,000 endowment and
`$346.94` across twelve monthly harvests.

**This is small, and that is the honest positioning.** $0.10/day does not fund a
chatty inference agent. Weir is for long-lived, low-burn agents: monitors,
keepers, subscription payers, watchers that must exist for years rather than think
hard for an hour. At $10,000 it is a real operating budget for a keeper. The point
is not the size of the cheque, it is that the agent never dies.

## Where the integration code is

For reviewers verifying the integrations:

| Integration | File | Symbol |
|---|---|---|
| Aave index, the core mechanic | `contracts/src/Weir.sol` | `_releasable`, `accrued` |
| Uniswap swap + oracle floor | `contracts/src/Weir.sol` | `harvestAndSwap`, `_oracleFloor` |
| Uniswap router interface | `contracts/src/interfaces/IUniswapV3.sol` | `ISwapRouter02` |
| Subgraph schema and mappings | `subgraph/schema.graphql`, `subgraph/src/weir.ts` | `handleOpened`, `handleHarvested` |
| MCP server (The Graph consumer) | `mcp/src/index.ts` | `weir_sustainable_budget` |
| Privy auth and wallet | `app/components/Providers.tsx`, `app/components/OpenEndowment.tsx` | `PrivyProvider`, `usePrivy` |
| Endowed agent | `agent/src/index.ts` | `main` |

Uniswap feedback: [`FEEDBACK.md`](./FEEDBACK.md)

## Where the sponsor tech sits

- **Aave v3** is the index. The whole mechanic is `getReserveNormalizedIncome`.
- **Privy** is how an owner signs in and commits principal, and how an agent holds
  a spending wallet.
- **Uniswap** converts a non-USDC endowment's yield into spendable USDC via
  `harvestAndSwap`, so an endowment can be held in WETH and the agent still gets paid
  in something it can spend. The swap keeps `harvest` permissionless because
  `amountOutMinimum` is floored by Aave's own Chainlink-backed oracle: a caller may
  raise the slippage guard but never lower it, so `minOut = 0` does not open a
  sandwich. Verified on a fork: a 10 WETH endowment accrued 0.08638 WETH over 180
  days and paid the agent **218.698043 USDC**, matching the oracle price of $2,531.54
  to within two cents.
- **The Graph** indexes every endowment and every release. The MCP server answers
  *"what can I spend forever?"* from indexed harvest history, which is the question
  an endowed agent actually needs and cannot get from a balance call.

## Trust model, stated plainly

- The owner can close an endowment at any time and recover all principal.
- The agent can never reach principal. Not by policy: by arithmetic.
- Anyone can trigger a payment; nobody can redirect or resize one.
- Weir holds the aTokens. `solvency(asset)` exposes committed principal against
  aTokens actually held, and the invariant `held >= committed` is asserted in tests.
- Weir depends on Aave v3. If Aave pauses or the reserve is illiquid, withdrawals
  fail and the endowment is frozen until it recovers. This is not mitigated.
- Weir claims exactly `principal + withheld` on close. Any aToken surplus above that
  is **not claimable**: there is no sweep function, so a donated aToken or a rounding
  surplus stays in the contract permanently. It is bounded by the number of harvests
  and measured at 16 units of USDC after 20 harvests in
  `test_closePaysWithheldReserveToAgent`. Accepted rather than fixed, because a sweep
  is a privileged withdrawal path and this design has none.
- `harvestAndSwap` trusts Aave's oracle for its slippage floor. If that oracle is
  wrong, the floor is wrong. It is the same oracle Aave prices collateral with, so
  Weir carries no new oracle assumption, but it is not an independent check.
- The contracts are **unaudited**. Written during a hackathon.

## Status

Built and tested. Not audited, not adversarially reviewed.

| Component | State |
|---|---|
| `Weir.sol` | tested: 22 of 23 tests pass. 10 offline unit and fuzz tests (479ms, no RPC) plus 12 of 13 fork tests against live Aave v3 on Base |
| Lifecycle e2e | tested: deploy, open, accrue, third-party harvest, solvency, on a Base fork |
| Subgraph | built: compiles to WASM, not yet deployed to Studio |
| MCP server | built: compiles and starts |
| Agent | built: typechecks |
| Frontend | built: production build succeeds |
| Sandwich-rejection test | blocked: needs an RPC that serves Uniswap tick slots; free endpoints rate-limit it |
| Mainnet deploy | not done |

## Troubleshooting

**`forge test` fails with `BadRecordMac`**
Run with `--threads 1`. This is a TLS integrity error caused by forge's concurrent
fork requests, and it reproduces against every public Base endpoint tried. It is not
a provider problem and switching RPC does not fix it; reducing concurrency does.

**`forge test` fails with HTTP 429**
The free RPC tier is exhausted. The fork block is pinned so state caches after one
successful run, but the sandwich test touches enough Uniswap tick slots to blow
through a free quota on its own. Set `BASE_RPC_URL` to a private endpoint.

**`harvest` reverts with `BelowFloor`**
The accrual has not yet reached `minPayout`. This is intended: it stops harvests
that cost more in gas than they release. The accrual is not lost, because
`lastIndex` does not advance on a failed harvest, so it keeps accumulating.

**`harvest` reverts with `TooSoon`**
`minInterval` seconds have not elapsed since the last harvest.

**`graph build` crashes with "AssemblyScript compiler crashed"**
Usually a type mismatch AssemblyScript cannot report. A `uint64` event parameter
arrives as `BigInt`, not `i32`; calling `BigInt.fromI32` on it will crash the
compiler with no line number.

**The app says "Contract address not configured"**
Set `NEXT_PUBLIC_WEIR_ADDRESS` in `.env.local` and restart.

## Licence

MIT.
