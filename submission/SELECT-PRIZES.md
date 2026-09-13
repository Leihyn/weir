# Select prizes — answers to paste

Form section: Hacker Dashboard → Project → **Select prizes**.

All answers are continuous prose with no hard line breaks, so pasting gives clean paragraphs.

---

## Track

> Building from Scratch

*Weir was started during the event. The repo's first commit is 2026-09-12 and there are 24
commits with real incremental history, which is what the "version control" project rule asks
for. Continuity Track would be a false claim and would move us into a different prize pool.*

---

## Submission type

> Top 10 Finalist & Partner Prizes

**Know what this commits you to.** Round 1 is an async review by judges. Projects that pass go
to **Live Judging on Monday 14 September at 12:00 pm EDT** — that is 17:00 BST, the day after
submission. If you cannot be present and present live, pick *Partner Prizes only* instead,
because being absent from a session you opted into is worse than never opting in.

Round 1 is judged on video presentation and quality, live demo quality, and proper use of git
commit history. We are in reasonable shape on all three: a 2:38 human-narrated video, a live
app that reads real chain state, and 24 incremental commits.

---

## Partner prizes — three selected

Maximum is three. We are applying to **The Graph, Privy, Uniswap Foundation**.

### 1 · The Graph — $15,000

**How are you using this Protocol / API?**

> Weir indexes every endowment and every release into a subgraph on Subgraph Studio, and then
> uses it to answer the one question an endowed AI agent actually needs answered. Balance is
> the wrong question here and is actively misleading, because an endowment's principal is
> visible on-chain but permanently unspendable. The right question is "what can I spend
> forever", and that is a function of realized rate over indexed release history, not of any
> single balance read. Our MCP server queries the subgraph and returns a sustainable daily,
> monthly and yearly budget plus a PERPETUAL or NOT SURVIVABLE verdict against a proposed burn
> rate. Live output for our deployed endowment: principal 250,000 at a realized 1.406% gives
> 9.626996 USDC/day, and a 5/day burn is 51.9% of income, so the verdict is PERPETUAL. Without
> an index there is no realized rate, and without a realized rate the agent cannot know whether
> its own spending is survivable.

**Link to the line of code**

> https://github.com/Leihyn/weir/blob/main/subgraph/src/weir.ts#L63
>
> Also `mcp/src/index.ts#L103` (the `weir_sustainable_budget` tool) and `mcp/src/graph.ts`
> (the queries). Live endpoint: `https://api.studio.thegraph.com/query/1760272/weir/v0.0.1`

**Ease of use (1–10)**

> 8

**Additional feedback for the sponsor**

> Subgraph Studio was the smoothest part of this build, and the deploy-to-live loop is genuinely
> fast. One sharp edge cost us real time: an event parameter typed `uint64` in Solidity arrives
> in an AssemblyScript mapping as a `BigInt`, not an `i32`, and calling `BigInt.fromI32()` on it
> crashes `graph codegen` with no line number and no file reference. The failure gives you
> nothing to search for. A type mismatch in a generated binding is the one place where a
> pointer to the offending handler would save an hour, and generated code is exactly where you
> have the information to give one. Second, smaller: the docs lead with entity modelling, but
> the first thing most people hit is the mapping type system, and a short "Solidity type → AS
> type" table near the top of the mappings page would pre-empt the above.

---

### 2 · Privy — $5,000

**How are you using this Protocol / API?**

> Privy is how an owner signs in and commits principal. Weir's opening flow is deliberately a
> self-service financial product rather than a crypto tool: the owner signs in with email,
> picks an asset and an amount, names the agent's spending wallet, and commits. Privy carries
> the sign-in and the embedded wallet so that flow does not begin with "install a browser
> extension". Deliberately, it is not the only way in — we fall back to any injected wallet,
> because gating the entire write path on a single vendor's key turns one missing environment
> variable into a dead demo, and a judge opening the page should never see a broken button.

**Link to the line of code**

> https://github.com/Leihyn/weir/blob/main/app/components/Providers.tsx#L19
>
> Also `app/components/OpenEndowment.tsx#L4` (the sign-in and commit flow) and
> `app/lib/connect.ts` (the injected-wallet fallback).

**Ease of use (1–10)**

> 7

**Additional feedback for the sponsor**

> Integration itself was quick. The failure we hit was a configuration one with a poor error
> path: requesting a login method that is not enabled on the app fails at runtime with "Login
> with Google not allowed" rather than at config time, and the message names the method without
> saying that the fix is in the dashboard rather than in the code. Since `loginMethods` is
> static in the provider config, this is checkable when the provider mounts — a dev-mode warning
> listing requested versus enabled methods would turn a confusing runtime failure into an
> obvious one. Related: allowed origins are easy to forget on first deploy, and the resulting
> failure looks like a code bug rather than a dashboard setting. A one-line dev warning when the
> current origin is not on the allowlist would pay for itself.

---

### 3 · Uniswap Foundation — $5,000

**How are you using this Protocol / API?**

> An endowment may be held in any asset, but agents' bills are denominated in USDC, so
> `harvestAndSwap()` routes the accrued yield of a WETH endowment through SwapRouter02 into the
> USDC the bills are actually paid in. The interesting part is keeping that swap permissionless.
> Weir's `harvest()` needs no keeper because the amount comes from Aave's index and the
> destination from contract storage, so a caller has nothing to choose and nothing to gain.
> Adding a swap reintroduced exactly one attackable parameter, `amountOutMinimum`, and a caller
> could pass zero and sandwich the agent. We floor it against Aave's own Chainlink-backed
> oracle, so a caller may raise the slippage guard but never lower it — which adds no trust
> assumption we were not already carrying. Fork tested against live Uniswap on Base: a 10 WETH
> endowment accrued 0.08638 WETH over 180 days and paid 218.698043 USDC, within two cents of
> oracle.

**Link to the line of code**

> https://github.com/Leihyn/weir/blob/main/contracts/src/Weir.sol#L252
>
> The oracle floor that makes it safe to leave permissionless is `_oracleFloor` at
> `contracts/src/Weir.sol#L370`, applied at `#L287`.

**Ease of use (1–10)**

> 6

**Additional feedback for the sponsor**

> Two things cost us time, both specific to contract integrators rather than SDK consumers.
> First, fee-tier selection is guesswork from inside a contract: there is no canonical on-chain
> "deepest tier for this pair" view, so every integrator hardcodes 500 and hopes, and silently
> executes worse if liquidity migrates. Second, `OracleLibrary` in v3-periphery is still pinned
> to 0.7.6, so a modern 0.8 integrator either vendors a fork of `TickMath` or, far more often,
> skips the price check entirely. That pragma gap is actively degrading integration quality
> across the ecosystem: the safe path is the inconvenient one. We ended up flooring against
> Aave's oracle purely because we already depended on Aave — a 0.8-compatible TWAP helper would
> have saved the detour and is the single highest-leverage thing you could ship for this class
> of integrator. Full write-up with file and line references:
> https://github.com/Leihyn/weir/blob/main/FEEDBACK.md

---

## Which other partners' technologies have you used?

Select only what is genuinely in the repo. Do not tick a partner to pad the list — "imported
but not actually used" is the standard way teams lose partner prizes, and the repo is public.

- **Chainlink** — only if the option exists, and note the nuance: we consume Chainlink price
  data indirectly, through Aave's oracle (`IAaveOracle`), not by integrating Chainlink feeds
  directly. If the form gives no room for that distinction, leave it unticked rather than
  overclaim.

Nothing else applies.

---

## Why not Arc — and why that is the one worth regretting

See `ARC.md` in this folder for the full discussion. Short version: Arc's prizes fit Weir
better than any partner we did integrate, and we cannot claim it, because the mechanism is
built on Aave's liquidity index and Aave is not deployed on Arc.
