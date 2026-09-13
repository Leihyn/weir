import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../constants";
import { sans, mono, serif } from "../fonts";
import { AmbientWeir, Grain, Rail, Vignette } from "./Atmosphere";

/**
 * Every scene sits in this frame: a text column on the left, the weir living in
 * the right of frame, grain and a vignette over the top. The column is capped
 * well short of the crest at x=1272 so words never cross the water.
 */
export const Bg: React.FC<{
  children: React.ReactNode;
  /** which section we are in, for the rail */
  index: number;
  /** scenes carrying their own artwork (footage, the big illustration) suppress the ambient water */
  ambient?: boolean;
}> = ({ children, index, ambient = true }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      background: C.ink,
      color: C.fg,
      fontFamily: sans,
      position: "relative",
      overflow: "hidden",
    }}
  >
    {ambient && <AmbientWeir />}
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "96px 96px 150px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
    <Wordmark />
    <Rail index={index} />
    <Vignette />
    <Grain />
  </div>
);

export const Wordmark: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 56,
      left: 96,
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}
  >
    <svg width="30" height="30" viewBox="0 0 26 26" fill="none">
      <path d="M2 7h10v12H2z" fill={C.hold} opacity=".5" />
      <path d="M12 7v12" stroke={C.fg} strokeWidth="1.6" />
      <path d="M12 9c4 0 4 4 12 4" stroke={C.flow} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
    <span
      style={{
        fontSize: 15,
        letterSpacing: 6,
        textTransform: "uppercase",
        color: C.faint,
        fontFamily: mono,
      }}
    >
      Weir
    </span>
  </div>
);

/** Staggered entrance. Never scales from 0; minimum 0.93 per the house rules. */
export const In: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);
  const opacity = spring({ frame: f, fps, from: 0, to: 1, config: { damping: 30 } });
  const y = spring({ frame: f, fps, from: 18, to: 0, config: { damping: 26 } });
  return <div style={{ opacity, transform: `translateY(${y}px)` }}>{children}</div>;
};

export const Kicker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: mono,
      fontSize: 17,
      letterSpacing: 5,
      textTransform: "uppercase",
      color: C.faint,
      marginBottom: 26,
    }}
  >
    {children}
  </div>
);

export const Head: React.FC<{ children: React.ReactNode; size?: number }> = ({
  children,
  size = 92,
}) => (
  <h1
    style={{
      fontFamily: serif,
      fontSize: size,
      lineHeight: 1.06,
      margin: 0,
      fontWeight: 400,
      letterSpacing: "-0.015em",
    }}
  >
    {children}
  </h1>
);

export const Body: React.FC<{ children: React.ReactNode; width?: number }> = ({
  children,
  width = 1040,
}) => (
  <p
    style={{
      fontSize: 30,
      lineHeight: 1.5,
      color: C.dim,
      maxWidth: width,
      margin: "28px 0 0",
    }}
  >
    {children}
  </p>
);

export const Mono: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({
  children,
  color = C.flow,
  size = 34,
}) => (
  <span
    style={{
      fontFamily: mono,
      color,
      fontSize: size,
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {children}
  </span>
);

/** A browser window the live footage sits inside, so it reads as a real page. */
export const Browser: React.FC<{ children: React.ReactNode; url: string; width: number; height: number }> = ({
  children,
  url,
  width,
  height,
}) => (
  <div
    style={{
      width,
      height,
      borderRadius: 12,
      overflow: "hidden",
      background: C.surface,
      border: `1px solid ${C.line}`,
      boxShadow: "0 40px 90px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.03)",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        height: 40,
        flexShrink: 0,
        background: C.raised,
        borderBottom: `1px solid ${C.line}`,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 14px",
      }}
    >
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <div key={c} style={{ width: 10, height: 10, borderRadius: 5, background: c, opacity: 0.85 }} />
      ))}
      <div
        style={{
          marginLeft: 12,
          fontFamily: mono,
          fontSize: 13,
          color: C.faint,
          letterSpacing: 0.4,
        }}
      >
        {url}
      </div>
    </div>
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>{children}</div>
  </div>
);
