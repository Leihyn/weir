"use client";
import { createPublicClient, http, formatUnits } from "viem";
import { BASE, RPC_URL, AAVE_POOL, WEIR, RAY } from "./config";
import { weirAbi, aavePoolAbi, erc20Abi } from "./abi";

export const publicClient = createPublicClient({ chain: BASE, transport: http(RPC_URL) });

export type Endowment = {
  id: bigint;
  owner: `0x${string}`;
  agent: `0x${string}`;
  asset: `0x${string}`;
  principal: bigint;
  lastIndex: bigint;
  minPayout: bigint;
  totalPaid: bigint;
  withheld: bigint;
  minInterval: bigint;
  lastHarvest: bigint;
  active: boolean;
};

export async function readIndex(asset: `0x${string}`): Promise<bigint> {
  return publicClient.readContract({
    address: AAVE_POOL,
    abi: aavePoolAbi,
    functionName: "getReserveNormalizedIncome",
    args: [asset],
  }) as Promise<bigint>;
}

export async function readEndowment(id: bigint): Promise<Endowment> {
  const r = (await publicClient.readContract({
    address: WEIR,
    abi: weirAbi,
    functionName: "endowments",
    args: [id],
  })) as readonly unknown[];
  return {
    id,
    owner: r[0] as `0x${string}`,
    agent: r[1] as `0x${string}`,
    asset: r[2] as `0x${string}`,
    principal: r[3] as bigint,
    lastIndex: r[4] as bigint,
    minPayout: r[5] as bigint,
    totalPaid: r[6] as bigint,
    withheld: r[7] as bigint,
    minInterval: r[8] as bigint,
    lastHarvest: r[9] as bigint,
    active: r[10] as boolean,
  };
}

export async function listEndowments(): Promise<Endowment[]> {
  if (!WEIR) return [];
  const next = (await publicClient.readContract({
    address: WEIR, abi: weirAbi, functionName: "nextId",
  })) as bigint;
  const ids = Array.from({ length: Number(next) - 1 }, (_, i) => BigInt(i + 1));
  return Promise.all(ids.map(readEndowment));
}

export async function readBalance(token: `0x${string}`, who: `0x${string}`) {
  return publicClient.readContract({
    address: token, abi: erc20Abi, functionName: "balanceOf", args: [who],
  }) as Promise<bigint>;
}

/**
 * The releasable amount, computed client-side with exactly the contract's
 * arithmetic so the UI never shows a number the chain would disagree with.
 *   gross   = P * (i1 - i0) / i0
 *   reserve = i1 / RAY + 1
 */
export function releasable(e: Endowment, i1: bigint): bigint {
  if (i1 <= e.lastIndex) return 0n;
  const gross = (e.principal * (i1 - e.lastIndex)) / e.lastIndex;
  const reserve = i1 / RAY + 1n;
  return gross > reserve ? gross - reserve : 0n;
}

export function fmt(v: bigint, decimals: number, places = 6) {
  const s = formatUnits(v, decimals);
  const [a, b = ""] = s.split(".");
  return `${a}.${b.padEnd(places, "0").slice(0, places)}`;
}
