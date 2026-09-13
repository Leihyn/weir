"use client";
import { useCallback, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { LiveIndex } from "../components/LiveIndex";
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
    <main className="mx-auto max-w-5xl px-5 py-12">
      <header>
        <div className="flex items-center gap-3">
          <Mark />
          <span className="text-sm tracking-[0.2em] uppercase text-muted">Weir</span>
        </div>
        <h1 className="mt-6 text-3xl sm:text-4xl font-medium leading-tight max-w-2xl">
          An endowment your agent <span className="text-flow">cannot outspend</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-muted leading-relaxed">
          Fund an autonomous agent once. It may spend the yield forever and can never touch
          the principal, because the released amount is computed from Aave&apos;s liquidity
          index rather than chosen by whoever calls the contract. A spending cap enforced by
          arithmetic, not by a policy someone can edit.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          An agent given a $1,000 lump sum and a $1/day budget dies in a thousand days.
          An agent given a $1,000 endowment runs indefinitely.
        </p>
      </header>

      <section className="mt-10"><LiveIndex /></section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[380px_1fr] items-start">
        <OpenEndowment onDone={refresh} />

        <div className="grid gap-5">
          {!WEIR && (
            <div className="panel p-5 text-sm text-warn">
              Contract address not configured. Set NEXT_PUBLIC_WEIR_ADDRESS after deploying.
            </div>
          )}
          {WEIR && list.length === 0 && (
            <div className="panel p-5 text-sm text-muted">No endowments yet.</div>
          )}
          {list.map((e) => (
            <EndowmentCard key={e.id.toString()} e={e} onHarvest={harvest} busy={busyId === e.id} />
          ))}
          {err && <p className="text-xs text-warn">{err}</p>}
        </div>
      </section>

      <section className="mt-12 panel p-5">
        <h2 className="text-sm font-medium">How the number is derived</h2>
        <pre className="mt-3 overflow-x-auto text-xs num text-muted leading-relaxed">{`An aToken balance is a raw balance times a global index:

    balance = scaledBalance x index / RAY

For principal P committed at index i0, the releasable amount at i1 is

    accrued = P x (i1 - i0) / i0          equivalently  d = S x (1 - i0/i1)

After withdrawing exactly that, the remaining balance is P again. Principal is
preserved by construction, not by a check. A rounding reserve of i1/RAY + 1 is
withheld per harvest because Aave burns scaled units with round-half-up; it is
tracked and paid out on close, never stranded.`}</pre>
      </section>

      <footer className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
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
