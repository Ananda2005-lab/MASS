"use client";

// Full-screen animated background canvas.
// Usage: <FxBackground name="jarvis" />
"use client";

import { useEffect, useRef } from "react";
import { makeFx } from "@/lib/fx/core";
import { FX_REGISTRY, FxName } from "@/lib/fx/registry";

export default function FxBackground({ name }: { name: FxName }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const factory = FX_REGISTRY[name];
    if (!factory) return;
    const cleanup = makeFx(canvas, factory);
    return cleanup;
  }, [name]);

  return (
    <canvas
      ref={ref}
      className="bg pointer-events-none fixed inset-0 z-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
