// FX Registry — single place where backgrounds are mapped.
// Swap any screen's background by editing config/backgrounds.ts.
import { FxFactory } from "./core";
import { fxFirefly } from "./effects/firefly";
import { fxJarvis } from "./effects/jarvis";
import { fxNebula } from "./effects/nebula";
import { fxHudFrame } from "./effects/hudframe";
import { fxAurora } from "./effects/aurora";
import { fxHex } from "./effects/hex";
import { fxSilk } from "./effects/silk";
import { fxJelly } from "./effects/jelly";

export type FxName = "firefly" | "jarvis" | "nebula" | "hudframe" | "aurora" | "hex" | "silk" | "jelly";

export const FX_REGISTRY: Record<FxName, FxFactory> = {
  firefly: fxFirefly,
  jarvis: fxJarvis,
  nebula: fxNebula,
  hudframe: fxHudFrame,
  aurora: fxAurora,
  hex: fxHex,
  silk: fxSilk,
  jelly: fxJelly,
};
