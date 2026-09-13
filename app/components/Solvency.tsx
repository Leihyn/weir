"use client";
import { useEffect, useState } from "react";
import { publicClient, fmt } from "../lib/chain";
import { weirAbi } from "../lib/abi";
import { WEIR, USDC, assetByAddress } from "../lib/config";

/**
 * The claim is "principal intact". This is the proof, read live from the chain.
 *
 * `committed` is the sum of every open endowment's principal. `held` is the
 * aTokens Weir actually owns. If held ever fell below committed, the guarantee
 * would be a lie. Showing the two numbers side by side is more convincing than
 * any sentence we could write about them.
 */
export function Solvency() {
  const [v, setV] = useState<{ committed: bigint; held: bigint } | null>(null);
  const dec = assetByAddress(USDC)?.decimals ?? 6;

  useEffect(() => {
    if (!WEIR) return;
    let alive = true;
    const poll = async () => {
      try {
        const r = (await publicClient.readContract({
          address: WEIR, abi: weirAbi, functionName: "solvency", args: [USDC],
        })) as readonly [bigint, bigint];
        if (alive) setV({ committed: r[0], held: r[1] });
      } catch { /* rpc hiccup */ }
    };
    poll();
    const h = setInterval(poll, 8000);
    return () => { alive = false; clearInterval(h); };
  }, []);

  if (!v) return null;
  const ok = v.held >= v.committed;
  const surplus = v.held > v.committed ? v.held - v.committed : 0n;

  return (
    <div className="panel px-6 py-5" role="status" aria-live="polite">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-faint">
            Principal committed
          </div>
          <div className="num text-2xl text-hold mt-1">{fmt(v.committed, dec, 2)}</div>
        </div>

        <div className="text-xl text-faint select-none" aria-hidden>&le;</div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-faint">
            aTokens actually held
          </div>
          <div className="num text-2xl text-flow mt-1">{fmt(v.held, dec, 2)}</div>
        </div>

        <p className="flex-1 min-w-[15rem] text-xs text-faint leading-relaxed">
          {ok ? (
            <>
              Solvent by <span className="num text-fg">{fmt(surplus, dec, 6)}</span>. Weir
              holds at least what it owes, every block. If this ever inverted, the guarantee
              would be a lie, so it is shown rather than asserted.
            </>
          ) : (
            <span className="text-warn">
              Held is below committed. This should be impossible; do not trust this contract.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
