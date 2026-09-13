# VERIFY REPORT — PREFLIGHT MODE

```
=======================================
HACKATHON VERIFY — PREFLIGHT REPORT
Project: Weir
Mode: preflight
Time to deadline: ~5.9 hours (2026-09-13 16:00 UTC)
Run date: 2026-09-13
Kill-Zone Escalation: CRITICAL BLOCKED (2 kill-zones)
=======================================
```

No prior milestone checks. Proceeding directly to preflight facets.
Running outside the pipeline (no `.conductor-state.json`) — prerequisite checks skipped.

**Deviation from the execution contract, declared:** Rule 6 says stop at the first
kill-zone. I completed all eight facets anyway, because with under six hours left the
user needs the full triage list, and a report that stops at Facet 2 is not actionable.

---

## KILL-ZONES

```
KZ-1 Demo Reliability:         CLEAR (reduced confidence — see F1)
KZ-2 Submission Completeness:  TRIGGERED
KZ-3 Contract Wrong Network:   CLEAR
KZ-4 Sponsor Integration:      TRIGGERED (Privy 1/4, Bazantic 0/4)
KZ-5 Eligibility Compliance:   CLEAR
```

**OVERALL STATUS: BLOCKED**

**WINNER-READINESS: 44/100** (would be DO NOT SUBMIT even without the kill-zones)

```
FACET SCORES
  1. Demo Reliability         15/25
  2. Submission Completeness   0/20   <- KZ-2
  3. Sponsor Integration       4/20   <- KZ-4
  4. Technical Correctness    10/15
  5. Narrative Quality         8/10
  6. Eligibility Compliance    4/ 5
  7. Code Quality              3/ 3
  8. Presentation Assets       0/ 2

WINNING PATTERN CHECKS (advisory)
  WP-1 Landing Page:    WARN  — server render shows "No endowments yet"; the list is client-fetched
  WP-2 Test Ratio:      FAIL  — 0.17 (3 test files / 18 source files)
  WP-3 Multi-Track:     WARN  — 1 of 4 claimed sponsors has a real integration
  WP-4 Submission Dir:  FAIL  — submission/ does not exist
  WP-5 README Story:    PASS  — Problem -> Solution -> How -> Trust -> Status -> Troubleshooting
```

---

## Facet Details

### Facet 1 — Demo Reliability: 15/25 (KZ-1 CLEAR, reduced confidence)

Five-run test, executed against the live app and live Base Sepolia:

```
run 1: HTTP 200  accrued=28136  harvestable=true  PASS
run 2: HTTP 200  accrued=28579  harvestable=true  PASS
run 3: HTTP 200  accrued=28801  harvestable=true  PASS
run 4: HTTP 200  accrued=29023  harvestable=true  PASS
run 5: HTTP 200  accrued=29466  harvestable=true  PASS
RESULT: 5/5, accrual strictly increasing
```

- 1.2 Console errors: 0 in the dev log
- 1.3 Network config: `NEXT_PUBLIC_CHAIN_ID=84532`, on-chain `chain-id` 84532. Match.
- 1.4 Wallet connection: **CANNOT TEST.** No Privy App ID, so the write path has never
  executed in a browser. -3
- 1.5 Pre-seeded data: endowment #1 exists on chain, so a fresh judge sees real data. Pass.
- 1.6 Demo video: does not exist. Flagged.

**Why 15 and not 25.** The five runs prove the READ path: the app serves and the live index
accrues. They do not prove the path a judge actually walks, which is connect wallet ->
approve -> open -> harvest. Chrome's extension will not open localhost without site
permission, so the UI has never been seen by anyone, and the wallet flow cannot be
exercised at all. Per Error Recovery, reduced confidence is recorded rather than a full
base score. The harvest itself IS proven on chain (tx `0xeb03555c…`), which is why this is
not a KZ-1 trigger.

### Facet 2 — Submission Completeness: 0/20 — **KZ-2 TRIGGERED**

- 2.1 Submission form: never opened.
- 2.2 Required fields: no drafted content anywhere.
- 2.3 URLs from incognito: GitHub repo is **PRIVATE** (a judge gets 404). No public app URL.
  No video URL.
- 2.4 Team: solo, no invitations needed.
- 2.5 Prize tracks: not selected.
- 2.6 `submission/` directory: does not exist.

### Facet 3 — Sponsor Integration: 4/20 — **KZ-4 TRIGGERED**

Four sponsors claimed, so 5 points each.

| Sponsor | A import | B call | C value | D requirement | Score |
|---|:---:|:---:|:---:|:---:|---|
| Uniswap | PASS | PASS | PASS | **FAIL** | 3/5 (3/4 = 60%) |
| The Graph | PASS | **FAIL** | PASS | **FAIL** | 1/5 (2/4, Severity 1) |
| Privy | PASS | **FAIL** | partial | **FAIL** | **0/5 — KZ-4** |
| Bazantic | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **0/5 — KZ-4** |

- **Uniswap:** `ISwapRouter02` imported in `Weir.sol`; one real `router.exactInputSingle`
  call site; the router is an immutable constructor arg so removing it breaks compilation;
  it is the only path by which a non-USDC endowment pays its agent in USDC. D fails on
  paperwork only: repo is private and the Developer Feedback Form is not submitted.
- **The Graph:** manifest, mappings and compiled WASM all exist, and the MCP server reads
  harvest history from it. But it is **not deployed to Studio**, and both Graph tracks state
  "Mocked, local-only, or static datasets do not qualify." B and D fail on that alone.
- **Privy:** imported in two components, but with no App ID it has **never executed** and
  zero Privy wallets have ever been created. Its prize requires at least one wallet and one
  completed flow. 1/4.
- **Bazantic:** one reference in the repo, in a README line. No account, no x402/MPP
  gateway, no recipe. 0/4.

### Facet 4 — Technical Correctness: 10/15

- Contracts compile; 10/10 offline tests pass; 12/13 fork tests pass (the 13th needs an RPC
  that serves Uniswap tick slots). 3/4
- Deployed to Base Sepolia, **not verified on Basescan**. 1/3
- Frontend production build clean, typecheck clean. 3/3
- No `localhost`, `127.0.0.1`, `31337`, or placeholder values in shipped source. 3/3
- **RPC is free-tier public `sepolia.base.org`.** The checklist explicitly requires a
  production-grade endpoint, and this session already exhausted two free tiers. 0/2

### Facet 5 — Narrative Quality: 8/10

One-sentence pitch fills cleanly: *"Weir lets an agent's owner fund it once so the agent
spends only the yield and can never touch the principal, because the released amount is
derived from Aave's liquidity index rather than chosen by the caller."* 3/3

Problem statement is specific but its **magnitude is not established**: there is no evidence
that real agents are dying of budget exhaustion today. 2/3

Why blockchain: the cap is arithmetic in a contract the agent cannot edit, where a bank
would use an editable policy. 2/2

Sponsor fit: Aave and Uniswap essential and explained; The Graph, Privy and Bazantic thin
or absent. 1/2

### Facet 6 — Eligibility Compliance: 4/5 (KZ-5 CLEAR)

- Team size: solo, within the 5-person cap. 1
- Originality: first commit 2026-09-12, inside the Sep 4-16 window. 1
- Platform registration: registered. 1
- Track rules and deadline confirmed against the official page. 1
- **LICENSE file MISSING.** README claims MIT and ETHOnline requires open source. 0

### Facet 7 — Code Quality: 3/3

No secrets committed (keystore and env files gitignored; only well-known public anvil test
keys appear in tracked files). README is 256 lines with live addresses, setup, trust model
and troubleshooting. Build clean.

### Facet 8 — Presentation Assets: 0/2

No demo video. No cover image. The Graph requires a 2-4 minute video; several others
require one under 5 minutes.

---

## Action Items

### BLOCKED — must fix before submitting

1. **KZ-2:** flip the repo public, deploy the app to a public URL, record a 2-4 minute
   video, and draft the submission fields.
2. **KZ-4 Bazantic:** **drop the claim.** Nothing is built. A claimed sponsor at 0/4 is a
   kill-zone; an unclaimed sponsor is not. This is a two-minute edit that removes half of
   KZ-4.
3. **KZ-4 Privy:** either supply the App ID and complete one real flow, or drop the claim.
   Same logic.

### TRIAGE ORDER, ~5.9 hours remaining

```
1. Flip repo public + deploy app publicly          ~30 min   clears most of KZ-2
2. Drop Bazantic and (if no App ID) Privy claims    ~5 min   clears KZ-4 entirely
3. Deploy subgraph to Studio                        ~45 min   moves The Graph 2/4 -> 4/4, worth $10k
4. Record demo video                                ~90 min   clears KZ-2 remainder + F8
5. Add LICENSE (MIT)                                 ~2 min   +1 F6
6. Submit Uniswap Developer Feedback Form            ~5 min   moves Uniswap 3/4 -> 4/4
7. Verify contract on Basescan                      ~15 min   +2 F4
8. Draft submission fields + submission/ dir        ~30 min   clears KZ-2
```

Items 1, 2, 4 and 8 are the difference between eligible and invisible. Item 3 is the single
largest prize on the board. Items 5 and 6 are cheap and currently disqualifying.

### SUBMIT AS-IS — acceptable

Contract correctness, the core mechanic, the README, and the narrative. The endowment is
live, accruing, and the agent has paid itself from it on chain with principal intact.

---

## ONE-SENTENCE PITCH

"Weir lets an agent's owner fund it once, so the agent can spend the yield forever and can
never touch the principal, because the released amount is computed from Aave's liquidity
index rather than chosen by whoever calls the contract."

## DEMO FLOW (confirmed working)

1. Open the app: the live Aave liquidity index is ticking, derived from chain state.
2. Endowment #1 shows 250,000 USDC held back and the accrued yield climbing in real time.
3. The agent calls `harvest` itself and is paid. Principal is unchanged.
   Proof: [`0xeb03555c…`](https://sepolia.basescan.org/tx/0xeb03555c77939a47e728ef5337dc11abd83028597e06e31163dddc6d3cf22830)

=======================================
RECOMMENDATION: BLOCKED — 2 kill-zones. Fix items 1, 2 and 4 first.
=======================================
