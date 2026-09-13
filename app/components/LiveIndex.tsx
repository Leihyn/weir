"use client";
import { useEffect, useRef, useState } from "react";
import { readIndex } from "../lib/chain";
import { RAY, USDC } from "../lib/config";

/**
 * Derives the supply APY from observed index drift rather than quoting a number.
 * Aave's liquidity index advances every block, so two samples are enough.
 */
export function LiveIndex() {
  const [index, setIndex] = useState<bigint | null>(null);
  const [apy, setApy] = useState<number | null>(null);
  const first = useRef<{ i: bigint; t: number } | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const i = await readIndex(USDC);
        if (!alive) return;
        setIndex(i);
        const now = Date.now();
        if (!first.current) first.current = { i, t: now };
        else {
          const dt = (now - first.current.t) / 1000;
          if (dt > 8 && i > first.current.i) {
            const growth = Number(i - first.current.i) / Number(first.current.i);
            setApy(((1 + growth / dt) ** 31_536_000 - 1) * 100);
          }
        }
      } catch { /* public RPC hiccup, keep the last good value */ }
    };
    poll();
    const h = setInterval(poll, 4000);
    return () => { alive = false; clearInterval(h); };
  }, []);

  const idxStr = index ? (Number(index) / Number(RAY)).toFixed(12) : "—";

  return (
    <div
      className="panel px-6 py-5 flex flex-wrap items-end gap-x-10 gap-y-4"
      role="status" aria-live="polite" aria-label="Live Aave liquidity index"
    >
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-faint">
          Aave v3 liquidity index
        </div>
        <div className="num text-2xl text-flow mt-1">{idxStr}</div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-faint">Observed APY</div>
        <div className="num text-2xl mt-1">{apy === null ? "sampling…" : `${apy.toFixed(3)}%`}</div>
      </div>
      <p className="flex-1 min-w-[16rem] text-xs text-faint leading-relaxed">
        This number is the multiplier. Every figure below is derived from it, live, on Base
        Sepolia. Nothing here is seeded.
      </p>
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-faint">{label}</div>
      <div className={`num text-lg ${accent ? "text-flow" : ""}`}>{value}</div>
    </div>
  );
}
