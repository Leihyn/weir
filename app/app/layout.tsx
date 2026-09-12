import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/Providers";

export const metadata: Metadata = {
  title: "Weir — an endowment your agent cannot outspend",
  description:
    "Fund an autonomous agent once. It spends only the yield; the principal is untouchable by arithmetic, not by policy. Built on Aave v3 on Base.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
