// Background configuration — change a screen's background here (1 line).
// All available effects live in lib/fx/registry.ts
import { FxName } from "@/lib/fx/registry";

export const BACKGROUNDS: Record<"entry" | "instruction" | "workspace", FxName> = {
  entry: "firefly",
  instruction: "jarvis",
  workspace: "nebula",
};
