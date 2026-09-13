"use client";
import { useEffect, useRef, useState } from "react";

/**
 * The product, drawn.
 *
 * A weir holds a body of water back and lets only what rises above the crest
 * pass. That is exactly the contract: principal sits behind a fixed crest, and
 * only the accrual spills. Rendering this as a table of numbers threw away the
 * one thing about Weir that explains itself without words.
 *
 * Heights are deliberately NOT to scale. Accrual is a rounding error against
 * principal, so a truthful scale would render the spill invisible. The reservoir
 * is fixed and the spill is given a floor, and the honest numbers sit beside it.
 */
export function WeirVisual({
  principal,
  accrued,
  paid,
  symbol,
  height = 200,
}: {
  principal: string;
  accrued: string;
  paid: string;
  symbol: string;
  height?: number;
}) {
  const [pulse, setPulse] = useState(0);
  const prev = useRef(accrued);
  useEffect(() => {
    if (prev.current !== accrued) { setPulse((p) => p + 1); prev.current = accrued; }
  }, [accrued]);

  const crestY = Math.round(height * 0.34);

  return (
    <figure className="m-0" aria-label="Principal held behind the crest; only the accrual spills over">
      <div className="relative w-full" style={{ height }}>
        {/* held body */}
        <div
          className="reservoir absolute left-0 rounded-l-[var(--radius-sm)]"
          style={{ top: crestY, bottom: 0, width: "46%" }}
        />
        {/* the crest itself */}
        <div
          className="crest absolute"
          style={{ left: "46%", top: crestY, width: 3, bottom: 0 }}
        />
        {/* the overflow */}
        <div
          className="spill absolute"
          style={{ left: "calc(46% + 3px)", top: crestY, width: 10, height: height - crestY - 26 }}
        />
        {/* what has landed with the agent */}
        <div
          className="pool absolute right-0 rounded-r-[var(--radius-sm)]"
          style={{ left: "calc(46% + 13px)", bottom: 0, height: 26 }}
        />

        {/* labels sit ON the drawing, so the numbers and the picture are one object */}
        <div className="absolute left-0 flex flex-col gap-1" style={{ top: crestY + 14, paddingLeft: 16 }}>
          <span className="text-[10px] uppercase tracking-[0.14em] text-fg/70">Principal · held</span>
          <span className="num text-2xl sm:text-3xl text-fg">{principal}</span>
          <span className="text-[11px] text-fg/60">{symbol} · never releasable</span>
        </div>

        <div className="absolute right-0 text-right" style={{ top: 0 }}>
          <span className="block text-[10px] uppercase tracking-[0.14em] text-faint">Spilling now</span>
          <span key={pulse} className="num tick block text-3xl sm:text-4xl text-flow">{accrued}</span>
          <span className="block text-[11px] text-faint">{symbol} accrued, releasable</span>
        </div>

        <div className="absolute right-0 text-right" style={{ bottom: 2 }}>
          <span className="text-[10px] uppercase tracking-[0.14em] text-faint">Paid to agent </span>
          <span className="num text-sm text-dim">{paid}</span>
        </div>
      </div>
      <figcaption className="mt-3 text-[11px] text-faint leading-relaxed">
        Not to scale. The accrual is a rounding error against the principal, so a truthful
        scale would draw nothing at all.
      </figcaption>
    </figure>
  );
}
