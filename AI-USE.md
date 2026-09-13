# AI tool use — disclosure

ETHOnline requires submissions to document where and how AI tools were used, which parts of
the code were generated or assisted, and to include planning artifacts if a spec-driven
workflow was used. This file is that disclosure. It errs toward over-reporting.

## Summary

**Weir was built in a single continuous session with Claude Code (Anthropic) as the
implementing agent, directed by the human team member.** Effectively all source code was
written by the AI. The direction, the product decisions, the design judgement, the
corrections, and every credential and funded key came from the human.

- **Team:** Onatola Timilehin (Leihyn), solo
- **AI tool:** Claude Code (Opus 5)
- **Commits:** 24, first 2026-09-12 10:12:00 +0100, last 2026-09-13 13:15:11 +0100
- **Workflow:** conversational, with pipeline skills invoked at specific points (below)

## What the AI wrote

Assume every file is AI-written unless listed otherwise. Specifically:

| Area | Files | AI role |
|---|---|---|
| Contracts | `contracts/src/Weir.sol`, `contracts/src/interfaces/*` | written entirely by AI |
| Tests | `contracts/test/Weir.fork.t.sol`, `Weir.unit.t.sol`, `test/mocks/Mocks.sol` | written entirely by AI |
| Scripts | `contracts/script/{Deploy,Fund,Networks}.s.sol` | written entirely by AI |
| Frontend | `app/app/*`, `app/components/*`, `app/lib/*` | written entirely by AI |
| Subgraph | `subgraph/schema.graphql`, `subgraph/src/weir.ts`, manifest | written entirely by AI |
| MCP server | `mcp/src/*` | written entirely by AI |
| Agent | `agent/src/index.ts` | written entirely by AI |
| x402 route | `app/app/api/budget/route.ts` | written entirely by AI |
| Docs | `README.md`, `FEEDBACK.md`, `NARRATIVE.md`, this file | written entirely by AI |

No code was copied from another project. Dependencies used as-is and disclosed: Aave v3
interfaces (re-declared minimally, not vendored), Uniswap `ISwapRouter02` (re-declared),
OpenZeppelin-style patterns written from scratch, forge-std, Next.js, viem, wagmi,
`@privy-io/react-auth`, `@graphprotocol/graph-cli`, `x402` / `x402-fetch` / `x402-next`,
`@modelcontextprotocol/sdk`.

## What the human contributed

This is the part the rules care about, so it is specific rather than flattering.

1. **The originating idea and the pivot.** The project began as a Solana concept for
   tokenized-stock dividends. The human directed the move to an EVM sibling, then to AI
   agents as the user.
2. **The narrative reframe.** The AI had positioned this as an income product. The human
   pushed the "agents paying bills / subscriptions" framing, which became the headline and
   is materially better; the AI's own preflight had scored the previous problem statement
   2/3 for being speculative.
3. **Design rejection.** The human looked at the deployed UI and rejected it outright. That
   directly caused the redesign, and the subsequent livetest found that the redesign's
   central visual was not rendering at all.
4. **Scope decisions.** Which partners to pursue, keeping Privy after the AI proposed
   dropping it, refusing to cut the x402 work when the AI proposed cutting it.
5. **Everything requiring a human.** Wallet funding, testnet gas, Privy app creation,
   The Graph Studio deploy key, repository ownership, and the demo video narration.
6. **Direction to use the verification tooling.** The human repeatedly pushed for the
   pipeline skills to be run, which produced the preflight audit and the livetest — the
   latter caught a P0 rendering defect that would otherwise have shipped.

## Planning artifacts included in this repository

Per the spec-driven-development rule, the planning and verification trail is committed
rather than discarded:

- `PULSE.md` — rolling facts, decisions and routed downstream items
- `submission/NARRATIVE.md` — positioning derived from analysis of past winning submissions
- `submission/UNISWAP-FORM.md` — prepared partner-feedback answers
- `VERIFY-REPORT.md` + `.verify-state.json` — pre-submission audit (44/100, 2 kill-zones, both since addressed)
- `LIVETEST-REPORT.md` + `.livetest-state.json` — live-deployment audit, 3 defects found and fixed
- `FEEDBACK.md` — Uniswap developer feedback
- Commit history: 24 commits with substantive messages recording what was tried, what broke and why

## Pipeline skills invoked

`hackathon-verify` (preflight), `hackathon-livetest` (V1), `frontend-design` (polish mode),
plus an ETHGlobal research skill used to analyse prior winning submissions. Their outputs are
the report files listed above.

## Bugs the AI introduced and later caught

Included because it is the honest picture of AI-assisted work, and because each was found by
running things rather than by reading them:

1. Aave burns scaled units with round-half-up, so withdrawing the exact accrual leaked a unit
   of principal per harvest. Caught by a fork test.
2. The withheld rounding reserve was stranded on close. Caught by the same test.
3. The mock Aave pool was silently insolvent: it raised the index without funding the
   interest, so it only failed once cumulative withdrawals exceeded deposits.
4. A `uint64` event parameter arrives as `BigInt`, not `i32`; calling `BigInt.fromI32` on it
   crashed the AssemblyScript compiler with no line number.
5. The agent hardcoded `chain: base`, so every write on Base Sepolia failed with
   "invalid chain id for signer". The agent could never have harvested.
6. `Fund.s.sol` read `msg.sender` before `vm.startBroadcast()`, which in a forge script is
   the default script sender, so it minted 250,000 test USDC to an address we do not control
   and still printed success.
7. Renaming design tokens left `text-muted` and `bg-flow-dim` referenced in two components.
   Tailwind emits nothing for an undefined token, so they would have shipped unstyled.
8. The redesigned weir visual never painted its reservoir. Caught by livetest rendering the
   live site with Playwright.
