"use client";
import { useEffect, useState } from "react";
import { Endowment, readIndex, releasable, fmt } from "../lib/chain";
import { assetByAddress } from "../lib/config";

export function EndowmentCard({
  e, onHarvest, busy,
}: { e: Endowment; onHarvest: (id: bigint) => void; busy: boolean }) {
  const asset = assetByAddress(e.asset);
  const dec = asset?.decimals ?? 6;
  const [accrued, setAccrued] = useState<bigint>(0n);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const i = await readIndex(e.asset);
        if (!alive) return;
        setAccrued((prev) => {
          const next = releasable(e, i);
          if (next !== prev) setPulse((p) => p + 1);
          return next;
        });
      } catch { /* ignore */ }
    };
    poll();
    const h = setInterval(poll, 4000);
    return () => { alive = false; clearInterval(h); };
  }, [e]);

  const floorMet = accrued >= e.minPayout;
  const nextAllowed = Number(e.lastHarvest + e.minInterval) * 1000;
  const timeMet = Date.now() >= nextAllowed;

  return (
    <div className="panel p-5">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="num text-muted text-sm">#{e.id.toString()}</span>
          <span className="text-sm font-medium">{asset?.symbol ?? "?"} endowment</span>
          {!e.active && <span className="text-xs text-muted">(closed)</span>}
        </div>
        <a
          className="text-xs text-muted hover:text-fg underline decoration-dotted"
          href={`https://basescan.org/address/${e.agent}`} target="_blank" rel="noreferrer"
        >
          agent {e.agent.slice(0, 6)}…{e.agent.slice(-4)}
        </a>
      </div>

      {/* the weir itself: principal held, overflow spilling */}
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted">principal · held back</div>
          <div className="num text-2xl text-hold">{fmt(e.principal, dec, dec === 6 ? 2 : 6)}</div>
        </div>
        <div className="w-16 h-px spill" aria-hidden />
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-muted">accrued · spillable</div>
          <div key={pulse} className="num text-2xl text-flow tick">{fmt(accrued, dec)}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <Meta label="paid to agent" value={fmt(e.totalPaid, dec, dec === 6 ? 2 : 6)} />
        <Meta label="payout floor" value={fmt(e.minPayout, dec, dec === 6 ? 2 : 6)} />
        <Meta label="min interval" value={`${e.minInterval.toString()}s`} />
      </div>

      <button
        disabled={!e.active || busy || !floorMet || !timeMet}
        onClick={() => onHarvest(e.id)}
        className="mt-5 w-full rounded-lg border border-line bg-panel-2 py-2.5 text-sm
                   enabled:hover:border-flow enabled:hover:text-flow transition
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? "harvesting…"
          : !floorMet ? "below payout floor · accrual continues"
          : !timeMet ? "rate-limited by min interval"
          : "harvest → pay the agent"}
      </button>
      <p className="mt-2 text-[11px] text-muted leading-relaxed">
        Anyone may call this. The amount comes from the index and the destination comes
        from storage, so a caller has nothing to choose and nothing to gain.
      </p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="num">{value}</div>
    </div>
  );
}
