# Weir — submission narrative

Derived from what actually wins. Finalist taglines from ETHOnline 2025, Cannes 2026 and
HackMoney 2026 share three traits: they name the category first, they end on a **hard
negative guarantee** (something falsifiable that cannot happen), and they run 10-16 words.
Finalist descriptions run 120-180 words.

The closest model is **maki** (Cannes 2026 finalist): *"AI agent for onchain DeFi. Keys
locked in hardware, unreachable by the model."* Its description is a rhythm of constraints,
one per sentence. Weir has the same shape, with principal in place of keys.

---

## Tagline

**Primary:**
> Endowment wallets for AI agents. Compromise the agent and it still cannot touch the principal.

**Alternates:**
> Endowment wallets for AI agents. The agent spends the yield; the principal is unreachable.

> Fund an AI agent once. It spends the yield forever and can never reach the principal.

---

## Description (~170 words)

```
Weir gives an AI agent an endowment instead of an allowance.

An owner commits principal to Aave once. From then on the agent is paid only what
the index produces, and three things are true by construction rather than by
policy. The agent never chooses an amount: harvest() derives it from Aave's
liquidity index as accrued = P x (i1 - i0) / i0, so there is no amount parameter
to abuse. It never chooses a destination: that comes from storage. It cannot
reach the principal, because after withdrawing the accrual the remaining balance
is P again.

Because a caller has nothing to choose and nothing to gain, harvest is
permissionless. No keeper, no relayer, no liveness dependency on us. The agent
can call it and pay itself.

Uniswap converts a WETH endowment's yield into spendable USDC, with the minimum
output floored by Aave's own oracle so passing minOut = 0 cannot sandwich it. The
Graph indexes every release, and an MCP server answers the question an endowed
agent actually needs: not "what is my balance" but "what can I spend forever?"

Live on Base Sepolia. The agent has paid itself. The principal is unchanged.
```


---

## What the destination can be *(design rationale, not roadmap)*

Weir does not pay bills. It releases USDC to a **destination address**, and the owner sets
that address. That is the entire extensibility surface, and it is why `open()` takes a
destination rather than hardcoding one.

An address can be:

- **an agent's spending wallet**, paying x402-gated services per call — this is what we demo
- **a merchant or contract address**, for direct on-chain payment
- **an off-ramp provider's deposit address with a payment reference**, which is how a local
  fiat bill actually gets paid

The third needs a licensed payment partner. That is a compliance relationship, not an
integration, so we did not fake one. But it needs **no contract change**: `setAgent`
repoints the destination, and the live endowment already proves the destination is a
parameter rather than a constant.

## Where this goes

The mechanism does not care what the recurring obligation is. For an agent it is inference,
RPC and metered data. For a person it is electricity, school fees, a subscription. The
**cap** matters most in the agent case, because agents get compromised. The **perpetuity**
matters most in the human case, because bills outlive salaries. Same primitive, two reasons.

Dollar-denominated principal with spendable yield is worth more where local savings are
negative in real terms, which is most of the world. The last mile to fiat is a commodity
with many providers. The part that did not exist is **a release schedule an agent cannot
outrun**, and that is the part we built.

---

## One-sentence pitch (verify Facet 5.1)

> Weir lets an agent's owner fund it once, so the agent can spend the yield forever and can
> never touch the principal, because the released amount is computed from Aave's liquidity
> index rather than chosen by whoever calls the contract.

---

## Why the threat-model framing, not the income framing

The old pitch was "agents need perpetual income." It is weak, and our own preflight audit
scored the problem statement 2/3 for exactly this reason: **nobody is observably losing
agents to budget exhaustion.** It is an anticipated problem, and judges feel that.

The cap framing is present-tense and live: agents holding wallets get compromised, and every
existing spending limit is a policy someone can edit — a session key that drains, an
allowance that can be raised, a config line in a service. Weir's limit is arithmetic in a
contract the agent cannot modify.

It also repairs our worst number. At Aave's rate a $1,000 endowment throws off about
$0.10/day. Under the income framing that is embarrassing. Under the cap framing **a small
unstealable allowance is the product**, and the modest yield stops needing an apology.

---

## Evidence to cite (all verified, none estimated)

| Claim | Proof |
|---|---|
| Live on Base Sepolia | [`0xE8b6f6C5cF6dB470c3a3Fe18a1977e55aC0Eb645`](https://sepolia.basescan.org/address/0xE8b6f6C5cF6dB470c3a3Fe18a1977e55aC0Eb645), verified `exact_match` on Sourcify |
| The agent paid itself | tx [`0xeb03555c…`](https://sepolia.basescan.org/tx/0xeb03555c77939a47e728ef5337dc11abd83028597e06e31163dddc6d3cf22830), released 0.016172 USDC |
| Principal untouched | `solvency()` after harvest: committed `250000000000`, held `250000000222` |
| A third party cannot redirect a harvest | `test_permissionlessHarvestCannotBeRedirected`: a stranger calls, the agent is paid, the caller gets zero |
| Principal never leaks | `test_solvencyNeverLeaksAcrossManyHarvests`: 48 harvests, 2 endowments, full principal returned |
| Uniswap leg works | 10 WETH endowment, 180 days, 0.08638 WETH accrued, **218.698043 USDC** paid, within 2 cents of oracle |
| The Graph is live | subgraph synced, `hasIndexingErrors: false`, serving the real endowment and harvest |
| The agent reasons over it | `weir_sustainable_budget` → `PERPETUAL. A burn of 5/day is 51.9% of income.` |
| Tests | 10/10 offline unit+fuzz, 12/13 fork against live Aave |

## Things to say plainly rather than hide

- The contracts are **unaudited**. Written during a hackathon.
- Weir depends on Aave. If Aave pauses or the reserve is illiquid, the endowment is frozen.
- Surplus above `principal + withheld` is not claimable; there is no sweep, by design.
- The yield is small. That is the point, not a limitation.
