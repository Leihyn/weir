import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { C } from "../constants";
import { Bg, Browser, In, Kicker, Head, Body, Mono } from "../components/Chrome";
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
 * 3 — the drawing and the page it describes, side by side. The illustration on
 * its own was abstract; putting the live endowment card next to it is what makes
 * the point that this is a real running product, not a diagram.
 */
export const TheWeir: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const app = spring({ frame: frame - 60, fps, from: 0, to: 1, config: { damping: 30 } });
  return (
    <AbsoluteFill>
      <Bg index={2} ambient={false}>
        <In>
          <Kicker>Principal held · overflow released</Kicker>
        </In>
        <div style={{ marginTop: 24 }}>
          <WeirIllustration principal="250,000" spilling="0.896609" paid="0.01" width={1010} />
        </div>
        <In delay={54}>
          <div style={{ marginTop: 40, fontSize: 25, color: C.faint, maxWidth: 1000 }}>
            Live on Base Sepolia. Climbing roughly 116 units a second, as you watch.
          </div>
        </In>
      </Bg>

      {/* the same mechanic, running */}
      <div
        style={{
          position: "absolute",
          right: 96,
          top: 214,
          opacity: app,
          transform: `translateX(${(1 - app) * 26}px)`,
        }}
      >
        <Browser url="weir-khaki.vercel.app" width={700} height={632}>
          <OffthreadVideo
            src={staticFile("screen.mp4")}
            startFrom={30 * 38}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
            muted
          />
        </Browser>
        <div
          style={{
            fontFamily: mono,
            fontSize: 15,
            color: C.faint,
            letterSpacing: 1.5,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          THE SAME NUMBERS, ON THE LIVE PAGE
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * 4 — the proof. The inequality is the claim; the page beside it is the claim
 * being true right now, which is the part a judge can check themselves.
 */
export const Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const app = spring({ frame: frame - 40, fps, from: 0, to: 1, config: { damping: 30 } });
  return (
    <AbsoluteFill>
      <Bg index={3} ambient={false}>
        <In>
          <Kicker>The proof, not the claim</Kicker>
        </In>
        <In delay={10}>
          <div style={{ fontSize: 16, letterSpacing: 4, textTransform: "uppercase", color: C.faint }}>
            Principal committed
          </div>
          <Mono color={C.hold} size={76}>
            250000.00
          </Mono>
        </In>
        <In delay={22}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, margin: "14px 0 8px" }}>
            <span style={{ fontFamily: mono, fontSize: 40, lineHeight: 1, color: C.flow }}>&#8804;</span>
            <span style={{ fontFamily: mono, fontSize: 17, color: C.faint, letterSpacing: 1 }}>
              EVERY BLOCK
            </span>
          </div>
        </In>
        <In delay={30}>
          <div style={{ fontSize: 16, letterSpacing: 4, textTransform: "uppercase", color: C.faint }}>
            aTokens actually held
          </div>
          <Mono color={C.flow} size={76}>
            250000.89
          </Mono>
        </In>
        <In delay={48}>
          <Body width={860}>
            If that ever inverted the guarantee would be a lie, so the app shows it rather than
            asserting it.
          </Body>
        </In>
      </Bg>

      <div
        style={{
          position: "absolute",
          right: 96,
          top: 190,
          opacity: app,
          transform: `translateX(${(1 - app) * 26}px)`,
        }}
      >
        <Browser url="weir-khaki.vercel.app" width={760} height={680}>
          <OffthreadVideo
            src={staticFile("screen.mp4")}
            startFrom={30 * 72}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
            muted
          />
        </Browser>
        <div
          style={{
            fontFamily: mono,
            fontSize: 15,
            color: C.faint,
            letterSpacing: 1.5,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          SOLVENCY, READ FROM THE CHAIN
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * 5 — real footage of the live app. The page sits in a browser window on the
 * right and the words keep their own column on the left, so nothing is read
 * through anything else.
 */
export const Permissionless: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const rise = spring({ frame: frame - 6, fps, from: 0, to: 1, config: { damping: 28 } });
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {/* the live page, in a window, bleeding off the right edge */}
      <div
        style={{
          position: "absolute",
          left: 952,
          top: 176,
          opacity: rise * out,
          transform: `translateY(${(1 - rise) * 22}px)`,
        }}
      >
        <Browser url="weir-khaki.vercel.app" width={1130} height={716}>
          <OffthreadVideo
            src={staticFile("screen.mp4")}
            startFrom={30 * 58}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "left top" }}
            muted
          />
        </Browser>
      </div>

      {/* the column the words live in, lifted clear of the window */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(7,9,12,1) 0%, rgba(7,9,12,.98) 38%, rgba(7,9,12,0) 56%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "96px 96px 150px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          fontFamily: sans,
          color: C.fg,
        }}
      >
        <In>
          <Kicker>No keeper</Kicker>
        </In>
        <In delay={8}>
          <Head size={58}>
            Anyone can press it.
            <br />
            Nobody can redirect it.
          </Head>
        </In>
        <In delay={26}>
          <Body width={760}>
            The amount comes from Aave&apos;s index. The destination comes from storage. There is
            nothing for a caller to choose and nothing for a caller to gain.
          </Body>
        </In>
      </div>

      <Rail index={4} />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

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
