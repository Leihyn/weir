"use client";
import { useEffect, useState } from "react";
import { Endowment, readIndex, releasable, fmt } from "../lib/chain";
import { assetByAddress, EXPLORER } from "../lib/config";
import { WeirVisual } from "./WeirVisual";

export function EndowmentCard({
  e, onHarvest, busy,
}: { e: Endowment; onHarvest: (id: bigint) => void; busy: boolean }) {
  const asset = assetByAddress(e.asset);
  const dec = asset?.decimals ?? 6;
  const [accrued, setAccrued] = useState<bigint>(0n);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const i = await readIndex(e.asset);
        if (alive) setAccrued(releasable(e, i));
      } catch { /* rpc hiccup, keep the last good value */ }
    };
    poll();
    const h = setInterval(poll, 4000);
    return () => { alive = false; clearInterval(h); };
  }, [e]);

  const floorMet = accrued >= e.minPayout;
  const nextAllowed = Number(e.lastHarvest + e.minInterval) * 1000;
  const timeMet = Date.now() >= nextAllowed;
  const ready = e.active && floorMet && timeMet;

  const label = !e.active ? "closed"
    : busy ? "Harvesting…"
    : !floorMet ? "Below payout floor"
    : !timeMet ? "Rate-limited"
    : "Release to the agent";

  return (
    <article className="panel p-6 sm:p-8">
      <header className="flex items-baseline justify-between gap-4 mb-6">
        <h3 className="display text-xl">
          Endowment <span className="num text-dim">#{e.id.toString()}</span>
        </h3>
        <a
          className="text-xs text-faint hover:text-fg underline decoration-dotted underline-offset-4"
          href={`${EXPLORER}/address/${e.agent}`} target="_blank" rel="noreferrer"
        >
          agent {e.agent.slice(0, 6)}…{e.agent.slice(-4)}
        </a>
      </header>

      <WeirVisual
        principal={fmt(e.principal, dec, dec === 6 ? 2 : 4)}
        accrued={fmt(accrued, dec, 6)}
        paid={fmt(e.totalPaid, dec, dec === 6 ? 2 : 4)}
        symbol={asset?.symbol ?? "?"}
      />

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-xs border-t border-line pt-5">
        <div className="flex justify-between">
          <dt className="text-faint">Payout floor</dt>
          <dd className="num">{fmt(e.minPayout, dec, dec === 6 ? 2 : 4)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-faint">Min interval</dt>
          <dd className="num">{e.minInterval.toString()}s</dd>
        </div>
      </dl>

      <button
        disabled={!ready || busy}
        onClick={() => onHarvest(e.id)}
        aria-label="Release the accrued yield to the agent"
        className="hoverable mt-6 w-full rounded-[var(--radius-sm)] border border-flow-lo
                   bg-flow-lo/25 py-3 text-sm text-flow transition-colors duration-200
                   enabled:hover:bg-flow-lo/45 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {label}
      </button>
      <p className="mt-3 text-[11px] text-faint leading-relaxed">
        Anyone may press this. The amount comes from the index and the destination comes from
        storage, so a caller has nothing to choose and nothing to gain.
      </p>
    </article>
  );
}
