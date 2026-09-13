import React from "react";
import { Composition } from "remotion";
import { WeirDemo } from "./WeirDemo";
import { LogoA, LogoB, LogoC, LogoCompare, Cover } from "./Brand";
import { ShotFlow, ShotHarvest, ShotMcp } from "./Shots";
import { FPS, SCENES, sec } from "./constants";

const total = Object.values(SCENES).reduce((a, b) => a + sec(b as number), 0);
const still = { durationInFrames: 1, fps: FPS };

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="WeirDemo" component={WeirDemo} durationInFrames={total} fps={FPS} width={1920} height={1080} />
    <Composition id="LogoA" component={LogoA} {...still} width={512} height={512} />
    <Composition id="LogoB" component={LogoB} {...still} width={512} height={512} />
    <Composition id="LogoC" component={LogoC} {...still} width={512} height={512} />
    <Composition id="LogoCompare" component={LogoCompare} {...still} width={1400} height={620} />
    <Composition id="Cover" component={Cover} {...still} width={1280} height={720} />
    <Composition id="ShotFlow" component={ShotFlow} {...still} width={1920} height={1080} />
    <Composition id="ShotHarvest" component={ShotHarvest} {...still} width={1600} height={1000} />
    <Composition id="ShotMcp" component={ShotMcp} {...still} width={1600} height={880} />
  </>
);
