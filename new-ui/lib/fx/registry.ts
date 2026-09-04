// FX Registry — single place where backgrounds are mapped.
// Swap any screen's background by editing config/backgrounds.ts.
import { FxFactory } from "./core";
import { fxFirefly } from "./effects/firefly";
import { fxJarvis } from "./effects/jarvis";
import { fxNebula } from "./effects/nebula";

export type FxName = "firefly" | "jarvis" | "nebula";

export const FX_REGISTRY: Record<FxName, FxFactory> = {
  firefly: fxFirefly,
  jarvis: fxJarvis,
  nebula: fxNebula,
};
