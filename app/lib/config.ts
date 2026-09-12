import { base } from "viem/chains";

/** Verified live on Base mainnet, 12 Sep 2026. */
export const BASE = base;
export const AAVE_POOL = "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5" as const;
export const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
export const A_USDC = "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB" as const;
export const WETH = "0x4200000000000000000000000000000000000006" as const;
export const A_WETH = "0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7" as const;

export const WEIR = (process.env.NEXT_PUBLIC_WEIR_ADDRESS ?? "") as `0x${string}`;
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://mainnet.base.org";
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
export const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL ?? "";

export const RAY = 10n ** 27n;

export const ASSETS = [
  { symbol: "USDC", address: USDC, aToken: A_USDC, decimals: 6, label: "USD Coin" },
  { symbol: "WETH", address: WETH, aToken: A_WETH, decimals: 18, label: "Wrapped Ether" },
] as const;

export function assetByAddress(a: string) {
  return ASSETS.find((x) => x.address.toLowerCase() === a.toLowerCase());
}
