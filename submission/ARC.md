# Why Arc isn't in our partner list

A straight answer to a fair question, because Arc is the partner whose prizes fit Weir best,
and we are not applying for any of them.

## Arc's prizes, and how well they actually fit

Arc is Circle's purpose-built EVM L1 — stablecoin-native, USDC/EURC as gas, deterministic
finality. It carries $10,000 across six prizes. Three of them read like they were written for
this project:

**Best Agentic Economy with Nanopayments** — *"enable autonomous AI agents to transact with
each other using nanopayments... gas-free micropayments for API calls, data access, compute
resources, or services without human intervention."*

That is Weir's thesis restated. Our whole premise is an agent paying recurring API bills with
no human in the loop, and our agent has already paid itself on-chain.

**Best Smart Contracts on Arc with Advanced Stablecoin Logic** — *"conditional flows, onchain
automation, or multi-step settlement mechanisms."*

`harvest()` is exactly that: a release amount derived from an external index rather than chosen
by a caller, with a rounding reserve and a settle-before-mutate rule.

**Best Agentic Commerce App Powered by Real-World Assets on Arc** — *"agents use real-world
assets as productive capital... settled in USDC."*

An endowment is productive capital funding an agent, settled in USDC. Same sentence.

On fit alone, Arc beats two of the three partners we *are* applying for.

## So why not

**Weir's guarantee is built on Aave's liquidity index, and Aave is not deployed on Arc.**

That is the whole answer, and it is not a small obstacle. The product's one novel claim is that
the agent cannot overspend *because the released amount is arithmetic*:

```
accrued = P × (i₁ − i₀) / i₀
```

`i` is Aave's `getReserveNormalizedIncome`. It is monotonic, readable on-chain, and not chosen
by any caller — which is precisely why `harvest()` can be permissionless and needs no keeper.
Take Aave away and you need another monotonic on-chain index on Arc to replace it. Arc is new
enough that the lending markets which would expose one are not there yet.

Deploying to Arc without a yield source would mean shipping the shape of Weir with nothing
behind it: an endowment that never accrues, a harvest that always reverts, a claim with no
mechanism. That is the "imported but not actually used" failure that loses partner prizes on
inspection, and the repo is public, so it would be found.

## Could we have done it in the time?

No, and it is worth being precise rather than hand-wavy about why.

It is not a deploy problem — Arc is EVM-compatible and `forge create` would work. It is that
the mechanism needs a monotonic index to derive from. Replacing Aave means finding or writing a
yield source on Arc, re-deriving the rounding reserve against *its* rounding behaviour (our
current reserve exists specifically because Aave burns scaled units with `rayDiv` round-half-up
— a different venue rounds differently and the reserve would be wrong), and re-running the fork
tests against it. The 13 fork tests that give this project its credibility are pinned to a Base
block against live Aave; none of them transfer.

That is a day of work minimum, and it was never a day we had.

## The honest lesson

The miss was upstream of the build. Partner selection happened after the architecture was
settled on Aave, so the question we asked was "which partners does this design already touch"
rather than "which partner prizes are worth designing toward". Those produce different answers,
and the second one is the better question to ask on day one.

Had we asked it early, the serious option was a **dual deployment**: Aave on Base for the
mechanism we can prove, plus an Arc deployment using Circle's nanopayments rail for the
agent's outbound spending, which is the half of Weir that does not depend on Aave at all. The
agent's payment leg is genuinely chain-agnostic. Only the accrual leg is not. Splitting them
across two chains was always possible and we never considered it, because by the time we read
Arc's prizes the architecture was already fixed.

## What we are doing instead

Applying to the three partners whose tech is genuinely load-bearing in the repo — The Graph,
Privy, Uniswap — and saying nothing about Arc on the form. A partner prize application that a
judge can disprove by opening the repo costs more than the prize was worth.
