# ETHOnline 2026 submission form — answers to paste

Form: Hacker Dashboard → Project. Sections: Project details · Images · Tech stack ·
Select prizes · Video · Future · Final.

> ⚠️ **The repo must be PUBLIC before you reach the GitHub step.** The form says so, and
> Uniswap's prize also depends on `FEEDBACK.md` resolving.

---

## Project details

**Project name**
```
Weir
```

**Category**
```
Artificial Intelligence
```
*(Correct. As DeFi we read as "another Aave yield harvester", which kills Originality and
WOW, two of the five criteria. The novel claim — a spending cap an agent cannot raise — only
exists in the agent framing. Technicality defends itself on the tests either way.)*

**Emoji**
```
💧
```
*(The weir: water held back, only the overflow leaving. Doubles as liquidity. Alternate: ♾️
for perpetuity.)*

**Demonstration link**
```
https://weir-khaki.vercel.app
```

**Short description** *(89 / 100 chars)*
```
Endow an AI agent's bills. It spends the yield forever and can never touch the principal.
```
*(Alternate, 80 chars: `Perpetual subscriptions for AI agents. It spends yield forever, never principal.`)*

**Description** *(min 280 chars — this is ~1,300)*
```
Your agent has a $12/month API subscription. You fund it with $500. In forty months it is
dead, and so is whatever it was maintaining. Recurring costs do not stop. Budgets do.

Every funded agent today is mortal by construction. You hand it a lump sum and a spending
cap, and that cap is a policy: a session key that drains, an allowance someone can raise, a
config line in a service you hope nobody edits. The agent spends principal because principal
is the only thing it has.

Weir endows the bill instead of funding the agent. An owner commits principal to Aave once.
From then on the agent is paid only what the index produces, and three things are true by
construction rather than by policy. The agent never chooses an amount: harvest() derives it
from Aave's liquidity index as accrued = P x (i1 - i0) / i0, so there is no amount parameter
to abuse. It never chooses a destination; that comes from storage. And it cannot reach the
principal, because after withdrawing the accrual the remaining balance is P again.

Because a caller has nothing to choose and nothing to gain, harvest is permissionless. No
keeper, no relayer, no liveness dependency on us. The agent can call it and pay itself, and
it has: 0.016172 USDC released on Base Sepolia with the principal unchanged.

The owner can close the endowment and reclaim 100% of the principal at any time.

At Aave's live mainnet USDC rate, $4,045 endows a $12/month subscription forever. The yield
is not small. The bill is small, and the principal is simply whatever that bill requires.
```

**How it's made** *(min 280 chars — this is ~2,200)*
```
An Aave aToken is a scaled-balance token: your balance is a raw balance times a global
index. That is the same object as a Token-2022 scaled-UI multiplier on Solana, and it is the
one property Weir needs. For principal P committed at index i0, the releasable amount at i1
is P x (i1 - i0) / i0. After withdrawing exactly that, the remaining balance is P again, so
principal is preserved by construction rather than by a check someone could forget.

Stack: Solidity 0.8.35 / Foundry for the contract; Next.js 15 + viem + Privy for the app;
a subgraph on The Graph's Subgraph Studio; an MCP server for the agent; a TypeScript agent
with an x402 client.

Two things were genuinely hacky and are the parts we are most pleased with.

First, keeping the swap permissionless. harvest() has no keeper because the amount comes
from the index and the recipient from storage, so a caller has nothing to abuse. Adding
Uniswap reintroduced exactly one attackable parameter, amountOutMinimum, and a caller could
pass zero and sandwich the agent. We floored it against Aave's own Chainlink-backed oracle,
so a caller may RAISE the slippage guard but never lower it. That adds no trust assumption
we did not already carry, since Weir already depends on Aave.

Second, a rounding reserve. Aave burns scaled units with rayDiv round-half-up, so
withdrawing the exact accrual burns up to one extra scaled unit and leaves the balance a
hair BELOW principal. Left alone that leaks a unit per harvest and, with several endowments
sharing one aToken position, the shortfall compounds until the last owner to close is short.
Weir withholds index/RAY + 1 units per harvest, tracks the total, and pays it to the agent
on close, so nothing leaks and nothing is stranded. A fork test runs 48 harvests across two
endowments and asserts both.

Partner tech, and how it earned its place:
- The Graph indexes every endowment and release. Our MCP server answers the question an
  endowed agent actually needs — not "what is my balance", which is actively misleading
  here because principal is visible but unspendable, but "what can I spend forever". It
  returns a PERPETUAL / NOT SURVIVABLE verdict against a proposed burn rate.
- Uniswap converts a WETH endowment's yield into the USDC bills are denominated in. Fork
  tested: 10 WETH accrued 0.08638 WETH over 180 days and paid 218.698043 USDC, within two
  cents of oracle.
- Privy is how an owner signs in and commits principal, as a self-service Earn vault flow.
  Deliberately not the only way in: we fall back to any injected wallet, because gating the
  whole write path on one vendor's key turns a missing env var into a dead demo.

Testing: 23 tests. 10 offline unit and fuzz tests run in 477ms with no RPC; 13 fork tests
run against live Aave v3 on Base at a pinned block, no mocks. The fork tests found four real
bugs that reading the code did not, including the rounding leak above.

Built with Claude Code as the implementing agent. Full disclosure of what was AI-written,
what the human contributed, and the eight bugs the AI introduced and later caught is in
AI-USE.md in the repo.
```

**GitHub Repositories**
```
Leihyn/weir
```
⚠️ Must be public first.

---

## Images

Use, in this order:
1. `screenshots/lt4-desktop.png` — the weir visual, solvency panel and live index
2. `screenshots/lt4-mobile.png` — mobile, proving it is responsive

---

## Tech stack

```
Solidity, Foundry, Aave v3, Uniswap v3, The Graph (Subgraph Studio), Next.js, TypeScript,
viem, Privy, Model Context Protocol (MCP), x402, Base Sepolia, Vercel
```

---

## Select prizes (max 3)

1. **The Graph** — covers AI Tooling/Use Case + Composable
2. **Uniswap Foundation** — Best Uniswap Stack Contribution
3. **Privy** — Best financial flow + Best B2B financial product

Per-partner "how you used it" and feedback text: see `submission/PARTNER-PRIZES.md`.

---

## Video

2–4 min, ≥720p, narrated by a human. Script and timings: `submission/DEMO-SCRIPT.md`.

---

## Future

```
The immediate next build is a Uniswap v3 LP-fee adapter, and it would make the guarantee
stronger rather than just broader. Uniswap tracks fee growth separately from liquidity:
feeGrowthInside0LastX128 only ever increases, and collect() on the NonfungiblePositionManager
cannot touch liquidity at all — reducing a position requires decreaseLiquidity(). So Uniswap
already enforces the income-versus-corpus split inside the protocol, and an LP endowment's
guarantee would rest on Uniswap's own function boundary rather than on our arithmetic.

Beyond that, an IIndexSource interface covering Aave, Compound and every ERC-4626 vault is
roughly 50 lines and costs the guarantee nothing, since all of them expose a monotonic
readable index.

What we will NOT do is extend this to market-priced assets. Harvesting price movement is
selling capital, not spending income: every rally forces a sale, nothing rebuys, and the
position ratchets down. The path there is an endowment spending rule — X% of a trailing
average, as large university endowments actually do — but that trades a provable guarantee
for a policy, and a high-water mark only restores the guarantee by paying nothing through
drawdowns. Hard guarantee or smooth payout, not both. We chose the hard guarantee.

On destinations: Weir releases USDC to an address the owner sets. An agent's spending wallet
pays x402 services, which is what we demo. A merchant address pays directly. An off-ramp
provider's deposit address plus a reference pays a local fiat bill — that one needs a
licensed partner, which is a compliance relationship rather than an integration, so we did
not fake one. It needs no contract change: setAgent repoints the destination.
```

---

## Final

- [ ] Repo **public**
- [ ] Video uploaded, 2–4 min, ≥720p
- [ ] 3 partner prizes selected, each with explanation + feedback
- [ ] Images uploaded
- [ ] Submission option: **Finalist + Partner Prizes**
- [ ] Submitted, not left as draft — then screenshot the confirmation
