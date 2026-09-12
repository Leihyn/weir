"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { base } from "viem/chains";
import { PRIVY_APP_ID } from "../lib/config";

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient());

  // Without an app id the page still renders and reads chain state; only the
  // write path needs Privy. That keeps the demo inspectable for a reviewer.
  if (!PRIVY_APP_ID) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "wallet", "google"],
        defaultChain: base,
        supportedChains: [base],
        embeddedWallets: { createOnLogin: "users-without-wallets" },
        appearance: { theme: "dark", accentColor: "#2ee6c5", logo: undefined },
      }}
    >
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </PrivyProvider>
  );
}
