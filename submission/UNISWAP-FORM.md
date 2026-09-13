# Uniswap Developer Feedback Form — answers to paste

**Form:** https://developers.uniswap.org/hackathon-feedback

**Why this file exists:** Uniswap's prize requires "a completed submission to the Uniswap
Developer Feedback Form that includes the link to your FEEDBACK.md file." The form has **no
dedicated field for that link**, so it goes into two free-text fields below for safety.

> ⚠️ The `FEEDBACK.md` link 404s until `github.com/Leihyn/weir` is **public**. Flip the repo
> before submitting or Uniswap's reviewers hit a dead link and the prize is void.

---

## Short fields

| Field | Answer |
|---|---|
| First name *(required)* | `Onatola` |
| Last name | `Timilehin` |
| Email *(required)* | `alexmustapha11@gmail.com` |
| Telegram handle *(required)* | **TODO — only you have this** |
| Which hackathon did you participate in? *(required)* | `ETHOnline 2026` |
| Did you complete a project during the hackathon? *(required)* | `Yes` |
| Are you building an AI-powered or agentic project? *(required)* | **`Yes: a bot / agent that executes onchain actions`** |
| Were you able to successfully integrate Uniswap into your project? *(required)* | `Yes` |
| How long did it take to get your first successful integration working? *(required)* | Shortest bucket offered. `harvestAndSwap` went from interfaces written to a passing fork test in roughly an hour. |
| How helpful was the Uniswap documentation for your use case? *(1-5, required)* | `3` |
| How would you rate the support Uniswap provided overall? *(1-5, required)* | `3` (we did not use support, so neutral rather than a complaint) |
| Do you plan to continue building this project? *(required)* | `Yes` |
| What type of support did you use? *(required, checkboxes)* | `Technical docs`, `Code examples/templates` |
| Can we follow up with you about your feedback? *(required)* | Your call |
| Terms agreement *(required)* | Check it |

### Observed dropdown options

**"Are you building an AI-powered or agentic project?"** offers exactly these five:

1. **Yes: a bot / agent that executes onchain actions** ← **pick this**
2. Yes: an LLM-powered app that uses Uniswap as a tool
3. Yes: building AI tooling (Cursor/Claude Code plugins, MCP servers)
4. No: but I'm considering it
5. No: not in scope for what I'm building

Option 1 is the honest answer *for this form*. Weir does ship an MCP server (option 3), but
the MCP never touches Uniswap. The Uniswap integration is `harvestAndSwap`, which the agent
calls on-chain itself, so option 1 is the accurate match.

---

## What did you build? *(required)*

```
Weir — a perpetual endowment for autonomous agents on Base. An owner commits
principal to Aave once; the agent may spend only the yield and can never touch
principal, because the released amount is derived from Aave's liquidity index
rather than chosen by the caller. Uniswap SwapRouter02 converts a WETH
endowment's yield into spendable USDC via harvestAndSwap().
Full write-up: https://github.com/Leihyn/weir/blob/main/FEEDBACK.md
```

## What was the biggest blocker you faced? *(optional)*

```
Two things. First, fee-tier selection is guesswork from a contract's point of
view: there is no canonical on-chain "deepest tier for this pair" view, so every
integrator hardcodes 500 and hopes, and silently executes worse if liquidity
migrates. Second, OracleLibrary in v3-periphery is still pinned to 0.7.6, so
modern 0.8 integrators either vendor a fork of TickMath or, more often, skip the
price check entirely. That pragma gap is actively degrading integration quality.
```

## If applicable: what was the hardest part of building an agentic app on Uniswap? *(optional)*

```
Keeping the swap permissionless. Weir's harvest() has no keeper: the amount and
the destination both come from storage, so a caller has nothing to abuse. Adding
a swap reintroduced exactly one attackable parameter, amountOutMinimum, and there
is no first-party price reference a contract can floor it against. We used Aave's
oracle because we already depended on Aave. A 0.8-compatible TWAP helper would
have saved us the detour.
```

## What support was missing, or could have been better? *(optional)*

```
Guidance for contract integrators rather than frontend/SDK consumers, and a
0.8-compatible OracleLibrary or TWAP helper.
```

## Any additional feedback? *(optional — put the link here too)*

```
Full feedback with file and line references:
https://github.com/Leihyn/weir/blob/main/FEEDBACK.md

Verified on a Base fork: a 10 WETH endowment accrued 0.08638 WETH over 180 days
and paid the agent 218.698043 USDC through SwapRouter02, matching the oracle
price of $2,531.54 to within two cents.

With more time we would build a v4 hook. Endowment harvests are scheduled, small
and price-insensitive, which is close to ideal non-toxic flow for an LP.
```

---

## Checklist

- [ ] Repo flipped **public**
- [ ] `FEEDBACK.md` link opens in an incognito window
- [ ] Telegram handle filled in
- [ ] Form submitted
- [ ] Tell Claude it's done so the verify state can be updated
