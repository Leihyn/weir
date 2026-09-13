import React from "react";
import { AbsoluteFill, Audio, Series, staticFile } from "remotion";
import { C, SCENES, sec } from "./constants";
import { Hook, Mechanism, TheWeir, TheWeirLive, Proof, Permissionless, Stack, Close } from "./scenes/Scenes";
import { Captions, CUES } from "./components/Captions";

/**
 * Timed to the recorded narration (158.5s). Section lengths are the written
 * script's proportions scaled to the real read, so the visuals track the words
 * without depending on word-level sync — each scene holds long enough to absorb
 * a little drift either way.
 */
export const WeirDemo: React.FC = () => (
  <AbsoluteFill style={{ background: C.ink }}>
    <Audio src={staticFile("vo.wav")} />
    <Series>
      <Series.Sequence durationInFrames={sec(SCENES.hook)}><Hook /></Series.Sequence>
      <Series.Sequence durationInFrames={sec(SCENES.mechanism)}><Mechanism /></Series.Sequence>
      <Series.Sequence durationInFrames={sec(SCENES.weirDraw)}><TheWeir /></Series.Sequence>
      <Series.Sequence durationInFrames={sec(SCENES.weirApp)}><TheWeirLive /></Series.Sequence>
      <Series.Sequence durationInFrames={sec(SCENES.proof)}><Proof /></Series.Sequence>
      <Series.Sequence durationInFrames={sec(SCENES.permissionless)}><Permissionless /></Series.Sequence>
      <Series.Sequence durationInFrames={sec(SCENES.stack)}><Stack /></Series.Sequence>
      <Series.Sequence durationInFrames={sec(SCENES.close)}><Close /></Series.Sequence>
    </Series>
    {/* burned in, timed to a transcript of the real narration */}
    <Captions cues={CUES} />
  </AbsoluteFill>
);
