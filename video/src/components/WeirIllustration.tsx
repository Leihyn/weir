import React from "react";
import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { C } from "../constants";
import { mono } from "../fonts";

/**
 * The mechanic, animated: a body of water held behind a fixed crest, with only
 * the overflow leaving. The reservoir never falls. The spill never stops.
 */
export const WeirIllustration: React.FC<{
  principal: string;
  spilling: string;
  paid: string;
  width?: number;
}> = ({ principal, spilling, paid, width = 980 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = spring({ frame, fps, from: 0.93, to: 1, config: { damping: 22 } });
  const reveal = spring({ frame, fps, from: 0, to: 1, config: { damping: 30 } });

  const H = 300;
  const crestY = 96;
  const poolH = 52;
  const damX = width * 0.52;

  // the spill breathes rather than blinks
  const spillOpacity = interpolate(
    Math.sin((frame / fps) * 2.2), [-1, 1], [0.55, 1]
  );

  return (
    <div style={{ width, transform: `scale(${rise})`, opacity: reveal }}>
      <div style={{ position: "relative", height: H, fontFamily: mono }}>
        {/* held body */}
        <div style={{
          position: "absolute", left: 0, top: crestY, bottom: 0, width: damX,
          background: `linear-gradient(180deg, ${C.hold} 0%, ${C.holdLo} 100%)`,
          borderRadius: "8px 0 0 8px",
        }}>
          <div style={{ position: "absolute", inset: "0 0 auto 0", height: 3,
                        background: "rgba(238,244,248,.55)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex",
                        flexDirection: "column", justifyContent: "center", paddingLeft: 34 }}>
            <span style={{ fontSize: 15, letterSpacing: 3, textTransform: "uppercase",
                           color: "rgba(238,244,248,.75)" }}>Principal · held back</span>
            <span style={{ fontSize: 58, color: "#fff", marginTop: 6 }}>{principal}</span>
            <span style={{ fontSize: 16, color: "rgba(238,244,248,.6)", marginTop: 4 }}>
              never releasable
            </span>
          </div>
        </div>

        {/* the crest */}
        <div style={{ position: "absolute", left: damX, top: crestY - 10, bottom: 0,
                      width: 6, background: C.fg, opacity: .92, borderRadius: 3 }} />

        {/* the overflow */}
        <div style={{
          position: "absolute", left: damX + 6, top: crestY - 10,
          width: 22, height: H - crestY - poolH + 10, opacity: spillOpacity,
          background: `linear-gradient(180deg, ${C.flow} 0%, rgba(53,231,195,.35) 72%, rgba(53,231,195,0) 100%)`,
        }} />

        {/* the pool */}
        <div style={{
          position: "absolute", left: damX + 34, right: 0, bottom: 0, height: poolH,
          background: "linear-gradient(180deg, rgba(53,231,195,.34) 0%, rgba(53,231,195,.10) 100%)",
          borderRadius: "0 8px 8px 0", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 22px",
        }}>
          <span style={{ fontSize: 14, letterSpacing: 3, textTransform: "uppercase",
                         color: "rgba(238,244,248,.72)" }}>Paid to the agent</span>
          <span style={{ fontSize: 22, color: C.fg }}>{paid}</span>
        </div>

        {/* the live figure */}
        <div style={{ position: "absolute", left: damX + 46, top: 0 }}>
          <span style={{ display: "block", fontSize: 14, letterSpacing: 3,
                         textTransform: "uppercase", color: C.faint }}>Spilling now</span>
          <span style={{ display: "block", fontSize: 70, color: C.flow, marginTop: 2 }}>
            {spilling}
          </span>
        </div>
      </div>
    </div>
  );
};
