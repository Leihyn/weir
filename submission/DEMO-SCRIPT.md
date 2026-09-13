# Demo video script — Weir

**Hard rules from ETHOnline:** 2–4 minutes (under or over is auto-rejected), **≥720p**, no
speed-up, no phone recording, **no TTS or AI voiceover**. You narrate this yourself, live,
in one pass. Keep the intro under 20 seconds.

**Target: 3:05.** That leaves margin either side of the 2:00/4:00 walls.

**Setup before you hit record**
- Browser at `https://weir-khaki.vercel.app`, zoomed so text is legible at 720p
- A second tab on `https://sepolia.basescan.org/tx/0xeb03555c77939a47e728ef5337dc11abd83028597e06e31163dddc6d3cf22830`
- A terminal in `/Users/machine/Desktop/dev/weir/agent`, cleared
- Close Slack/Notifications. Quiet room, no echo.

---

## 0:00–0:18 — The problem (18s)

> "Your agent has a twelve-dollar-a-month API subscription. You fund it with five hundred
> dollars. In forty months it's dead — and so is whatever it was maintaining.
>
> Recurring costs don't stop. Budgets do."

**[Screen: the hero. Don't scroll yet. Let the headline sit.]**

---

## 0:18–0:45 — What Weir does (27s)

> "Weir endows the bill instead of funding the agent. You commit principal to Aave once. From
> then on the agent is paid only what the index adds — and it can never touch the principal.
>
> Not because we check. Because of how the number is computed."

**[Scroll slowly to the live index panel. Pause on the digits changing.]**

> "This is Aave's liquidity index, live on Base Sepolia. Every figure you're about to see is
> derived from it. Nothing here is seeded."

---

## 0:45–1:20 — The weir itself (35s)

**[Scroll to Endowment #1. Let the "spilling now" figure tick visibly.]**

> "Here's a real endowment. Two hundred and fifty thousand USDC, held back. The number on the
> right is what's spilled over the crest — it's climbing about a hundred and sixteen units a
> second, right now, as you watch.
>
> The agent can release that. It cannot release a unit more."

**[Point at the formula section briefly, or scroll to it.]**

> "The released amount is principal times the change in index over the starting index. There's
> no amount parameter. There's nothing to pass in and nothing to abuse."

---

## 1:20–1:50 — The proof (30s)

**[Scroll to the solvency panel. Hold on it.]**

> "And this is the proof, not the claim. Principal committed: two hundred and fifty thousand.
> aTokens actually held: two hundred and fifty thousand point eight nine.
>
> Committed is less than or equal to held, every block. If that ever inverted, the guarantee
> would be a lie — so we show it instead of asserting it."

---

## 1:50–2:20 — Permissionless (30s)

**[Scroll to the harvest button. Read the caption under it on screen.]**

> "Anyone can press this. I'm not the owner and I'm not the agent, and it doesn't matter —
> the amount comes from Aave's index, and the destination comes from contract storage.
>
> There's nothing for a caller to choose and nothing for a caller to gain. That's why this
> needs no keeper, no relayer, and no trust in us."

**[Switch to the Basescan tab.]**

> "This transaction is the agent paying itself. Sixteen thousandths of a dollar released,
> principal unchanged."

---

## 2:20–2:50 — The stack (30s)

**[Terminal: run the MCP query, or show the earlier output.]**

> "The agent asks the question it actually needs answered — not 'what's my balance', but
> 'what can I spend forever'. That's served from a subgraph indexing every release on The
> Graph, and it answers: perpetual, a five-dollar-a-day burn is fifty-two percent of income.
>
> Uniswap converts a WETH endowment's yield into the USDC bills are denominated in, with the
> minimum output floored by Aave's own oracle — so a caller can raise the slippage guard but
> never lower it."

---

## 2:50–3:05 — Close (15s)

> "Weir is live on Base Sepolia, the contract is verified, and the agent has already paid
> itself.
>
> An endowment your agent can't outspend — because the cap is arithmetic, not a policy it
> could edit."

**[End on the hero or the solvency panel.]**

---

## Do not say

- Do **not** claim the agent completed an x402 payment. The 402 is real; settlement isn't,
  because the endowment pays Aave test USDC and x402 settles Circle USDC.
- Do **not** call it audited.
- Do **not** imply a Spotify or biller integration exists.
- Do **not** say "mainnet" — this is Base Sepolia, deliberately, and saying so is fine.

## If you fluff a line

Stop, pause two seconds, and repeat the sentence from its start. Trim in the edit. Do not
speed the video up — that's an automatic re-submit.
