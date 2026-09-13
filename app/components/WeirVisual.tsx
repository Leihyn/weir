"use client";
import { useEffect, useRef, useState } from "react";

/**
 * The product, drawn: a body of water held behind a crest, and only the overflow
 * leaving. Rendered with explicit inline colour so nothing depends on a utility
 * class being emitted — an earlier version relied on custom CSS classes and the
 * reservoir silently never painted, which left the metaphor reading as a stray bar.
 *
 * Deliberately not to scale. The accrual is a rounding error against principal, so
 * a truthful scale draws nothing; the honest numbers sit beside the drawing.
 */
const HOLD = "#3f6f9e";
const HOLD_LO = "#17304a";
const FLOW = "#35e7c3";

export function WeirVisual({
  principal, accrued, paid, symbol, height = 230,
}: { principal: string; accrued: string; paid: string; symbol: string; height?: number }) {
  const [pulse, setPulse] = useState(0);
  const prev = useRef(accrued);
  useEffect(() => {
    if (prev.current !== accrued) { setPulse((p) => p + 1); prev.current = accrued; }
  }, [accrued]);

  const crestY = 74;          // waterline: reservoir top and the lip it spills over
  const poolH = 34;
  const damX = "52%";

  return (
    <figure className="m-0">
      <div className="relative w-full overflow-hidden" style={{ height }}
           aria-label="Principal held behind a crest; only the accrual spills over">

        {/* held body — the principal */}
        <div style={{
          position: "absolute", left: 0, top: crestY, bottom: 0, width: damX,
          background: `linear-gradient(180deg, ${HOLD} 0%, ${HOLD_LO} 100%)`,
          borderTopLeftRadius: 6, borderBottomLeftRadius: 6,
        }}>
          <div style={{ position: "absolute", inset: "0 0 auto 0", height: 2,
                        background: "rgba(238,244,248,.55)" }} />
          <div className="absolute inset-0 flex flex-col justify-center px-5">
            <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "rgba(238,244,248,.72)" }}>
              Principal · held back
            </span>
            <span className="num text-3xl sm:text-4xl mt-1" style={{ color: "#fff" }}>{principal}</span>
            <span className="text-[11px] mt-1" style={{ color: "rgba(238,244,248,.6)" }}>
              {symbol} · never releasable
            </span>
          </div>
        </div>

        {/* the crest it cannot pass */}
        <div style={{ position: "absolute", left: damX, top: crestY - 6, bottom: 0, width: 4,
                      background: "#eef4f8", opacity: .9, borderRadius: 2 }} />

        {/* the overflow */}
        <div className="spill" style={{
          position: "absolute", left: `calc(${damX} + 4px)`, top: crestY - 6,
          width: 14, height: height - crestY - poolH + 6,
          background: `linear-gradient(180deg, ${FLOW} 0%, rgba(53,231,195,.35) 75%, rgba(53,231,195,0) 100%)`,
        }} />

        {/* what has landed with the agent */}
        <div style={{
          position: "absolute", left: `calc(${damX} + 18px)`, right: 0, bottom: 0, height: poolH,
          background: `linear-gradient(180deg, rgba(53,231,195,.34) 0%, rgba(53,231,195,.10) 100%)`,
          borderTopRightRadius: 6, borderBottomRightRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingLeft: 14, paddingRight: 14,
        }}>
          <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "rgba(238,244,248,.7)" }}>
            Paid to the agent
          </span>
          <span className="num text-sm" style={{ color: "#eef4f8" }}>{paid}</span>
        </div>

        {/* the live figure, above the spill. Anchored to the RIGHT edge: anchoring it
            from the left overflowed the viewport at 375px and produced a horizontal
            scrollbar, which livetest caught. */}
        <div style={{ position: "absolute", left: `calc(${damX} + 26px)`, right: 0, top: 0 }}
             className="text-right">
          <span className="block text-[10px] uppercase tracking-[0.16em] text-faint">Spilling now</span>
          <span key={pulse} className="num tick block text-2xl sm:text-4xl md:text-5xl truncate"
                style={{ color: FLOW }}>
            {accrued}
          </span>
          <span className="block text-[11px] text-faint mt-1">{symbol} accrued · releasable</span>
        </div>
      </div>

      <figcaption className="mt-4 text-[11px] text-faint leading-relaxed">
        Not to scale. The accrual is a rounding error against the principal, so a truthful
        scale would draw nothing at all.
      </figcaption>
    </figure>
  );
}
