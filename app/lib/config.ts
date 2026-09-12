import { base, baseSepolia } from "viem/chains";

/** All addresses verified live 12 Sep 2026 by direct eth_call. */
const CHAINS = {
  8453: {
    chain: base,
    name: "Base",
    aavePool: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    uniRouter: "0x2626664c2603336E57B271c5C0b26F421741e481",
    rpc: "https://mainnet.base.org",
    explorer: "https://basescan.org",
    assets: [
      { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, label: "USD Coin" },
      { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18, label: "Wrapped Ether" },
    ],
    faucet: null as string | null,
  },
  84532: {
    chain: baseSepolia,
    name: "Base Sepolia",
    aavePool: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27",
    uniRouter: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
    rpc: "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
    assets: [
      { symbol: "USDC", address: "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f", decimals: 6, label: "Test USD Coin" },
      { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18, label: "Wrapped Ether" },
    ],
    // permissionless: mint(address token, address to, uint256 amount)
    faucet: "0xD9145b5F45Ad4519c7ACcD6E0A4A82e83bB8A6Dc" as string | null,
  },
} as const;

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 84532) as 8453 | 84532;
export const NETWORK = CHAINS[CHAIN_ID];
export const BASE = NETWORK.chain;
export const AAVE_POOL = NETWORK.aavePool as `0x${string}`;
export const UNI_ROUTER = NETWORK.uniRouter as `0x${string}`;
export const EXPLORER = NETWORK.explorer;
export const ASSETS = NETWORK.assets;
export const USDC = NETWORK.assets[0].address as `0x${string}`;
export const WETH = NETWORK.assets[1].address as `0x${string}`;
export const FAUCET = NETWORK.faucet as `0x${string}` | null;

export const WEIR = (process.env.NEXT_PUBLIC_WEIR_ADDRESS ?? "") as `0x${string}`;
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? NETWORK.rpc;
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
export const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL ?? "";

export const RAY = 10n ** 27n;

export function assetByAddress(a: string) {
  return ASSETS.find((x) => x.address.toLowerCase() === a.toLowerCase());
}
