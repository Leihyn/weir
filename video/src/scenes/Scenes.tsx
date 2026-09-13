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
 * 3 — the illustration carries this one, so it runs the full width of the frame
 * and the ambient water steps aside rather than drawing a second weir.
 */
export const TheWeir: React.FC = () => (
  <AbsoluteFill>
    <Bg index={2} ambient={false}>
      <In>
        <Kicker>Principal held · overflow released</Kicker>
      </In>
      <div style={{ marginTop: 26 }}>
        <WeirIllustration principal="250,000" spilling="0.896609" paid="0.01" width={1660} />
      </div>
      <In delay={50}>
        <div style={{ marginTop: 44, fontSize: 26, color: C.faint }}>
          Live on Base Sepolia. Climbing roughly 116 units a second, as you watch.
        </div>
      </In>
    </Bg>
  </AbsoluteFill>
);

/** 4 — the proof, shown as the inequality itself. */
export const Proof: React.FC = () => (
  <AbsoluteFill>
    <Bg index={3}>
      <In>
        <Kicker>The proof, not the claim</Kicker>
      </In>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 60, marginTop: 44 }}>
        <In delay={10}>
          <div>
            <div
              style={{
                fontSize: 16,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: C.faint,
              }}
            >
              Principal committed
            </div>
            <Mono color={C.hold} size={72}>
              250000.00
            </Mono>
          </div>
        </In>
        <In delay={22}>
          <div style={{ fontSize: 60, color: C.faint, paddingBottom: 10 }}>≤</div>
        </In>
        <In delay={30}>
          <div>
            <div
              style={{
                fontSize: 16,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: C.faint,
              }}
            >
              aTokens actually held
            </div>
            <Mono color={C.flow} size={72}>
              250000.89
            </Mono>
          </div>
        </In>
      </div>
      <In delay={48}>
        <Body>
          Committed is less than or equal to held, every block. If that ever inverted the guarantee
          would be a lie, so it is shown rather than asserted.
        </Body>
      </In>
    </Bg>
  </AbsoluteFill>
);

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

/** 6 — what each partner actually does, one line each. */
export const Stack: React.FC = () => {
  const rows: [string, string][] = [
    ["Aave v3", "the liquidity index every figure is derived from"],
    ["The Graph", "indexes every release; the agent asks what it can spend forever"],
    ["Uniswap", "converts a WETH endowment's yield into the USDC bills are paid in"],
    ["Privy", "how an owner signs in and commits principal"],
  ];
  return (
    <AbsoluteFill>
      <Bg index={5}>
        <In>
          <Kicker>Built on</Kicker>
        </In>
        <div style={{ marginTop: 34, maxWidth: 1130 }}>
          {rows.map(([name, what], i) => (
            <In key={name} delay={10 + i * 9}>
              <div
                style={{
                  display: "flex",
                  gap: 34,
                  alignItems: "baseline",
                  padding: "20px 0",
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <span style={{ fontFamily: serif, fontSize: 40, minWidth: 230 }}>{name}</span>
                <span style={{ fontSize: 25, color: C.dim }}>{what}</span>
              </div>
            </In>
          ))}
        </div>
        <In delay={54}>
          <div style={{ marginTop: 38, fontFamily: mono, fontSize: 24, color: C.faint }}>
            23 tests · 13 against live Aave on a pinned fork · contract verified
          </div>
        </In>
      </Bg>
    </AbsoluteFill>
  );
};

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
