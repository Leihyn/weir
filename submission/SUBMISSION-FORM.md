# Weir — ETHOnline 2026 submission

Answers to paste into the Hacker Dashboard → Project form, in the order the form asks for
them. Each field shows the label, then the exact text to paste, then a short note only where
the choice needs defending.

Every answer below is written as continuous prose with no hard line breaks, so pasting it
into a form field gives clean paragraphs rather than ragged mid-sentence wrapping.

**Before you start:** the repo must already be public. It is — `github.com/Leihyn/weir`,
verified resolving anonymously.

---

## 1 · Project details

### Project name

> Weir

### Category

> Artificial Intelligence

*Not DeFi. As DeFi this reads as "another Aave yield harvester", which costs us Originality
and WOW — two of the five judging criteria. The novel claim, a spending cap the agent cannot
raise, only exists in the agent framing. Technicality defends itself on the tests either way.*

### Emoji

> 💧

*Water held back, only the overflow leaving. Doubles as liquidity. Alternate: ♾️*

### Demonstration link

> https://weir-khaki.vercel.app

### Short description

*100 character limit. This is 89.*

> Endow an AI agent's bills. It spends the yield forever and can never touch the principal.

*Alternate at 80 characters: "Perpetual subscriptions for AI agents. It spends yield forever, never principal."*

### Description

*Minimum 280 characters. This is roughly 1,300.*

> Your agent has a $12/month API subscription. You fund it with $500. In forty months it is dead, and so is whatever it was maintaining. Recurring costs do not stop. Budgets do.
>
> Every funded agent today is mortal by construction. You hand it a lump sum and a spending cap, and that cap is a policy: a session key that drains, an allowance someone can raise, a config line in a service you hope nobody edits. The agent spends principal because principal is the only thing it has.
>
> Weir endows the bill instead of funding the agent. An owner commits principal to Aave once. From then on the agent is paid only what the index produces, and three things are true by construction rather than by policy. The agent never chooses an amount: harvest() derives it from Aave's liquidity index as accrued = P x (i1 - i0) / i0, so there is no amount parameter to abuse. It never chooses a destination; that comes from storage. And it cannot reach the principal, because after withdrawing the accrual the remaining balance is P again.
>
> Because a caller has nothing to choose and nothing to gain, harvest is permissionless. No keeper, no relayer, no liveness dependency on us. The agent can call it and pay itself, and it has: 0.016172 USDC released on Base Sepolia with the principal unchanged.
>
> The owner can close the endowment and reclaim 100% of the principal at any time.
>
> At Aave's live mainnet USDC rate, $4,045 endows a $12/month subscription forever. The yield is not small. The bill is small, and the principal is simply whatever that bill requires.

### How it's made

*Minimum 280 characters. This is roughly 2,200.*

> An Aave aToken is a scaled-balance token: your balance is a raw balance times a global index. That is the same object as a Token-2022 scaled-UI multiplier on Solana, and it is the one property Weir needs. For principal P committed at index i0, the releasable amount at i1 is P x (i1 - i0) / i0. After withdrawing exactly that, the remaining balance is P again, so principal is preserved by construction rather than by a check someone could forget.
>
> Stack: Solidity 0.8.35 and Foundry for the contract; Next.js 15, viem and Privy for the app; a subgraph on The Graph's Subgraph Studio; an MCP server for the agent; a TypeScript agent with an x402 client.
>
> Two things were genuinely hacky, and they are the parts we are most pleased with.
>
> First, keeping the swap permissionless. harvest() has no keeper because the amount comes from the index and the recipient from storage, so a caller has nothing to abuse. Adding Uniswap reintroduced exactly one attackable parameter, amountOutMinimum, and a caller could pass zero and sandwich the agent. We floored it against Aave's own Chainlink-backed oracle, so a caller may RAISE the slippage guard but never lower it. That adds no trust assumption we did not already carry, since Weir already depends on Aave.
>
> Second, a rounding reserve. Aave burns scaled units with rayDiv round-half-up, so withdrawing the exact accrual burns up to one extra scaled unit and leaves the balance a hair BELOW principal. Left alone that leaks a unit per harvest and, with several endowments sharing one aToken position, the shortfall compounds until the last owner to close is short. Weir withholds index/RAY + 1 units per harvest, tracks the total, and pays it to the agent on close, so nothing leaks and nothing is stranded. A fork test runs 48 harvests across two endowments and asserts both.
>
> Partner tech, and how it earned its place. The Graph indexes every endowment and release, and our MCP server answers the question an endowed agent actually needs — not "what is my balance", which is actively misleading here because principal is visible but unspendable, but "what can I spend forever". It returns a PERPETUAL or NOT SURVIVABLE verdict against a proposed burn rate. Uniswap converts a WETH endowment's yield into the USDC bills are denominated in; fork tested, 10 WETH accrued 0.08638 WETH over 180 days and paid 218.698043 USDC, within two cents of oracle. Privy is how an owner signs in and commits principal, as a self-service Earn vault flow — deliberately not the only way in, because we fall back to any injected wallet, and gating the whole write path on one vendor's key turns a missing env var into a dead demo.
>
> Testing: 23 tests. 10 offline unit and fuzz tests run in 477ms with no RPC; 13 fork tests run against live Aave v3 on Base at a pinned block, no mocks. The fork tests found four real bugs that reading the code did not, including the rounding leak above.
>
> Built with Claude Code as the implementing agent. Full disclosure of what was AI-written, what the human contributed, and the eight bugs the AI introduced and later caught is in AI-USE.md in the repo.

### GitHub repositories

> Leihyn/weir

---

## 2 · Images

All three fields are required. Files are in `submission/images/`.

**Logo** — square, 512×512

> `submission/images/weir-logo-512.png`

*A weir seen head-on: water held to a fixed crest, spilling through the notch cut in it. The
notch is the ownable part — it is what makes the silhouette read as a weir rather than a
generic block, and it survives down to 32px in a gallery of hundreds.*

**Cover image** — 16:9, 1280×720

> `submission/images/weir-cover-1280x720.png`

**Screenshots** — minimum 3 required. Upload all five, in this order. Each one carries a
single claim on its own, because a judge scrolling a gallery sees it without the video.

1. `images/01-live-app-index-and-solvency.png` — the live app: the Aave index every figure is
   derived from, and the solvency proof `committed ≤ held` sitting under it
2. `images/02-endowment-principal-held.png` — the endowment itself: 250,000 held back and
   never releasable, the accrual spilling over it, and the release anyone may press
3. `images/03-agent-paid-itself.png` — the agent harvesting its own yield on Base Sepolia,
   with the transaction and the ledger line, principal unchanged
4. `images/04-what-can-i-spend-forever.png` — the MCP answering the question an endowed agent
   actually needs: verdict PERPETUAL, live output from the subgraph
5. `images/05-how-it-fits-together.png` — the architecture, with each partner on the edge it
   genuinely touches

## 3 · Tech stack

> Solidity, Foundry, Aave v3, Uniswap v3, The Graph (Subgraph Studio), Next.js, TypeScript, viem, Privy, Model Context Protocol (MCP), x402, Base Sepolia, Vercel

---

## 4 · Select prizes

Maximum three. Per-partner "how you used it" and feedback text is in `PARTNER-PRIZES.md`.

1. **The Graph** — covers AI Tooling/Use Case and Composable
2. **Uniswap Foundation** — Best Uniswap Stack Contribution
3. **Privy** — Best financial flow, and Best B2B financial product

---

## 5 · Video

2–4 minutes, at least 720p, narrated by a human. The rendered file is
`video/out/weir-demo.mp4` — 2:38, 1920×1080. Script and timings are in `DEMO-SCRIPT.md`.

Upload it and paste the URL here.

---

## 6 · Future

> The immediate next build is a Uniswap v3 LP-fee adapter, and it would make the guarantee stronger rather than just broader. Uniswap tracks fee growth separately from liquidity: feeGrowthInside0LastX128 only ever increases, and collect() on the NonfungiblePositionManager cannot touch liquidity at all, because reducing a position requires decreaseLiquidity(). So Uniswap already enforces the income-versus-corpus split inside the protocol, and an LP endowment's guarantee would rest on Uniswap's own function boundary rather than on our arithmetic.
>
> Beyond that, an IIndexSource interface covering Aave, Compound and every ERC-4626 vault is roughly 50 lines and costs the guarantee nothing, since all of them expose a monotonic readable index.
>
> What we will not do is extend this to market-priced assets. Harvesting price movement is selling capital, not spending income: every rally forces a sale, nothing rebuys, and the position ratchets down. The path there is an endowment spending rule, X% of a trailing average, as large university endowments actually do, but that trades a provable guarantee for a policy, and a high-water mark only restores the guarantee by paying nothing through drawdowns. Hard guarantee or smooth payout, not both. We chose the hard guarantee.
>
> On destinations: Weir releases USDC to an address the owner sets. An agent's spending wallet pays x402 services, which is what we demo. A merchant address pays directly. An off-ramp provider's deposit address plus a reference pays a local fiat bill — that one needs a licensed partner, which is a compliance relationship rather than an integration, so we did not fake one. It needs no contract change: setAgent repoints the destination.

---

## 7 · Before you submit

- [ ] Repo public — **done**, verified resolving anonymously
- [ ] Video uploaded, 2–4 min, at least 720p
- [ ] Images uploaded
- [ ] 3 partner prizes selected, each with its explanation and feedback
- [ ] Submission option set to **Finalist + Partner Prizes**
- [ ] Status is **submitted**, not draft — then screenshot the confirmation
