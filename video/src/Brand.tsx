import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "./constants";
import { mono, sans, serif } from "./fonts";

/**
 * The mark. Three takes on one idea: the hero is the CREST — a dead-flat bright
 * line that never moves — with the surplus falling off its end. Falling reads as
 * vertical; a curve reads as a swoosh, which is the trap the first attempt fell
 * into. Everything is derived from `s` so the same drawing serves 48px and 512px.
 */

const Tile: React.FC<{ s: number; children: React.ReactNode }> = ({ s, children }) => (
  <div
    style={{
      width: s,
      height: s,
      background: C.ink,
      borderRadius: s * 0.22,
      position: "relative",
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

/**
 * A — NAPPE. The engineering term for the sheet of water falling over a weir.
 * Solid held body, flat bright crest across its top, and the overflow peeling
 * off the right edge as a sheet that falls and thins.
 */
export const MarkA: React.FC<{ s: number }> = ({ s }) => {
  const p = s * 0.17;
  const w = s - p * 2;
  const crestY = p + w * 0.3;
  const bodyR = p + w * 0.52; // right edge of the held body
  return (
    <Tile s={s}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <defs>
          <linearGradient id="a-hold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.hold} />
            <stop offset="100%" stopColor={C.holdLo} />
          </linearGradient>
          <linearGradient id="a-fall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.flow} stopOpacity="1" />
            <stop offset="72%" stopColor={C.flow} stopOpacity=".55" />
            <stop offset="100%" stopColor={C.flow} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* the held body */}
        <rect x={p} y={crestY} width={bodyR - p} height={s - p - crestY} fill="url(#a-hold)" />

        {/* the nappe: peels off the crest and falls, thinning as it goes */}
        <path
          d={`M ${bodyR} ${crestY}
              C ${bodyR + w * 0.13} ${crestY + w * 0.01},
                ${bodyR + w * 0.19} ${crestY + w * 0.1},
                ${bodyR + w * 0.2} ${crestY + w * 0.28}
              L ${bodyR + w * 0.2} ${s - p}
              L ${bodyR + w * 0.05} ${s - p}
              L ${bodyR + w * 0.05} ${crestY + w * 0.22}
              C ${bodyR + w * 0.045} ${crestY + w * 0.1},
                ${bodyR + w * 0.02} ${crestY + w * 0.04},
                ${bodyR} ${crestY + w * 0.05} Z`}
          fill="url(#a-fall)"
        />

        {/* THE CREST: the one thing that never moves */}
        <rect
          x={p}
          y={crestY - s * 0.028}
          width={bodyR - p + w * 0.04}
          height={s * 0.032}
          rx={s * 0.016}
          fill={C.fg}
        />
      </svg>
    </Tile>
  );
};

/**
 * B — NOTCH. Real weirs cut a measuring notch in the crest; water fills to the
 * notch and spills through it. The notched silhouette is the ownable part —
 * almost nothing else in the category has it.
 */
export const MarkB: React.FC<{ s: number }> = ({ s }) => {
  const p = s * 0.17;
  const w = s - p * 2;
  const crestY = p + w * 0.26;
  const nx = p + w * 0.56; // notch left
  const nw = w * 0.26; // notch width
  const nd = w * 0.17; // notch depth
  return (
    <Tile s={s}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <defs>
          <linearGradient id="b-hold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.hold} />
            <stop offset="100%" stopColor={C.holdLo} />
          </linearGradient>
          <linearGradient id="b-fall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.flow} stopOpacity="1" />
            <stop offset="70%" stopColor={C.flow} stopOpacity=".5" />
            <stop offset="100%" stopColor={C.flow} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* held body, full width, with the notch cut out of its top */}
        <path
          d={`M ${p} ${crestY}
              L ${nx} ${crestY}
              L ${nx} ${crestY + nd}
              L ${nx + nw} ${crestY + nd}
              L ${nx + nw} ${crestY}
              L ${p + w} ${crestY}
              L ${p + w} ${s - p}
              L ${p} ${s - p} Z`}
          fill="url(#b-hold)"
        />

        {/* water falling THROUGH the notch */}
        <rect x={nx + nw * 0.16} y={crestY + nd} width={nw * 0.68} height={s - p - crestY - nd} fill="url(#b-fall)" />

        {/* the crest, following the notch — the fixed height */}
        <path
          d={`M ${p} ${crestY} L ${nx} ${crestY} L ${nx} ${crestY + nd}
              L ${nx + nw} ${crestY + nd} L ${nx + nw} ${crestY} L ${p + w} ${crestY}`}
          stroke={C.fg}
          strokeWidth={s * 0.032}
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </Tile>
  );
};

/**
 * C — STRATA. Maximum reduction for the size floor: the body, the flat crest,
 * and the spill as three staggered strokes falling past the right edge. Three
 * marks survive anything.
 */
export const MarkC: React.FC<{ s: number }> = ({ s }) => {
  const p = s * 0.17;
  const w = s - p * 2;
  const crestY = p + w * 0.3;
  const bodyR = p + w * 0.5;
  const sw = s * 0.055;
  const falls: [number, number][] = [
    [0.1, 0.52],
    [0.26, 0.78],
    [0.42, 0.4],
  ];
  return (
    <Tile s={s}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <defs>
          <linearGradient id="c-hold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.hold} />
            <stop offset="100%" stopColor={C.holdLo} />
          </linearGradient>
        </defs>

        <rect x={p} y={crestY} width={bodyR - p} height={s - p - crestY} fill="url(#c-hold)" />

        {/* the spill: three staggered falls, each fading out */}
        {falls.map(([dx, len], i) => (
          <line
            key={i}
            x1={bodyR + w * dx}
            y1={crestY + s * 0.02}
            x2={bodyR + w * dx}
            y2={crestY + (s - p - crestY) * len}
            stroke={C.flow}
            strokeWidth={sw}
            strokeLinecap="round"
            opacity={1 - i * 0.22}
          />
        ))}

        {/* the crest, running past the body so it reads as a level, not a lid */}
        <rect
          x={p}
          y={crestY - s * 0.028}
          width={w * 0.62}
          height={s * 0.032}
          rx={s * 0.016}
          fill={C.fg}
        />
      </svg>
    </Tile>
  );
};

const MARKS = { A: MarkA, B: MarkB, C: MarkC } as const;

/** Each variant at 512, for the submission form. */
export const LogoA: React.FC = () => <Sheet k="A" />;
export const LogoB: React.FC = () => <Sheet k="B" />;
export const LogoC: React.FC = () => <Sheet k="C" />;

const Sheet: React.FC<{ k: keyof typeof MARKS }> = ({ k }) => {
  const M = MARKS[k];
  return (
    <AbsoluteFill style={{ background: C.ink, alignItems: "center", justifyContent: "center" }}>
      <M s={512} />
    </AbsoluteFill>
  );
};

/** All three at 512 and at the 48px floor, side by side, for judging. */
export const LogoCompare: React.FC = () => (
  <AbsoluteFill style={{ background: "#14181d", padding: 60, fontFamily: sans, color: C.fg }}>
    <div style={{ display: "flex", gap: 54, alignItems: "flex-start" }}>
      {(["A", "B", "C"] as const).map((k, i) => {
        const M = MARKS[k];
        const label = ["A · Nappe", "B · Notch", "C · Strata"][i];
        return (
          <div key={k} style={{ textAlign: "center" }}>
            <M s={300} />
            <div style={{ fontFamily: mono, fontSize: 19, marginTop: 20, letterSpacing: 2 }}>{label}</div>
            <div
              style={{
                marginTop: 22,
                display: "flex",
                gap: 16,
                alignItems: "center",
                justifyContent: "center",
                background: "#0a0d11",
                padding: "16px 20px",
                borderRadius: 10,
              }}
            >
              <M s={48} />
              <M s={32} />
              <M s={20} />
            </div>
            <div style={{ fontFamily: mono, fontSize: 13, color: C.faint, marginTop: 10 }}>
              48 · 32 · 20 px
            </div>
          </div>
        );
      })}
    </div>
  </AbsoluteFill>
);

/**
 * 16:9 cover. Has to work as a small card in a gallery of hundreds, so it
 * carries the name, the one-line claim, and the mark — nothing else.
 */
export const Cover: React.FC = () => (
  <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: 700,
        top: 150,
        right: -60,
        bottom: -40,
        background: `linear-gradient(160deg, ${C.holdLo} 0%, rgba(13,17,23,0) 70%)`,
        opacity: 0.66,
        maskImage: "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 42%)",
        WebkitMaskImage: "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 42%)",
      }}
    />
    <div style={{ position: "absolute", right: 96, top: 196 }}>
      <MarkA s={328} />
    </div>

    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "0 0 0 86px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        color: C.fg,
        fontFamily: sans,
      }}
    >
      <div
        style={{
          fontFamily: mono,
          fontSize: 20,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: C.faint,
          marginBottom: 22,
        }}
      >
        Weir
      </div>
      <div style={{ fontFamily: serif, fontSize: 78, lineHeight: 1.04, letterSpacing: "-0.015em" }}>
        An endowment your agent
        <br />
        <span style={{ color: C.flow }}>cannot outspend.</span>
      </div>
      <div style={{ fontSize: 25, color: C.dim, marginTop: 30, maxWidth: 660 }}>
        Principal stays in Aave. The agent spends only the yield, forever.
      </div>
      <div style={{ fontFamily: mono, fontSize: 17, color: C.faint, marginTop: 42, letterSpacing: 0.5 }}>
        ETHOnline 2026 · Base
      </div>
    </div>

    <AbsoluteFill
      style={{
        background:
          "radial-gradient(115% 95% at 38% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,.34) 82%, rgba(0,0,0,.6) 100%)",
      }}
    />
  </AbsoluteFill>
);
