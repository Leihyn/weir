import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../constants";
import { sans, mono } from "../fonts";

export const Bg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    width: "100%", height: "100%", background: C.ink, color: C.fg,
    fontFamily: sans, padding: 96, boxSizing: "border-box",
    display: "flex", flexDirection: "column", justifyContent: "center",
  }}>{children}</div>
);

export const Wordmark: React.FC = () => (
  <div style={{ position: "absolute", top: 56, left: 96, display: "flex",
                alignItems: "center", gap: 14 }}>
    <svg width="30" height="30" viewBox="0 0 26 26" fill="none">
      <path d="M2 7h10v12H2z" fill={C.hold} opacity=".5" />
      <path d="M12 7v12" stroke={C.fg} strokeWidth="1.6" />
      <path d="M12 9c4 0 4 4 12 4" stroke={C.flow} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
    <span style={{ fontSize: 15, letterSpacing: 6, textTransform: "uppercase",
                   color: C.faint, fontFamily: mono }}>Weir</span>
  </div>
);

/** Staggered entrance. Never scales from 0; minimum 0.93 per the house rules. */
export const In: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);
  const opacity = spring({ frame: f, fps, from: 0, to: 1, config: { damping: 30 } });
  const y = spring({ frame: f, fps, from: 18, to: 0, config: { damping: 26 } });
  return <div style={{ opacity, transform: `translateY(${y}px)` }}>{children}</div>;
};

export const Kicker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: mono, fontSize: 17, letterSpacing: 5,
                textTransform: "uppercase", color: C.faint, marginBottom: 26 }}>
    {children}
  </div>
);

export const Head: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 92 }) => (
  <h1 style={{ fontFamily: serifFamily(), fontSize: size, lineHeight: 1.06,
               margin: 0, fontWeight: 400, letterSpacing: "-0.015em" }}>{children}</h1>
);

import { serif } from "../fonts";
function serifFamily() { return serif; }

export const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ fontSize: 30, lineHeight: 1.5, color: C.dim, maxWidth: 1180, margin: "28px 0 0" }}>
    {children}
  </p>
);

export const Mono: React.FC<{ children: React.ReactNode; color?: string; size?: number }> =
  ({ children, color = C.flow, size = 34 }) => (
  <span style={{ fontFamily: mono, color, fontSize: size, fontVariantNumeric: "tabular-nums" }}>
    {children}
  </span>
);
