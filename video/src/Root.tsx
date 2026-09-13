import React from "react";
import { Composition } from "remotion";
import { WeirDemo } from "./WeirDemo";
import { FPS, SCENES, sec } from "./constants";

const total = Object.values(SCENES).reduce((a, b) => a + sec(b as number), 0);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="WeirDemo"
    component={WeirDemo}
    durationInFrames={total}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
