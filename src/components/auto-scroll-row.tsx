"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface AutoScrollRowProps {
  children: ReactNode;
  className?: string;
}

const ADVANCE_INTERVAL_MS = 3000;
const SCROLL_STEP_PX = 240;

// Same pause-on-interaction pattern as SpotlightStrip (home page) — auto
// motion is never a trap, it stops the moment a viewer actually looks at
// it and resumes once they're done.
export default function AutoScrollRow({
  children,
  className,
}: AutoScrollRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  // Computed directly in the initializer (runs once, during render) rather
  // than via an effect + setState, which would trigger an avoidable extra
  // render right after mount.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;
    const el = containerRef.current;
    if (!el) return;

    const timer = setInterval(() => {
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: SCROLL_STEP_PX, behavior: "smooth" });
      }
    }, ADVANCE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {children}
    </div>
  );
}
