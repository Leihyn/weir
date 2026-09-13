import React from "react";
import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { C } from "../constants";
import { mono } from "../fonts";

/**
 * The mechanic, animated: a body of water held behind a fixed crest, with only
 * the overflow leaving. The reservoir never falls. The spill never stops.
 *
 * Everything is derived from `width` so the same drawing works as a hero at
 * 1660 and as a small inset, rather than stretching out of proportion.
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

  const k = width / 980; // everything scales off the reference drawing
  const H = 300 * k;
  const crestY = 96 * k;
  const poolH = 52 * k;
  const damX = width * 0.52;

  // the spill breathes rather than blinks
  const spillOpacity = interpolate(Math.sin((frame / fps) * 2.2), [-1, 1], [0.55, 1]);
  // and the held surface rocks a few pixels without ever dropping
  const surface = Math.sin((frame / fps) * 0.7) * 2.5 * k;

  return (
    <div style={{ width, transform: `scale(${rise})`, opacity: reveal }}>
      <div style={{ position: "relative", height: H, fontFamily: mono }}>
        {/* held body */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: crestY + surface,
            bottom: 0,
            width: damX,
            background: `linear-gradient(180deg, ${C.hold} 0%, ${C.holdLo} 100%)`,
            borderRadius: `${8 * k}px 0 0 ${8 * k}px`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "0 0 auto 0",
              height: 3 * k,
              background: "rgba(238,244,248,.55)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: 34 * k,
            }}
          >
            <span
              style={{
                fontSize: 15 * k,
                letterSpacing: 3 * k,
                textTransform: "uppercase",
                color: "rgba(238,244,248,.75)",
              }}
            >
              Principal · held back
            </span>
            <span style={{ fontSize: 58 * k, color: "#fff", marginTop: 6 * k }}>{principal}</span>
            <span
              style={{ fontSize: 16 * k, color: "rgba(238,244,248,.6)", marginTop: 4 * k }}
            >
              never releasable
            </span>
          </div>
        </div>

        {/* the crest: the one fixed thing in the drawing */}
        <div
          style={{
            position: "absolute",
            left: damX,
            top: crestY - 10 * k,
            bottom: 0,
            width: 6 * k,
            background: C.fg,
            opacity: 0.92,
            borderRadius: 3 * k,
          }}
        />

        {/* the overflow */}
        <div
          style={{
            position: "absolute",
            left: damX + 6 * k,
            top: crestY - 10 * k,
            width: 22 * k,
            height: H - crestY - poolH + 10 * k,
            opacity: spillOpacity,
            background: `linear-gradient(180deg, ${C.flow} 0%, rgba(53,231,195,.35) 72%, rgba(53,231,195,0) 100%)`,
          }}
        />

        {/* the pool */}
        <div
          style={{
            position: "absolute",
            left: damX + 34 * k,
            right: 0,
            bottom: 0,
            height: poolH,
            background:
              "linear-gradient(180deg, rgba(53,231,195,.34) 0%, rgba(53,231,195,.10) 100%)",
            borderRadius: `0 ${8 * k}px ${8 * k}px 0`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `0 ${22 * k}px`,
          }}
        >
          <span
            style={{
              fontSize: 14 * k,
              letterSpacing: 3 * k,
              textTransform: "uppercase",
              color: "rgba(238,244,248,.72)",
            }}
          >
            Paid to the agent
          </span>
          <span style={{ fontSize: 22 * k, color: C.fg }}>{paid}</span>
        </div>

        {/* the live figure */}
        <div style={{ position: "absolute", left: damX + 46 * k, top: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: 14 * k,
              letterSpacing: 3 * k,
              textTransform: "uppercase",
              color: C.faint,
            }}
          >
            Spilling now
          </span>
          <span style={{ display: "block", fontSize: 70 * k, color: C.flow, marginTop: 2 * k }}>
            {spilling}
          </span>
        </div>
      </div>
    </div>
  );
};
