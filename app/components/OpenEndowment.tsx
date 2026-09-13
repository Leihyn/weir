"use client";
import { useState } from "react";
import { parseUnits } from "viem";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { resolveWallet, hasInjected } from "../lib/connect";
import { publicClient } from "../lib/chain";
import { weirAbi, erc20Abi } from "../lib/abi";
import { ASSETS, WEIR, PRIVY_APP_ID } from "../lib/config";

export function OpenEndowment({ onDone }: { onDone: () => void }) {
  const privy = PRIVY_APP_ID ? usePrivy() : null;
  const wallets = PRIVY_APP_ID ? useWallets() : { wallets: [] as any[] };

  const [symbol, setSymbol] = useState<string>("USDC");
  const [amount, setAmount] = useState("20");
  const [agent, setAgent] = useState("");
  const [floor, setFloor] = useState("0.01");
  const [interval, setInterval_] = useState("3600");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const asset = ASSETS.find((a) => a.symbol === symbol)!;

  async function submit() {
    setBusy(true); setStatus(null);
    try {
      if (!WEIR) throw new Error("Weir address not configured yet");
      if (!/^0x[0-9a-fA-F]{40}$/.test(agent)) throw new Error("Enter a valid agent address");

      const wc = await resolveWallet(wallets.wallets ?? []);
      const owner = wc.account!.address;

      const amt = parseUnits(amount, asset.decimals);
      const min = parseUnits(floor, asset.decimals);

      const allowance = (await publicClient.readContract({
        address: asset.address, abi: erc20Abi, functionName: "allowance",
        args: [owner, WEIR],
      })) as bigint;

      if (allowance < amt) {
        setStatus("approving…");
        const h = await wc.writeContract({
          address: asset.address, abi: erc20Abi, functionName: "approve",
          args: [WEIR, amt], chain: undefined, account: wc.account!,
        });
        await publicClient.waitForTransactionReceipt({ hash: h });
      }

      setStatus("committing principal…");
      const hash = await wc.writeContract({
        address: WEIR, abi: weirAbi, functionName: "open",
        args: [asset.address, amt, agent as `0x${string}`, min, BigInt(interval)],
        chain: undefined, account: wc.account!,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus("endowment open");
      onDone();
    } catch (err: any) {
      setStatus(err?.shortMessage ?? err?.message ?? "failed");
    } finally {
      setBusy(false);
    }
  }

  const connected = (wallets.wallets?.length ?? 0) > 0;

  return (
    <div className="panel p-5">
      <h2 className="text-sm font-medium">Endow an agent</h2>
      <p className="mt-1 text-xs text-muted">
        Principal is supplied to Aave and never leaves. Your agent receives only what the
        index adds. You can close and take all of it back at any time.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Labeled label="asset">
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={input}>
            {ASSETS.map((a) => <option key={a.symbol} value={a.symbol}>{a.symbol}</option>)}
          </select>
        </Labeled>
        <Labeled label={`principal (${symbol})`}>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} className={input} inputMode="decimal" />
        </Labeled>
        <Labeled label="agent address (spending wallet)" full>
          <input value={agent} onChange={(e) => setAgent(e.target.value)} placeholder="0x…" className={`${input} num`} />
        </Labeled>
        <Labeled label={`payout floor (${symbol}) · stops dust harvests`}>
          <input value={floor} onChange={(e) => setFloor(e.target.value)} className={input} inputMode="decimal" />
        </Labeled>
        <Labeled label="min interval (seconds)">
          <input value={interval} onChange={(e) => setInterval_(e.target.value)} className={input} inputMode="numeric" />
        </Labeled>
      </div>

      {PRIVY_APP_ID && !connected ? (
        <button onClick={() => privy?.login()} className={btn}>
          Sign in to endow
        </button>
      ) : (
        <button onClick={submit} disabled={busy} className={btn}>
          {busy ? (status ?? "working…") : "Commit principal"}
        </button>
      )}
      {!PRIVY_APP_ID && (
        <p className="mt-2 text-[11px] text-muted">
          Using your browser wallet on Base Sepolia. Email sign-in activates when a Privy app
          id is configured.
        </p>
      )}
      {status && !busy && <p className="mt-2 text-xs text-muted">{status}</p>}
    </div>
  );
}

const input =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-flow";
const btn =
  "mt-4 w-full rounded-lg border border-flow-dim bg-flow-dim/20 py-2.5 text-sm text-flow hover:bg-flow-dim/35 transition disabled:opacity-40";

function Labeled({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={full ? "sm:col-span-2" : ""}>
      <div className="text-[10px] uppercase tracking-wider text-muted mb-1">{label}</div>
      {children}
    </label>
  );
}
