import type { Metadata } from "next";
import { Instrument_Serif, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/Providers";

/* Display serif against a precise mono: an endowment is a six-hundred-year-old
   instrument, and every other onchain dashboard is set in the same grotesk. */
const display = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const body = Archivo({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Weir — perpetual subscriptions for AI agents",
  description:
    "The yield pays the bills forever; the agent can never touch the principal. Built on Aave v3, Base.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased" style={{ fontFamily: "var(--font-body)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
