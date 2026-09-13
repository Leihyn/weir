# Weir demo video

Remotion project for the ETHOnline submission video.

## Constraints it is built to satisfy

ETHOnline rejects videos outside 2–4 minutes, under 720p, sped up, or narrated by a text-to-speech
synthesiser. This renders at **1920×1080, 158.5s (2:38)**, at natural speed, over a **human-recorded**
narration.

## Audio

`public/vo.wav` is the narrator's own recording, cleaned only — never synthesised:

```
highpass=f=80            remove room rumble
afftdn=nf=-25            gentle broadband noise reduction
loudnorm  -25.1 → -18.7 LUFS, true peak -1.5 dBTP
alimiter                 catch stray peaks
```

Measured before and after with `ffmpeg -af loudnorm=print_format=summary`. The raw take is kept at
`public/vo-raw.m4a` so the edit is auditable.

## Screen footage

`public/screen.mp4` is a **scripted** Playwright recording of the live deployment at
`https://weir-khaki.vercel.app` — timed scroll holds, 1280×720, deviceScaleFactor 2. Scripted rather
than hand-captured so it is reproducible and free of cursor noise.

## Timing

Section lengths are the written script's proportions scaled to the real 158.5s read, so the visuals
track the words without depending on word-level sync. Each scene holds long enough to absorb drift.

| Scene | Seconds |
|---|---|
| Hook — the problem | 15.4 |
| Mechanism — the formula | 23.1 |
| The weir — the illustration | 30.0 |
| Proof — solvency inequality | 25.7 |
| Permissionless — live footage | 25.7 |
| Stack — the partners | 25.7 |
| Close | 12.9 |

## Run

```bash
npm install
npm run studio    # scrub before rendering
npm run render    # -> out/weir-demo.mp4
```

Follows `~/.claude/remotion-best-practices.md`: fonts via `@remotion/google-fonts` (never CDN),
assets via `staticFile()`, `spring()` for entrances with nothing scaling from 0, `<Series>` for
sequential sections, and colours from `src/constants.ts` synced to the app's design tokens.
