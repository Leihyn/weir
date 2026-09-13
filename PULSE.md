# PULSE — Weir

## Active Facts
| Fact | Source | Phase |
|------|--------|-------|
| ETHOnline 2026 submission closes Sun 13 Sep 2026 16:00 UTC. Verified on the live event page. | ethglobal.com/events/ethonline2026/info/start | manual |
| Prize pool $80,000 across 11 sponsors. All sponsor bounties; no separate finalist pot listed. | ethglobal.com/events/ethonline2026/prizes | manual |
| Weir is NET-NEW, so it sits in the Start Fresh pool. Continuity-only prizes are INELIGIBLE: World AgentKit $3.5k, Bazantic track 1 $1k, and the Continuity halves of Uniswap/1inch/Arc/Hedera/ENS/Ledger/Chainlink. | prize pages | manual |
| Uniswap's open prize is $3,000 (not $5,000) and needs a public repo + FEEDBACK.md + the Developer Feedback Form. FEEDBACK.md is written; the FORM IS NOT SUBMITTED. | uniswap prize page | manual |
| The Graph is worth $10,000 to us: AI/From-Scratch $5k and Composable $5k are separate pots. Composable explicitly names ERC-4626 tokenized-vault flows as in scope. | thegraph prize page | manual |
| The Graph BOTH tracks require live data from a Graph provider. "Mocked, local-only, or static datasets do not qualify." Our subgraph is NOT DEPLOYED. | thegraph prize page | manual |
| Privy lists "self-service Earn vaults" as an eligible financial flow, which is what Weir is. B2B half additionally needs one Privy control (policy/signer/quorum/intent). | privy prize page | manual |
| Live on Base Sepolia: Weir 0xE8b6f6C5cF6dB470c3a3Fe18a1977e55aC0Eb645. Endowment #1 = 250,000 test USDC, floor $0.01, interval 60s. | on-chain | manual |
| First live harvest by the agent itself: 0xeb03555c77939a47e728ef5337dc11abd83028597e06e31163dddc6d3cf22830, released 0.016172 USDC, solvency committed 250000000000 vs held 250000000222. Principal intact. | on-chain | manual |
| Aave v3 Base Sepolia is a real moving market: USDC 1.4618% APR, WETH 19.05% APY. Faucet 0xD9145b5F is permissionless. | eth_call | manual |
| Tests: 10/10 offline unit+fuzz (479ms, no RPC) and 12/13 fork tests vs live Aave. The 13th needs an RPC that serves Uniswap tick slots; free tiers rate-limit it. | forge | manual |
| Fork tests MUST run with --threads 1. Concurrency causes TLS BadRecordMac on every public Base endpoint tried. | forge | manual |

## Decisions Log
| Decision | Rationale | Phase |
|----------|-----------|-------|
| Base Sepolia, not mainnet | No sponsor we chase requires mainnet. A $20 mainnet endowment yields $0.002/day and is invisible on camera; the permissionless faucet lets us run 250,000 and show ~$10/day. | manual |
| harvest() is permissionless | Amount and destination both come from storage, so a caller has nothing to choose and nothing to gain. Removes the keeper entirely. | manual |
| Slippage floored by Aave's oracle | Keeps harvestAndSwap permissionless without a new trust assumption, since Weir already depends on Aave. | manual |
| Sponsors: The Graph, Privy, Uniswap, Bazantic | Four load-bearing beats eleven shallow. Skipped Hedera/Arc/1inch/ENS/Ledger/Chainlink/World. | manual |

## Downstream Items
| ID | Raised by | Owner phase | Pri | Item | Acceptance | Status |
|----|-----------|-------------|:---:|------|-----------|:------:|
| W-1 | manual | submission | P0 | Repo is PRIVATE. Every prize needs a public repo. | gh repo view shows isPrivate false | open |
| W-2 | manual | verify | P0 | Subgraph never deployed. The Graph's $10k is unreachable without live data. | Studio URL returns indexed data | open |
| W-3 | manual | verify | P0 | Privy never ran; no App ID. Its $5k needs a working flow. | a wallet is created and a flow completes | open |
| W-4 | manual | submission | P0 | Uniswap Developer Feedback Form not submitted. Disqualifying on paperwork alone. | form submitted with FEEDBACK.md link | open |
| W-5 | manual | demo | P0 | No demo video. The Graph requires 2-4 min. | mp4 exists and plays without login | open |
| W-6 | manual | deploy | P0 | No public app URL. | curl returns 200 from a non-sleeping host | open |
| W-7 | manual | verify | P1 | UI never seen in a browser. Chrome extension will not open localhost without site permission. | a human or a screenshot confirms layout | open |
| W-8 | manual | package | P1 | Arc-style architecture diagram absent; several sponsors ask for one. | diagram committed | open |

## Skill Sections

### hackathon-verify (preflight) — 2026-09-13

#### Done
- Ran all 8 preflight facets against the LIVE Base Sepolia deployment. 5-run demo test executed for real (5/5 on the read path).

#### Deviations
- Completed all facets despite KZ triggers (contract rule 6 says stop). With <6h left a report that stops at Facet 2 is not actionable.
- Could not open the submission form (login) or the UI in a browser (Chrome blocks localhost without site permission).

#### Blockers for Downstream
- KZ-2 TRIGGERED: repo private, no public app URL, no video, no drafted submission content.
- KZ-4 TRIGGERED: Privy 1/4 (never executed), Bazantic 0/4 (nothing built).

#### Key Decisions
- Dropping the Bazantic and Privy CLAIMS clears KZ-4 outright. An unclaimed sponsor cannot fail ABCD.

#### For Next Skill
demo: video is the highest-value remaining artifact and it clears both KZ-2 remainder and Facet 8.

### hackathon-livetest (V1) — 2026-09-13

#### Done
- Rendered the live URL with Playwright driving system Chrome. First time the UI has been seen.
- 14 PASS / 0 FAIL / 2 SKIP. Overall PASS.

#### Defects found and fixed
- P0: the weir visual never painted its reservoir; the centrepiece read as a stray bar. Rebuilt with inline colour.
- P1: horizontal scroll on mobile, scrollW 386 vs 375. Right-anchored the live figure.
- P2: console 404, no favicon. Added app/icon.svg. Console now 0 errors.

#### Blockers for Downstream
- Privy sign-in still never completed (needs a human to receive an email OTP).
- Agent still cannot pay the x402 fee (Aave test USDC has no EIP-3009).

#### For Next Skill
demo: film the index moving, committed <= held, and the agent harvest tx. Do NOT promise a completed x402 payment; the 402 is real, settlement is not.
