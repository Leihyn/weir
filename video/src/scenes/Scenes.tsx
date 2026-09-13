import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { C } from "../constants";
import { AppScene, Bg, In, Kicker, Head, Body, Mono } from "../components/Chrome";
import { Grain, Rail, Vignette } from "../components/Atmosphere";
import { WeirIllustration } from "../components/WeirIllustration";
import { FlowDiagram } from "../components/Flow";
import { mono, sans, serif } from "../fonts";

/** 1 — the problem, stated as an arithmetic fact rather than a worry. */
export const Hook: React.FC = () => (
  <AbsoluteFill>
    <Bg index={0}>
      <In>
        <Kicker>The problem</Kicker>
      </In>
      <In delay={8}>
        <Head>
          Your agent&apos;s bills
          <br />
          <span style={{ color: C.flow }}>outlive its budget.</span>
        </Head>
      </In>
      <In delay={22}>
        <Body>
          A $12/month subscription funded with $500 dies in forty months, and so does whatever the
          agent was maintaining.
        </Body>
      </In>
      <In delay={40}>
        <div style={{ marginTop: 40, fontFamily: mono, fontSize: 30, color: C.fg }}>
          Recurring costs do not stop. <span style={{ color: C.flow }}>Budgets do.</span>
        </div>
      </In>
    </Bg>
  </AbsoluteFill>
);

/** 2 — the mechanism, with the formula as the hero object. */
export const Mechanism: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const underline = spring({ frame: frame - 30, fps, from: 0, to: 1, config: { damping: 28 } });
  return (
    <AbsoluteFill>
      <Bg index={1}>
        <In>
          <Kicker>What Weir does</Kicker>
        </In>
        <In delay={6}>
          <Head size={74}>
            Endow the bill,
            <br />
            not the agent.
          </Head>
        </In>
        <In delay={20}>
          <Body>
            Principal goes into Aave once and stays. The agent is paid only what the index adds.
          </Body>
        </In>
        <In delay={34}>
          <div style={{ marginTop: 52, fontFamily: mono, fontSize: 42, color: C.fg }}>
            accrued = P × (i₁ − i₀) / i₀
            <div
              style={{
                height: 3,
                background: C.flow,
                marginTop: 14,
                width: `${underline * 560}px`,
                borderRadius: 2,
              }}
            />
          </div>
        </In>
        <In delay={52}>
          <div style={{ marginTop: 26, fontSize: 26, color: C.faint, maxWidth: 1040 }}>
            There is no amount parameter. Nothing to pass in, and nothing to abuse.
          </div>
        </In>
      </Bg>
    </AbsoluteFill>
  );
};

/**
 * 3a — the drawing on its own, full frame. It is the one picture that explains
 * the mechanic, so nothing shares the frame with it.
 */
export const TheWeir: React.FC = () => (
  <AbsoluteFill>
    <Bg index={2} ambient={false}>
      <In>
        <Kicker>Principal held · overflow released</Kicker>
      </In>
      <div style={{ marginTop: 24 }}>
        <WeirIllustration principal="250,000" spilling="0.896609" paid="0.01" width={1660} />
      </div>
    </Bg>
  </AbsoluteFill>
);

/**
 * 3b — and then the page it describes, at full size. Every earlier cut put the
 * UI in a window taking a quarter of the frame, which is unreadable on playback
 * and so defeats the only reason to show a product at all.
 */
export const TheWeirLive: React.FC = () => (
  <AppScene
    index={2}
    kicker="The same numbers, live"
    startSeconds={38}
  />
);

/**
 * 4 — the proof, shown at full size. A 760px window inside a 1920 frame made
 * the UI unreadable on playback, which defeats the point of showing it at all,
 * so the page now fills the frame and the words move to the caption line.
 */
export const Proof: React.FC = () => (
  <AppScene
    index={3}
    kicker="The proof, not the claim"
    startSeconds={72}
  />
);

/**
 * 5 — the release anyone may press, at full size for the same reason.
 */
export const Permissionless: React.FC = () => (
  <AppScene
    index={4}
    kicker="No keeper"
    startSeconds={100}
  />
);

/**
 * 6 — how it actually fits together. A list of partner names says nothing about
 * whether the integration is real, so this draws the edges instead and hangs
 * each partner off the edge it genuinely touches.
 */
export const Stack: React.FC = () => (
  <AbsoluteFill>
    <Bg index={5} ambient={false}>
      <span />
    </Bg>
    <div style={{ position: "absolute", left: 96, top: 150 }}>
      <In>
        <Kicker>How it fits together</Kicker>
      </In>
    </div>
    <FlowDiagram />
    <div
      style={{
        position: "absolute",
        left: 96,
        bottom: 96,
        fontFamily: mono,
        fontSize: 22,
        color: C.faint,
      }}
    >
      23 tests · 13 against live Aave on a pinned fork · contract verified
    </div>
  </AbsoluteFill>
);

/** 7 — land on the one sentence worth remembering. */
export const Close: React.FC = () => (
  <AbsoluteFill>
    <Bg index={6}>
      <In>
        <Head size={80}>
          An endowment your agent
          <br />
          <span style={{ color: C.flow }}>cannot outspend.</span>
        </Head>
      </In>
      <In delay={24}>
        <Body>Because the cap is arithmetic, not a policy it could edit.</Body>
      </In>
      <In delay={44}>
        <div style={{ marginTop: 46, fontFamily: mono, fontSize: 24, color: C.faint }}>
          weir-khaki.vercel.app · 0xE8b6f6C5…E4D4 · Base Sepolia
        </div>
      </In>
    </Bg>
  </AbsoluteFill>
);
