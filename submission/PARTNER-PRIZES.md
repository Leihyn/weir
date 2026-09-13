# Partner prize selections — ETHOnline 2026

**Max 3 partner prizes.** A partner with multiple tracks counts as **one** selection and you
remain eligible for all of their tracks. So three selections cover five prize tracks.

| # | Partner | Tracks covered | Pool |
|---|---|---|---|
| 1 | **The Graph** | AI Tooling / AI Use Case (From Scratch) + Composable & Standardized | $10,000 |
| 2 | **Uniswap Foundation** | Best Uniswap Stack Contribution | $3,000 |
| 3 | **Privy** | Best financial flow + Best B2B financial product | $5,000 |

Not selected: Hedera, Arc, 1inch, ENS, Ledger, Chainlink, World, Bazantic. Nothing was built
against them and claiming a partner you haven't integrated is worse than not claiming one.

---

## 1. The Graph

**How we used it**

```
Weir indexes every endowment and every yield release with a subgraph deployed to Subgraph
Studio, live at:
https://api.studio.thegraph.com/query/1760272/weir/v0.0.1

It is load-bearing rather than decorative. Our MCP server answers the question an endowed
agent actually needs — not "what is my balance" but "what can I spend forever" — and it
derives that from indexed harvest history, not from a balance call. A balance is actively
misleading here: the principal is visible but permanently unspendable, so an agent reading
its balance would conclude it can afford things it can never afford.

Live, the tool returns:

  #1 USDC: principal 250,000 @ 1.407% -> 9.635531 USDC/day
  TOTAL: 9.635531 /day   289.0659 /month   3516.97 /year
  VERDICT: PERPETUAL. A burn of 5/day is 51.9% of income. This agent never runs out.

That is reasoning over the data, not printing a query result. The subgraph is serving real
data from Base Sepolia: 1 endowment, 250000000000 committed, 1 harvest whose caller is the
agent itself. hasIndexingErrors: false.

Schema: subgraph/schema.graphql   Mappings: subgraph/src/weir.ts
MCP tool: mcp/src/index.ts -> weir_sustainable_budget
```

**Feedback**

```
The Studio deploy flow was the smoothest part of our whole stack: graph auth, graph deploy,
synced on the first attempt with no indexing errors, on a testnet.

Two things cost us real time.

First, a uint64 event parameter arrives in the mapping as BigInt, not i32. Calling
BigInt.fromI32 on it crashes the AssemblyScript compiler with "The AssemblyScript compiler
crashed" and no line number and no type name. We lost a chunk of time bisecting a 143-line
mapping to find it. Even a file-and-line in that error would have saved all of it.

Second, we wanted the Composable track and could not reach it. Our own subgraph plus the
Subgraph MCP reads as "two Graph products" on the qualification list, but the description
frames the MCP layer as being for cross-protocol analysis, and we index one protocol. We
could not tell from the docs whether a single-protocol subgraph with an MCP on top counts as
composition or falls under "simply querying one Subgraph". We assumed the stricter reading
and did not claim it. A worked example of the minimum bar would have helped.

Smaller note: the only Subgraph MCP implementation we could find is graphops/subgraph-mcp,
which is Rust, third-party, and last pushed over a year ago. Nothing under @graphprotocol on
npm. For a track that names the Subgraph MCP explicitly, a first-party package would lower
the barrier a lot.
```

---

## 2. Uniswap Foundation

**How we used it**

```
An endowment can be held in any asset, but an agent's bills are denominated in USDC. That
gap is where Uniswap sits.

harvestAndSwap() releases the accrued yield of a WETH endowment, routes it through
SwapRouter02, and pays the agent in USDC. The owner picks the asset; the agent still gets
paid in something it can spend.

The interesting part is keeping it permissionless. Weir's harvest() has no keeper: the
amount comes from Aave's index and the recipient comes from storage, so a caller has nothing
to choose. Adding a swap reintroduced exactly one attackable parameter, amountOutMinimum. We
floored it against Aave's own Chainlink-backed oracle, so a caller may RAISE the slippage
guard but never lower it, and passing minOut = 0 does not open a sandwich.

Verified on a Base fork: a 10 WETH endowment accrued 0.08638 WETH over 180 days and paid the
agent 218.698043 USDC, matching the oracle price of $2,531.54 to within two cents.

Code: contracts/src/Weir.sol -> harvestAndSwap(), _oracleFloor()
Interface: contracts/src/interfaces/IUniswapV3.sol
Tests: contracts/test/Weir.unit.t.sol -> test_oracleFloorRejectsBadFill,
       test_callerCanRaiseButNotLowerTheFloor
FEEDBACK.md is in the repo root and the developer feedback form has been submitted.
```

**Feedback**

See `FEEDBACK.md` in the repo root, submitted via the Developer Feedback Form. Summary: fee-tier
selection has no canonical on-chain answer; `OracleLibrary` being pinned to 0.7.6 means modern
0.8 integrators skip the price check entirely; docs skew to the SDK path rather than
contract-to-contract swapping on a third party's behalf; and there's no standard way to prove
post-trade execution quality.

---

## 3. Privy

**How we used it**

```
Weir is a self-service Earn vault, which Privy lists as an eligible financial flow, and the
Privy wallet is how an owner signs in and commits principal.

Sign-in creates an embedded wallet for users without one, and the funding flow is: approve
USDC, then open() which supplies it to Aave and records the endowment. From that point the
agent is paid from the index.

Deliberate design note: Privy is NOT the only way in. app/lib/connect.ts prefers a Privy
wallet and falls back to any injected provider. Gating an entire write path on one vendor's
key turns a missing environment variable into a dead demo, and we would rather the product
degrade than disappear.

Code: app/components/Providers.tsx, app/components/OpenEndowment.tsx, app/lib/connect.ts
```

**Feedback**

```
Setup was fast and the embedded-wallet-on-login default is the right one.

One thing bit us: we configured loginMethods as ["email", "wallet", "google"] and got a
runtime error, "Login with Google not allowed", because Google was not enabled on the app in
the dashboard. The failure surfaced as a thrown runtime error in the app rather than as a
disabled or hidden option in the modal. Since loginMethods is declared client-side and
enablement lives server-side, a mismatch is easy to create and the current behaviour makes it
look like the app is broken. Either filtering unavailable methods out of the modal, or a
console warning at init listing the methods that will fail, would have turned a debugging
session into a one-line fix.
```

---

## Submission option

**Finalist + Partner Prizes.** It costs nothing extra: partners judge asynchronously either
way, and only the top 20% advance to live judging while most prize money is paid to projects
that do not advance. The only obligation is availability for a 7-minute session (4 demo,
3 Q&A) if selected.

## Classification

**AI agent infrastructure, built on DeFi rails.** Accurate rather than positioned: there is no
model and no inference in our stack. The user is an autonomous agent; the mechanism is an
Aave index.

## Prepare for these judging questions

- *What inspired it?* Agents get funded with a lump sum and a spending cap that is a policy
  someone can edit. An endowment makes the cap arithmetic instead.
- *What tools and why?* Aave because its liquidity index is a readable monotonic multiplier,
  which is the one property the mechanic needs. Uniswap because bills are denominated in USDC
  and endowments needn't be. The Graph because an agent needs its runway, not its balance.
- *What was hard?* Keeping harvest permissionless once a swap was involved. The oracle floor
  is the answer.
- *Why is the yield so small?* The yield isn't small, the bill is. $4,045 endows a $12/month
  subscription forever at Aave's current rate.
