"use client";
import { createWalletClient, custom, type WalletClient } from "viem";
import { BASE } from "./config";

/** Builds a viem wallet client from a Privy (or injected) EIP-1193 provider. */
export async function walletFrom(provider: any): Promise<WalletClient> {
  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: `0x${BASE.id.toString(16)}` }],
  }).catch(() => { /* already on Base, or wallet refuses; the tx will surface it */ });
  const [account] = await provider.request({ method: "eth_requestAccounts" });
  return createWalletClient({ account, chain: BASE, transport: custom(provider) });
}
