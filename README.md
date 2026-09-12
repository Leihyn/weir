# Weir

**An endowment your agent cannot outspend.**

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
# contracts: 9 tests against live Aave v3 on Base, pinned block, no mocks
cd contracts && forge test -vv

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

## Where the sponsor tech sits

- **Aave v3** is the index. The whole mechanic is `getReserveNormalizedIncome`.
- **Privy** is how an owner signs in and commits principal, and how an agent holds
  a spending wallet.
- **Uniswap** converts a non-USDC endowment's yield into spendable USDC, so an
  endowment can be held in one asset and paid out in another.
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
- The contracts are **unaudited**. Written during a hackathon.

## Status

Built and tested. Not audited, not adversarially reviewed.

| Component | State |
|---|---|
| `Weir.sol` | tested: 9 fork tests pass against live Aave v3 on Base |
| Lifecycle e2e | tested: deploy, open, accrue, third-party harvest, solvency, on a Base fork |
| Subgraph | built: compiles to WASM, not yet deployed to Studio |
| MCP server | built: compiles and starts |
| Agent | built: typechecks |
| Frontend | built: production build succeeds |
| Mainnet deploy | not done |

## Troubleshooting

**`forge test` fails with `BadRecordMac` or a connection error**
The public Base RPC is rate-limiting. The fork block is pinned so state caches
after one successful run; re-run, or set a private RPC in `contracts/foundry.toml`.

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
