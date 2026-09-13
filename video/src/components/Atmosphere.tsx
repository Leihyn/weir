import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../constants";

/**
 * The treatment that makes the frame feel photographed rather than exported:
 * grain, a vignette, and a body of water living in the right of frame.
 *
 * All three are cheap on purpose. The grain is one small SVG tile the browser
 * rasterises once and we then slide around, not a full-frame filter re-evaluated
 * 4755 times.
 */

const NOISE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>
     <filter id='n'>
       <feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/>
       <feColorMatrix type='saturate' values='0'/>
     </filter>
     <rect width='180' height='180' filter='url(#n)' opacity='0.5'/>
   </svg>`,
)}")`;

/** Film grain. Jumps to a new offset every other frame so it flickers like real stock. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.045 }) => {
  const frame = useCurrentFrame();
  const step = Math.floor(frame / 2);
  const x = (step * 71) % 180;
  const y = (step * 113) % 180;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: NOISE,
        backgroundPosition: `${x}px ${y}px`,
        opacity,
        pointerEvents: "none",
        mixBlendMode: "overlay",
      }}
    />
  );
};

/** Pulls the eye to the middle of the frame and stops the corners looking flat. */
export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(120% 95% at 42% 45%, rgba(0,0,0,0) 38%, rgba(0,0,0,.34) 78%, rgba(0,0,0,.62) 100%)",
      pointerEvents: "none",
    }}
  />
);

/**
 * The mechanic living quietly in the right of frame on every scene: water held
 * behind a crest, overflow sliding away down-right. Slow enough to read as
 * atmosphere rather than motion, so it never competes with the words.
 */
export const AmbientWeir: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // the held surface breathes a few pixels; it never falls
  const surface = Math.sin(t * 0.55) * 5;
  const crestX = 1272;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      {/* the held body, filling the right of frame behind everything */}
      <div
        style={{
          position: "absolute",
          left: crestX - 430,
          right: 0,
          top: 210 + surface,
          bottom: 0,
          background: `linear-gradient(165deg, ${C.holdLo} 0%, rgba(13,17,23,0) 72%)`,
          opacity: 0.5,
          // feather the left edge so it reads as a body of water, not a rectangle
          maskImage: "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 46%)",
          WebkitMaskImage: "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 46%)",
        }}
      />
      {/* the waterline */}
      <div
        style={{
          position: "absolute",
          left: crestX - 430,
          width: 430,
          top: 210 + surface,
          height: 1,
          background: `linear-gradient(90deg, rgba(63,111,158,0) 0%, rgba(63,111,158,.55) 100%)`,
        }}
      />
      {/* the crest: fixed, the one thing that never moves */}
      <div
        style={{
          position: "absolute",
          left: crestX,
          top: 196,
          bottom: 0,
          width: 2,
          background: `linear-gradient(180deg, rgba(238,244,248,.30) 0%, rgba(238,244,248,0) 88%)`,
        }}
      />
      {/* the overflow: streaks sliding over the crest and away */}
      {Array.from({ length: 7 }).map((_, i) => {
        const cycle = 5.4 + i * 0.83;
        const p = ((t + i * 1.7) % cycle) / cycle;
        const x = crestX + p * 640;
        const y = 196 + p * p * 760;
        const a = interpolate(p, [0, 0.12, 0.7, 1], [0, 0.5, 0.28, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 92 + i * 13,
              height: 1,
              transform: `rotate(${16 + i * 2.4}deg)`,
              transformOrigin: "left center",
              background: `linear-gradient(90deg, rgba(53,231,195,${a}) 0%, rgba(53,231,195,0) 100%)`,
            }}
          />
        );
      })}
      {/* the pool the overflow lands in */}
      <div
        style={{
          position: "absolute",
          left: crestX + 40,
          right: 0,
          bottom: 0,
          height: 150,
          background: `linear-gradient(180deg, rgba(53,231,195,0) 0%, rgba(53,231,195,.085) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Where we are in the film. Fills the lower band with something that earns its place. */
export const Rail: React.FC<{ index: number; count?: number }> = ({ index, count = 7 }) => (
  <div
    style={{
      position: "absolute",
      left: 96,
      bottom: 62,
      display: "flex",
      gap: 8,
      alignItems: "center",
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          width: i === index ? 34 : 14,
          height: 2,
          borderRadius: 1,
          background: i === index ? C.flow : i < index ? C.hold : C.line,
          opacity: i === index ? 0.95 : i < index ? 0.5 : 0.8,
        }}
      />
    ))}
  </div>
);
