/**
 * A Weir-endowed agent.
 *
 * The loop a perpetual agent actually runs:
 *   1. ask the endowment what it may spend           (never "what is my balance")
 *   2. release its own yield, since harvest is permissionless
 *   3. buy only what the endowment throws off
 *
 * It cannot overspend even if this code is buggy or hostile: the contract will
 * not release more than the index has produced, and principal is unreachable
 * from here. The agent is free to be dumb.
 */
import { createPublicClient, createWalletClient, http, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";
import { wrapFetchWithPayment, decodeXPaymentResponse } from "x402-fetch";
import { appendFileSync } from "node:fs";

const RPC = process.env.WEIR_RPC_URL ?? "https://sepolia.base.org";
/** Hardcoding a chain here is how you get "invalid chain id for signer". */
const CHAIN = Number(process.env.WEIR_CHAIN_ID ?? 84532) === 8453 ? base : baseSepolia;
const WEIR = (process.env.WEIR_ADDRESS ?? "") as `0x${string}`;
const AGENT_KEY = process.env.AGENT_PRIVATE_KEY as `0x${string}` | undefined;
const PAID_URL = process.env.X402_URL ?? "";
const USDC = (process.env.WEIR_PAYOUT_TOKEN
  ?? (CHAIN.id === 8453
    ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    : "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f")) as `0x${string}`;
const LEDGER = process.env.WEIR_LEDGER ?? "./agent-ledger.jsonl";

const weirAbi = [
  { type: "function", name: "accrued", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "harvestable", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "harvest", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "idsOfAgent", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256[]" }] },
  {
    type: "function", name: "endowments", stateMutability: "view", inputs: [{ type: "uint256" }],
    outputs: [
      { type: "address" }, { type: "address" }, { type: "address" }, { type: "uint256" },
      { type: "uint256" }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" },
      { type: "uint64" }, { type: "uint64" }, { type: "bool" },
    ],
  },
] as const;
const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

const pub = createPublicClient({ chain: CHAIN, transport: http(RPC) });

function log(event: string, data: Record<string, unknown>) {
  const row = { t: new Date().toISOString(), event, ...data };
  console.log(`[weir-agent] ${event}`, JSON.stringify(data));
  try { appendFileSync(LEDGER, JSON.stringify(row) + "\n"); } catch { /* ledger is best effort */ }
}

async function main() {
  if (!AGENT_KEY) throw new Error("Set AGENT_PRIVATE_KEY (the agent's spending wallet)");
  if (!WEIR) throw new Error("Set WEIR_ADDRESS");

  const account = privateKeyToAccount(AGENT_KEY);
  const wallet = createWalletClient({ account, chain: CHAIN, transport: http(RPC) });
  log("wake", { agent: account.address, chain: CHAIN.name, chainId: CHAIN.id });

  // 1. what funds me?
  const ids = (await pub.readContract({
    address: WEIR, abi: weirAbi, functionName: "idsOfAgent", args: [account.address],
  })) as readonly bigint[];

  if (ids.length === 0) {
    log("no_endowment", { note: "nobody has endowed this agent; it has no income and should not spend" });
    return;
  }

  // 2. release my own yield. harvest is permissionless, so I can pay myself,
  //    and I still cannot choose the amount or the destination.
  let released = 0n;
  for (const id of ids) {
    const ready = (await pub.readContract({
      address: WEIR, abi: weirAbi, functionName: "harvestable", args: [id],
    })) as boolean;
    const pending = (await pub.readContract({
      address: WEIR, abi: weirAbi, functionName: "accrued", args: [id],
    })) as bigint;

    if (!ready) { log("skip_harvest", { id: id.toString(), pending: pending.toString(), reason: "below floor or inside min interval" }); continue; }

    const hash = await wallet.writeContract({ address: WEIR, abi: weirAbi, functionName: "harvest", args: [id] });
    await pub.waitForTransactionReceipt({ hash });
    released += pending;
    log("self_harvested", { id: id.toString(), amount: formatUnits(pending, 6), tx: hash });
  }

  // 3. what can I actually spend?
  const balance = (await pub.readContract({
    address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [account.address],
  })) as bigint;
  log("budget", { usdc: formatUnits(balance, 6), releasedThisRun: formatUnits(released, 6) });

  if (!PAID_URL) { log("idle", { note: "set X402_URL to give this agent something to buy" }); return; }

  // 4. buy, paying per call with money the endowment produced
  const paidFetch = wrapFetchWithPayment(fetch, wallet as never);
  try {
    const res = await paidFetch(PAID_URL, { method: "GET" });
    const header = res.headers.get("x-payment-response");
    const receipt = header ? decodeXPaymentResponse(header) : null;
    const body = (await res.text()).slice(0, 400);
    log("purchased", { url: PAID_URL, status: res.status, receipt, preview: body });
  } catch (err) {
    // The honest failure mode: the endowment has not yet produced enough to
    // afford this call. That is the constraint working, not a bug.
    log("cannot_afford_or_failed", { url: PAID_URL, error: String(err).slice(0, 300), usdc: formatUnits(balance, 6) });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
