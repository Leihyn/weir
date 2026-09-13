import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../constants";
import { mono, sans } from "../fonts";

/**
 * The architecture, drawn rather than listed. Built as a staged reveal so the
 * viewer follows one edge at a time instead of being handed a finished diagram:
 * commit, accrue, release, and only then where each partner actually sits.
 *
 * Every partner label hangs off the edge it belongs to. A partner that does not
 * touch an edge does not appear, which is the honest version of an integration
 * diagram.
 */

const useStage = (at: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, from: 0, to: 1, config: { damping: 30 } });
};

const Node: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  accent?: string;
  at: number;
  strong?: boolean;
}> = ({ x, y, w, h, title, sub, accent = C.line, at, strong }) => {
  const t = useStage(at);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        opacity: t,
        transform: `translateY(${(1 - t) * 14}px)`,
        borderRadius: 12,
        border: `1px solid ${accent}`,
        background: strong ? C.raised : C.surface,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        boxShadow: strong ? `0 0 0 1px ${accent}44, 0 18px 40px rgba(0,0,0,.45)` : "none",
      }}
    >
      <div style={{ fontFamily: sans, fontSize: strong ? 30 : 25, color: C.fg, letterSpacing: -0.2 }}>
        {title}
      </div>
      {sub && (
        <div style={{ fontFamily: mono, fontSize: 14, color: C.faint, letterSpacing: 1 }}>{sub}</div>
      )}
    </div>
  );
};

/** An edge that draws itself, with its label riding above the midpoint. */
const Edge: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  note?: string;
  color?: string;
  at: number;
  dashed?: boolean;
  below?: boolean;
}> = ({ x1, y1, x2, y2, label, note, color = C.hold, at, dashed, below }) => {
  const t = useStage(at);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x1,
          top: y1,
          width: len * t,
          height: 2,
          transformOrigin: "left center",
          transform: `rotate(${ang}deg)`,
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 8px, transparent 8px 16px)`
            : color,
          opacity: dashed ? 0.7 : 1,
        }}
      />
      {/* arrowhead */}
      <div
        style={{
          position: "absolute",
          left: x1 + (x2 - x1) * t - 5,
          top: y1 + (y2 - y1) * t - 5,
          width: 10,
          height: 10,
          borderRadius: 5,
          background: color,
          opacity: t,
        }}
      />
      {label && (
        <div
          style={{
            position: "absolute",
            left: (x1 + x2) / 2 - 150,
            top: (y1 + y2) / 2 + (Math.abs(y2 - y1) > 40 ? -16 : below ? 16 : -62),
            width: 300,
            textAlign: "center",
            opacity: interpolate(t, [0.6, 1], [0, 1], { extrapolateLeft: "clamp" }),
          }}
        >
          <div style={{ fontFamily: mono, fontSize: 16, color, letterSpacing: 1 }}>{label}</div>
          {note && (
            <div style={{ fontFamily: sans, fontSize: 14, color: C.faint, marginTop: 3 }}>{note}</div>
          )}
        </div>
      )}
    </>
  );
};

/** A partner, pinned to the edge it actually touches. */
const Partner: React.FC<{ x: number; y: number; name: string; does: string; at: number }> = ({
  x,
  y,
  name,
  does,
  at,
}) => {
  const t = useStage(at);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 330,
        opacity: t,
        transform: `translateX(${(1 - t) * -10}px)`,
        borderLeft: `2px solid ${C.flow}`,
        paddingLeft: 14,
      }}
    >
      <div style={{ fontFamily: sans, fontSize: 21, color: C.fg }}>{name}</div>
      <div style={{ fontFamily: sans, fontSize: 15, color: C.dim, marginTop: 3, lineHeight: 1.35 }}>
        {does}
      </div>
    </div>
  );
};

export const FlowDiagram: React.FC = () => (
  <div style={{ position: "absolute", inset: 0 }}>
    {/* ── the spine: owner commits, Weir supplies Aave ── */}
    <Node x={96} y={300} w={230} h={96} title="Owner" sub="SIGNS ONCE" at={0} />
    <Edge x1={326} y1={348} x2={606} y2={348} label="commits principal" at={8} />

    <Node x={606} y={282} w={280} h={132} title="Weir" sub="THE CONTRACT" accent={C.flow} at={14} strong />
    <Edge x1={886} y1={330} x2={1196} y2={330} label="supplies" at={22} />

    <Node x={1196} y={282} w={250} h={132} title="Aave v3" sub="EARNS YIELD" accent={C.hold} at={26} />

    {/* the index comes back: this is the whole mechanism */}
    <Edge
      x1={1196}
      y1={392}
      x2={886}
      y2={392}
      label="liquidity index"
      note="the number the amount is derived from"
      color={C.flow}
      at={34}
      dashed
      below
    />

    {/* ── the release ── */}
    <Edge
      x1={746}
      y1={414}
      x2={746}
      y2={604}
      label="harvest()"
      note="permissionless · no keeper"
      color={C.flow}
      at={46}
    />
    <Node x={606} y={604} w={280} h={110} title="Agent" sub="SPENDS THE YIELD" accent={C.flow} at={54} />
    <Edge x1={886} y1={659} x2={1196} y2={659} label="x402" note="pays its own bills" color={C.flow} at={62} below />
    <Node x={1196} y={614} w={250} h={92} title="Service" sub="THE BILL" at={66} />

    {/* ── where each partner actually sits ── */}
    <Partner x={1500} y={292} name="Aave v3" does="the liquidity index every figure is derived from" at={74} />
    <Partner
      x={1500}
      y={404}
      name="Uniswap"
      does="converts a WETH endowment's yield into the USDC bills are paid in"
      at={80}
    />
    <Partner
      x={1500}
      y={548}
      name="The Graph"
      does="indexes every release; the MCP answers what the agent can spend forever"
      at={86}
    />
    <Partner x={1500} y={700} name="Privy" does="how an owner signs in and commits principal" at={92} />
  </div>
);
