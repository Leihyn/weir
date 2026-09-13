import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "x402-next";
import { createPublicClient, http, formatUnits, isAddress } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * Weir's sustainable-budget oracle, sold per call over x402.
 *
 * The point of the endowment is that an agent can spend forever without touching
 * principal. The question it therefore needs answered is not "what is my balance"
 * but "what can I afford indefinitely". That is a metered data service, so it is
 * priced per query rather than per seat.
 *
 * It closes the loop: the agent pays for this answer with yield the endowment
 * produced. Recurring cost, recurring income, no principal touched.
 */

const RPC = process.env.NEXT_PUBLIC_RPC_URL ?? "https://sepolia.base.org";
const WEIR = (process.env.NEXT_PUBLIC_WEIR_ADDRESS ?? "") as `0x${string}`;
const SUBGRAPH = process.env.NEXT_PUBLIC_SUBGRAPH_URL ?? "";
const AAVE_POOL = "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27" as const;
const SECONDS_PER_YEAR = 31_536_000;
const RAY = 10n ** 27n;

const client = createPublicClient({ chain: baseSepolia, transport: http(RPC) });

const weirAbi = [
  { type: "function", name: "idsOfAgent", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256[]" }] },
  {
    type: "function", name: "endowments", stateMutability: "view", inputs: [{ type: "uint256" }],
    outputs: [
      { type: "address" }, { type: "address" }, { type: "address" }, { type: "uint256" },
      { type: "uint256" }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" },
      { type: "uint64" }, { type: "uint64" }, { type: "bool" },
    ],
  },
  { type: "function", name: "accrued", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
] as const;

const aaveAbi = [
  { type: "function", name: "getReserveNormalizedIncome", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

async function handler(req: NextRequest): Promise<NextResponse<unknown>> {
  const agent = req.nextUrl.searchParams.get("agent");
  const burn = Number(req.nextUrl.searchParams.get("burnPerDay") ?? "0");

  if (!agent || !isAddress(agent)) {
    return NextResponse.json({ error: "pass ?agent=0x…" }, { status: 400 });
  }
  if (!WEIR) return NextResponse.json({ error: "oracle not configured" }, { status: 503 });

  const ids = (await client.readContract({
    address: WEIR, abi: weirAbi, functionName: "idsOfAgent", args: [agent],
  })) as readonly bigint[];

  let principalTotal = 0n;
  let pendingTotal = 0n;
  const positions: { id: string; principal: string; accrued: string }[] = [];

  for (const id of ids) {
    const e = (await client.readContract({
      address: WEIR, abi: weirAbi, functionName: "endowments", args: [id],
    })) as readonly unknown[];
    if (!(e[10] as boolean)) continue;
    const principal = e[3] as bigint;
    const acc = (await client.readContract({
      address: WEIR, abi: weirAbi, functionName: "accrued", args: [id],
    })) as bigint;
    principalTotal += principal;
    pendingTotal += acc;
    positions.push({ id: id.toString(), principal: formatUnits(principal, 6), accrued: formatUnits(acc, 6) });
  }

  if (positions.length === 0) {
    return NextResponse.json(
      { agent, endowments: 0, sustainablePerDay: "0", verdict: "NOT ENDOWED", note: "no active endowment funds this agent" },
      { status: 200 }
    );
  }

  // live supply rate straight from Aave, not a cached figure
  const raw = await client.request({
    method: "eth_call",
    params: [{ to: AAVE_POOL, data: ("0x35ea6a75" + "000000000000000000000000" + "ba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f".toLowerCase()) as `0x${string}` }, "latest"],
  } as never) as string;
  const words = raw.slice(2).match(/.{64}/g) ?? [];
  const rateRay = words[2] ? BigInt("0x" + words[2]) : 0n;
  const apr = Number(rateRay) / Number(RAY);
  const apy = apr > 0 ? (1 + apr / SECONDS_PER_YEAR) ** SECONDS_PER_YEAR - 1 : 0;

  const principal = Number(formatUnits(principalTotal, 6));
  const perDay = (principal * apy) / 365;

  return NextResponse.json({
    agent,
    endowments: positions.length,
    positions,
    principalCommitted: principal.toFixed(2),
    supplyApy: `${(apy * 100).toFixed(4)}%`,
    sustainablePerDay: perDay.toFixed(6),
    sustainablePerMonth: (perDay * 30).toFixed(4),
    releasableNow: formatUnits(pendingTotal, 6),
    ...(burn > 0 && {
      proposedBurnPerDay: burn,
      verdict: burn <= perDay ? "PERPETUAL" : "NOT SURVIVABLE",
      explanation:
        burn <= perDay
          ? `A burn of ${burn}/day is ${((burn / perDay) * 100).toFixed(1)}% of income. This agent never runs out.`
          : `A burn of ${burn}/day is ${(burn / perDay).toFixed(1)}x income. The endowment will not release it and principal cannot be reached.`,
    }),
    source: SUBGRAPH ? "aave + weir (subgraph indexed)" : "aave + weir (direct)",
  });
}

/**
 * Priced per call. payTo is the oracle operator; the facilitator is the public
 * x402.org one, which advertises base-sepolia (verified: GET /supported returns
 * `v1 exact base-sepolia`) and needs no API key.
 *
 * KNOWN GAP, stated rather than hidden: x402's `exact` scheme settles in Circle's
 * Base Sepolia USDC (0x036CbD53...), which requires EIP-3009
 * transferWithAuthorization. Aave's Base Sepolia test USDC (0xba50Cd2A...), which
 * is what the endowment actually pays out, does NOT implement EIP-3009 —
 * authorizationState() reverts on it. So on testnet the asset the endowment
 * produces and the asset the paywall accepts are two different tokens, and the
 * agent cannot complete the payment with its own yield.
 *
 * On mainnet this gap does not exist: Aave's Base USDC reserve IS Circle USDC, so
 * harvested yield is directly spendable here. The split is an artefact of testnet
 * token choices, not of the design.
 */
export const GET = withX402<unknown>(
  handler,
  (process.env.X402_PAY_TO ?? "0x890DA1c13da922e7dEF0CbF31eD402FD9475F9D8") as `0x${string}`,
  {
    price: "$0.001",
    network: "base-sepolia",
    config: {
      description: "Weir sustainable-budget oracle: what this agent can spend forever",
      mimeType: "application/json",
    },
  },
  { url: "https://x402.org/facilitator" }
);
