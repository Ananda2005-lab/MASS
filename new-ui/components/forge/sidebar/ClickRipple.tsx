"use client";

// Global click FX — kisi bhi button/link pe click hote hi colorful radial flash.
// Body-level fixed element, koi layout side-effect nahi.

import { useEffect } from "react";

export function ClickRipple() {
  useEffect(() => {
    function onDown(e: PointerEvent) {
      const el = (e.target as HTMLElement)?.closest?.("button, [role='switch'], a");
      if (!el) return;
      const s = document.createElement("span");
      s.className = "click-ripple";
      s.style.left = `${e.clientX - 55}px`;
      s.style.top = `${e.clientY - 55}px`;
      document.body.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
    }
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, []);
  return null;
}
