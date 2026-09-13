"use client";
import { useCallback, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { LiveIndex } from "../components/LiveIndex";
import { Solvency } from "../components/Solvency";
import { EndowmentCard } from "../components/EndowmentCard";
import { OpenEndowment } from "../components/OpenEndowment";
import { Endowment, listEndowments, publicClient } from "../lib/chain";
import { resolveWallet, hasInjected } from "../lib/connect";
import { weirAbi } from "../lib/abi";
import { WEIR, PRIVY_APP_ID, EXPLORER, NETWORK } from "../lib/config";

export default function Page() {
  const privy = PRIVY_APP_ID ? usePrivy() : null;
  const wallets = PRIVY_APP_ID ? useWallets() : { wallets: [] as any[] };
  const [list, setList] = useState<Endowment[]>([]);
  const [busyId, setBusyId] = useState<bigint | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try { setList(await listEndowments()); } catch { /* rpc hiccup */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const harvest = async (id: bigint) => {
    setBusyId(id); setErr(null);
    try {
      const wc = await resolveWallet(wallets.wallets ?? []);
      const hash = await wc.writeContract({
        address: WEIR, abi: weirAbi, functionName: "harvest",
        args: [id], chain: undefined, account: wc.account!,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await refresh();
    } catch (e: any) {
      setErr(e?.shortMessage ?? e?.message ?? "harvest failed");
    } finally { setBusyId(null); }
  };

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24">
      <header className="pt-4">
        <div className="flex items-center gap-3">
          <Mark />
          <span className="text-[11px] tracking-[0.26em] uppercase text-faint">Weir</span>
        </div>

        <h1 className="display mt-10 text-5xl sm:text-6xl max-w-3xl">
          Your agent&apos;s bills<br />
          <span className="text-flow">outlive its budget.</span>
        </h1>

        <p className="mt-7 max-w-xl text-dim leading-relaxed">
          A $12/month API subscription funded with $500 dies in forty months, and so does
          whatever the agent was maintaining. Recurring costs do not stop. Budgets do.
        </p>
        <p className="mt-4 max-w-xl text-dim leading-relaxed">
          Weir endows the bill instead of funding the agent. Principal goes into Aave once and
          stays. Only what the index adds ever leaves, so a compromised agent still cannot take
          more than the accrual.
        </p>
      </header>

      <section className="mt-10 grid gap-4">
        <LiveIndex />
        <Solvency />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div className="grid gap-6 order-1">
          {!WEIR && (
            <div className="panel p-6 text-sm text-warn">
              Contract address not configured. Set NEXT_PUBLIC_WEIR_ADDRESS after deploying.
            </div>
          )}
          {WEIR && list.length === 0 && (
            <div className="panel p-6 text-sm text-dim">No endowments yet.</div>
          )}
          {list.map((e) => (
            <EndowmentCard key={e.id.toString()} e={e} onHarvest={harvest} busy={busyId === e.id} />
          ))}
          {err && <p className="text-xs text-warn">{err}</p>}
        </div>

        <div className="order-2"><OpenEndowment onDone={refresh} /></div>
      </section>

      <section className="mt-14 panel p-6 sm:p-8">
        <h2 className="display text-2xl">How the number is derived</h2>
        <pre className="mt-3 overflow-x-auto text-xs num text-dim leading-relaxed">{`An aToken balance is a raw balance times a global index:

    balance = scaledBalance x index / RAY

For principal P committed at index i0, the releasable amount at i1 is

    accrued = P x (i1 - i0) / i0          equivalently  d = S x (1 - i0/i1)

After withdrawing exactly that, the remaining balance is P again. Principal is
preserved by construction, not by a check. A rounding reserve of i1/RAY + 1 is
withheld per harvest because Aave burns scaled units with round-half-up; it is
tracked and paid out on close, never stranded.`}</pre>
      </section>

      <footer className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-dim">
        <span>Aave v3 · {NETWORK.name}</span>
        <span>Privy</span>
        <span>Uniswap</span>
        <span>The Graph</span>
        {WEIR && (
          <a className="underline decoration-dotted hover:text-fg"
             href={`${EXPLORER}/address/${WEIR}`} target="_blank" rel="noreferrer">
            contract
          </a>
        )}
        {PRIVY_APP_ID && privy?.authenticated && (
          <button onClick={() => privy.logout()} className="underline decoration-dotted hover:text-fg">
            sign out
          </button>
        )}
      </footer>
    </main>
  );
}

function Mark() {
  // a weir: water held back on the left, spilling over the crest on the right
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" role="img" aria-label="Weir">
      <path d="M2 7h10v12H2z" fill="var(--color-hold)" opacity=".45" />
      <path d="M12 7v12" stroke="var(--color-fg)" strokeWidth="1.5" />
      <path d="M12 9c4 0 4 4 12 4" stroke="var(--color-flow)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
