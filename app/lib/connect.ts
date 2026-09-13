"use client";
import { walletFrom } from "./wallet";
import type { WalletClient } from "viem";

/**
 * Returns a wallet client from whatever provider is available.
 *
 * Privy is preferred when configured, but it must not be the ONLY way in: if the
 * app ships without a Privy app id, a visitor with any injected wallet still needs
 * to be able to open an endowment and harvest. Gating the entire write path on one
 * vendor's key turns a missing environment variable into a dead demo.
 */
export type Connector = { label: string; get: () => Promise<WalletClient> };

function injected(): any | null {
  if (typeof window === "undefined") return null;
  const eth = (window as any).ethereum;
  return eth ?? null;
}

export function hasInjected(): boolean {
  return injected() !== null;
}

/** Privy wallets first, then any injected provider. */
export async function resolveWallet(privyWallets: any[]): Promise<WalletClient> {
  const p = privyWallets?.[0];
  if (p?.getEthereumProvider) return walletFrom(await p.getEthereumProvider());

  const eth = injected();
  if (!eth) {
    throw new Error(
      "No wallet available. Install a browser wallet, or set NEXT_PUBLIC_PRIVY_APP_ID to enable email sign-in."
    );
  }
  return walletFrom(eth);
}
