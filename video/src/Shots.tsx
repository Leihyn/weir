import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "./constants";
import { mono, sans, serif } from "./fonts";
import { FlowDiagram } from "./components/Flow";
import { Vignette } from "./components/Atmosphere";

/**
 * Submission screenshots. Each one has to carry a single claim on its own,
 * because a judge scrolling a gallery sees it without the video or the README.
 * Every figure here is real and was verified on-chain this session.
 */

const Frame: React.FC<{ kicker: string; title: string; children: React.ReactNode }> = ({
  kicker,
  title,
  children,
}) => (
  <AbsoluteFill style={{ background: C.ink, fontFamily: sans, color: C.fg }}>
    <div style={{ position: "absolute", inset: 0, padding: 72, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          fontFamily: mono,
          fontSize: 16,
          letterSpacing: 5,
          textTransform: "uppercase",
          color: C.faint,
        }}
      >
        {kicker}
      </div>
      <div style={{ fontFamily: serif, fontSize: 58, lineHeight: 1.08, marginTop: 16 }}>{title}</div>
      <div style={{ marginTop: 42, flex: 1 }}>{children}</div>
    </div>
    <Vignette />
  </AbsoluteFill>
);

const Row: React.FC<{ k: string; v: string; accent?: string; mono2?: boolean }> = ({
  k,
  v,
  accent = C.fg,
  mono2 = true,
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      padding: "18px 0",
      borderBottom: `1px solid ${C.line}`,
      gap: 30,
    }}
  >
    <span style={{ fontSize: 19, color: C.dim, whiteSpace: "nowrap" }}>{k}</span>
    <span
      style={{
        fontFamily: mono2 ? mono : sans,
        fontSize: 21,
        color: accent,
        textAlign: "right",
        wordBreak: "break-all",
      }}
    >
      {v}
    </span>
  </div>
);

/** 3 — the architecture, at its settled state. */
export const ShotFlow: React.FC = () => (
  <AbsoluteFill style={{ background: C.ink }}>
    <div style={{ position: "absolute", left: 96, top: 120, fontFamily: mono, fontSize: 17, letterSpacing: 5, textTransform: "uppercase", color: C.faint }}>
      How it fits together
    </div>
    <FlowDiagram />
    <div style={{ position: "absolute", left: 96, bottom: 84, fontFamily: mono, fontSize: 21, color: C.faint }}>
      23 tests · 13 against live Aave on a pinned fork · contract verified
    </div>
    <Vignette />
  </AbsoluteFill>
);

/** 4 — the agent paying itself, on a real chain, with the transaction. */
export const ShotHarvest: React.FC = () => (
  <Frame kicker="Permissionless · no keeper" title="The agent paid itself.">
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        padding: "10px 30px 24px",
      }}
    >
      <Row k="Released to the agent" v="0.016172 USDC" accent={C.flow} />
      <Row k="Principal committed" v="250000.000000" accent={C.hold} />
      <Row k="aTokens actually held" v="250000.000222" accent={C.flow} />
      <Row k="Principal after the harvest" v="unchanged" accent={C.flow} />
      <Row k="Caller" v="the agent itself, not a keeper" mono2={false} />
      <Row k="Transaction" v="0xeb03555c…c22830" />
      <Row k="Network" v="Base Sepolia · 0xE8b6f6C5…E4D4" />
    </div>

    <div
      style={{
        marginTop: 30,
        fontFamily: mono,
        fontSize: 16,
        color: C.dim,
        background: "#0a0d11",
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        padding: 22,
        lineHeight: 1.7,
      }}
    >
      <span style={{ color: C.faint }}>agent-ledger.jsonl</span>
      <br />
      {`{"event":"self_harvested","id":"1","amount":"0.016172",`}
      <br />
      {` "tx":"0xeb03555c77939a47e728ef5337dc11abd83028597e06e31163dddc6d3cf22830"}`}
    </div>

    <div style={{ marginTop: 26, fontSize: 21, color: C.dim, lineHeight: 1.5 }}>
      The amount came from Aave&apos;s index and the destination from storage, so there was nothing
      for the caller to choose and nothing to gain. That is why this needs no keeper.
    </div>
  </Frame>
);

/** 5 — the question an endowed agent actually needs answered. */
export const ShotMcp: React.FC = () => (
  <Frame kicker="The Graph · MCP" title={`Not "what is my balance".\n"What can I spend forever?"`}>
    <div
      style={{
        fontFamily: mono,
        fontSize: 19,
        background: "#0a0d11",
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: 30,
        lineHeight: 1.85,
      }}
    >
      <div style={{ color: C.faint }}>
        $ weir_sustainable_budget --agent 0xD3EFF024…C4c2 --burn 5
      </div>
      <div style={{ color: C.dim, marginTop: 16 }}>
        Sustainable budget for 0xD3EFF0247E7b61d75A34e1965939e736fe69C4c2
      </div>
      <div style={{ color: C.dim }}>
        #1 USDC: principal 250,000 @ 1.406% -&gt; 9.626996 USDC/day
      </div>
      <div style={{ color: C.dim, marginTop: 14 }}>
        TOTAL: 9.626996 /day&nbsp;&nbsp; 288.8099 /month&nbsp;&nbsp; 3513.85 /year
      </div>
      <div style={{ color: C.faint, fontSize: 17 }}>
        Principal is never spendable. This figure is what the endowment throws off
        <br />
        and can be spent forever.
      </div>
      <div style={{ color: C.flow, marginTop: 20, fontSize: 22, lineHeight: 1.5 }}>
        VERDICT: PERPETUAL. A burn of 5/day is 51.9% of income.
        <br />
        This agent never runs out.
      </div>
    </div>

    <div style={{ marginTop: 30, fontSize: 21, color: C.dim, lineHeight: 1.55, maxWidth: 1180 }}>
      Balance is the wrong question for an endowed agent, and actively misleading: the principal is
      visible but unspendable. The subgraph indexes every release, and the MCP server turns that
      history into the only answer that matters — whether a proposed burn rate survives forever.
    </div>

    <div
      style={{
        marginTop: 28,
        fontFamily: mono,
        fontSize: 16,
        color: C.faint,
      }}
    >
      api.studio.thegraph.com/query/1760272/weir/v0.0.1 · hasIndexingErrors: false
    </div>
  </Frame>
);
