#!/usr/bin/env node
/**
 * Weir MCP — lets an autonomous agent reason about its own endowment.
 *
 * The question an endowed agent actually needs answered is not "what is my
 * balance" but "what can I afford to spend forever". Balance is misleading here:
 * the principal is visible but unspendable. This server answers the real one,
 * deriving the realized rate from indexed harvest history in The Graph.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createPublicClient, http, formatUnits, encodeFunctionData, getAddress } from "viem";
import { base, baseSepolia } from "viem/chains";
import { endowmentsForAgent, harvestsForAgent, SUBGRAPH_URL } from "./graph.js";

const WEIR = (process.env.WEIR_ADDRESS ?? "") as `0x${string}`;
const RPC = process.env.WEIR_RPC_URL ?? "https://sepolia.base.org";
const CHAIN = Number(process.env.WEIR_CHAIN_ID ?? 84532) === 8453 ? base : baseSepolia;
const SECONDS_PER_YEAR = 31_536_000;
const RAY = 10n ** 27n;

const DECIMALS: Record<string, { symbol: string; decimals: number }> = {
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { symbol: "USDC", decimals: 6 },
  "0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f": { symbol: "USDC", decimals: 6 },
  "0x4200000000000000000000000000000000000006": { symbol: "WETH", decimals: 18 },
};
const meta = (a: string) => DECIMALS[a.toLowerCase()] ?? { symbol: "?", decimals: 18 };

const client = createPublicClient({ chain: CHAIN, transport: http(RPC) });

const weirAbi = [
  { type: "function", name: "accrued", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "harvestable", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "harvest", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
] as const;

const aaveAbi = [
  { type: "function", name: "getReserveNormalizedIncome", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
] as const;
const AAVE_POOL = (CHAIN.id === 8453
  ? "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5"
  : "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27") as `0x${string}`;

const server = new McpServer({ name: "weir", version: "0.1.0" });

function ok(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

/** Realized APY per asset, derived from indexed harvest history. */
async function realizedApy(agent: string): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  try {
    const hs = await harvestsForAgent(agent, 200);
    // each harvest records fromIndex/toIndex and its timestamp; the index ratio
    // over the elapsed window is the realized rate for that asset
    const byAsset = new Map<string, { growth: number; seconds: number }>();
    const ends = await endowmentsForAgent(agent);
    const assetOf = new Map(ends.map((e) => [e.id, e.asset.toLowerCase()]));
    for (const h of hs) {
      const from = BigInt(h.fromIndex), to = BigInt(h.toIndex);
      if (to <= from) continue;
      const key = assetOf.get(h.id.split("-")[0]) ?? "unknown";
      const prev = byAsset.get(key) ?? { growth: 0, seconds: 0 };
      prev.growth += Number(to - from) / Number(from);
      byAsset.set(key, prev);
    }
    // window length per asset from first to last harvest
    if (hs.length >= 2) {
      const span = Number(BigInt(hs[0].timestamp) - BigInt(hs[hs.length - 1].timestamp));
      for (const [k, v] of byAsset) {
        if (span > 0) out.set(k, ((1 + v.growth / span) ** SECONDS_PER_YEAR - 1) * 100);
      }
    }
  } catch { /* no history yet; fall back to a live index sample below */ }
  return out;
}

server.tool(
  "weir_endowments",
  "List the Weir endowments funding a given agent address, with committed principal and yield paid to date. Reads The Graph.",
  { agent: z.string().describe("agent address, 0x…") },
  async ({ agent }) => {
    const list = await endowmentsForAgent(getAddress(agent));
    if (!list.length) return ok(`No endowments fund ${agent}.`);
    const lines = list.map((e) => {
      const m = meta(e.asset);
      return [
        `#${e.id} ${m.symbol}${e.active ? "" : " (closed)"}`,
        `  principal committed : ${formatUnits(BigInt(e.principal), m.decimals)} ${m.symbol}  (unspendable)`,
        `  yield paid to date  : ${formatUnits(BigInt(e.totalPaid), m.decimals)} ${m.symbol}  across ${e.harvestCount} harvests`,
        `  payout floor        : ${formatUnits(BigInt(e.minPayout), m.decimals)} ${m.symbol}`,
        `  min interval        : ${e.minInterval}s`,
        `  owner               : ${e.owner}`,
      ].join("\n");
    });
    return ok(lines.join("\n\n"));
  }
);

server.tool(
  "weir_sustainable_budget",
  "The key question for an endowed agent: what can it spend indefinitely? Returns the sustainable daily and monthly budget derived from committed principal and the realized rate, plus a verdict on whether a proposed burn rate is survivable forever.",
  {
    agent: z.string().describe("agent address, 0x…"),
    burnPerDayUsd: z.number().optional().describe("proposed spend per day, to test against the budget"),
  },
  async ({ agent, burnPerDayUsd }) => {
    const list = (await endowmentsForAgent(getAddress(agent))).filter((e) => e.active);
    if (!list.length) return ok(`No active endowments fund ${agent}. Sustainable budget is 0.`);

    const apys = await realizedApy(getAddress(agent));
    const rows: string[] = [];
    let dailyTotal = 0;

    for (const e of list) {
      const m = meta(e.asset);
      const principal = Number(formatUnits(BigInt(e.principal), m.decimals));
      let apy = apys.get(e.asset.toLowerCase());
      if (apy === undefined) {
        // no harvest history yet: sample the live Aave index twice
        const i1 = (await client.readContract({
          address: AAVE_POOL, abi: aaveAbi, functionName: "getReserveNormalizedIncome",
          args: [e.asset as `0x${string}`],
        })) as bigint;
        const openIdx = BigInt(e.openIndex);
        const elapsed = Math.max(1, Math.floor(Date.now() / 1000) - Number(e.openedAt));
        const growth = i1 > openIdx ? Number(i1 - openIdx) / Number(openIdx) : 0;
        apy = growth > 0 ? ((1 + growth / elapsed) ** SECONDS_PER_YEAR - 1) * 100 : 0;
      }
      const daily = (principal * (apy / 100)) / 365;
      dailyTotal += daily;
      rows.push(
        `#${e.id} ${m.symbol}: principal ${principal.toLocaleString()} @ ${apy.toFixed(3)}% -> ${daily.toFixed(6)} ${m.symbol}/day`
      );
    }

    const parts = [
      `Sustainable budget for ${agent}`,
      ...rows,
      "",
      `TOTAL: ${dailyTotal.toFixed(6)} /day   ${(dailyTotal * 30).toFixed(4)} /month   ${(dailyTotal * 365).toFixed(2)} /year`,
      `Principal is never spendable. This figure is what the endowment throws off and can be spent forever.`,
    ];

    if (burnPerDayUsd !== undefined) {
      const ratio = dailyTotal > 0 ? burnPerDayUsd / dailyTotal : Infinity;
      parts.push(
        "",
        burnPerDayUsd <= dailyTotal
          ? `VERDICT: PERPETUAL. A burn of ${burnPerDayUsd}/day is ${(ratio * 100).toFixed(1)}% of income. This agent never runs out.`
          : `VERDICT: NOT SURVIVABLE. A burn of ${burnPerDayUsd}/day is ${ratio.toFixed(1)}x income. The endowment will not release it; principal cannot be reached. Reduce burn to ${dailyTotal.toFixed(6)}/day, or ask the owner to top up to ${(burnPerDayUsd / (dailyTotal || 1e-9)).toFixed(1)}x the current principal.`
      );
    }
    return ok(parts.join("\n"));
  }
);

server.tool(
  "weir_pending",
  "Yield currently releasable for each endowment funding an agent, read live from the contract, and whether a harvest would succeed right now.",
  { agent: z.string() },
  async ({ agent }) => {
    if (!WEIR) return ok("WEIR_ADDRESS is not set.");
    const list = (await endowmentsForAgent(getAddress(agent))).filter((e) => e.active);
    const out: string[] = [];
    for (const e of list) {
      const m = meta(e.asset);
      const [amt, ready] = await Promise.all([
        client.readContract({ address: WEIR, abi: weirAbi, functionName: "accrued", args: [BigInt(e.id)] }) as Promise<bigint>,
        client.readContract({ address: WEIR, abi: weirAbi, functionName: "harvestable", args: [BigInt(e.id)] }) as Promise<boolean>,
      ]);
      out.push(`#${e.id} ${m.symbol}: ${formatUnits(amt, m.decimals)} releasable — ${ready ? "HARVESTABLE NOW" : "blocked by floor or interval"}`);
    }
    return ok(out.length ? out.join("\n") : `No active endowments for ${agent}.`);
  }
);

server.tool(
  "weir_payment_history",
  "Every yield payment an agent has received, from The Graph, including who called harvest. Useful for proving that third parties, not the agent's owner, triggered payment.",
  { agent: z.string(), limit: z.number().optional() },
  async ({ agent, limit }) => {
    const hs = await harvestsForAgent(getAddress(agent), limit ?? 25);
    if (!hs.length) return ok("No payments yet.");
    return ok(
      hs.map((h) =>
        `${new Date(Number(h.timestamp) * 1000).toISOString()}  ${h.amount}  called by ${h.caller}  tx ${h.tx}`
      ).join("\n")
    );
  }
);

server.tool(
  "weir_self_harvest_calldata",
  "Harvest is permissionless, so an agent can pay itself. Returns the transaction an agent should send to release its own accrued yield. It cannot choose the amount or the destination; both come from contract storage.",
  { endowmentId: z.string() },
  async ({ endowmentId }) => {
    if (!WEIR) return ok("WEIR_ADDRESS is not set.");
    const data = encodeFunctionData({ abi: weirAbi, functionName: "harvest", args: [BigInt(endowmentId)] });
    return ok([`to:    ${WEIR}`, `data:  ${data}`, `value: 0`, `chain: ${CHAIN.name} (${CHAIN.id})`].join("\n"));
  }
);

server.tool(
  "weir_config",
  "Report how this server is wired, so an agent can tell whether its figures come from The Graph or from a direct chain read.",
  {},
  async () => ok([
    `subgraph: ${SUBGRAPH_URL || "(not set — budget falls back to live index sampling)"}`,
    `contract: ${WEIR || "(not set)"}`,
    `chain:    ${CHAIN.name} (${CHAIN.id})`,
    `rpc:      ${RPC}`,
  ].join("\n"))
);

await server.connect(new StdioServerTransport());
