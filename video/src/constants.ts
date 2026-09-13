/** Synced with the app's design tokens in app/app/globals.css. */
export const C = {
  ink: "#07090c",
  surface: "#0d1117",
  raised: "#131b24",
  line: "#1d2933",
  fg: "#eef4f8",
  dim: "#8ca3b5",
  faint: "#5b7183",
  hold: "#3f6f9e",
  holdLo: "#17304a",
  flow: "#35e7c3",
  flowLo: "#0f5f52",
  warn: "#f2a93b",
} as const;

export const FPS = 30;
export const TOTAL_SECONDS = 158.5;   // matches the recorded narration exactly

/** Section durations in seconds, scaled from the written script to the real read. */
export const SCENES = {
  hook: 15.4,
  mechanism: 23.1,
  weirDraw: 13.0,
  weirApp: 17.0,
  proof: 25.7,
  permissionless: 25.7,
  stack: 25.7,
  close: 12.9,
} as const;

export const sec = (s: number) => Math.round(s * FPS);
