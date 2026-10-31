"use client";

import { useEffect, useRef } from "react";

/**
 * Hero scroll animation, UNPINNED: the hero scrolls with the page and the
 * scene animates in sync with it. Scroll progress 0 → 1 is written to the
 * CSS variable --p, which the hero scene uses: at the top the airplane
 * sits under the CTA and the ship waits offshore; scrolling down, the
 * plane flies off and the ship sails into port; scrolling up reverses it.
 *
 * --p runs 0 (hero at the top of the page) → 1 (hero scrolled one viewport
 * up), so the page moves at the same time as the animation in BOTH
 * directions — it never waits for the plane to disappear or the ship to
 * reach port before the page itself moves.
 */
export function HeroScroll({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -rect.top / window.innerHeight));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={ref}
      className={`relative overflow-hidden bg-navy-900 text-white ${className}`}
      style={{ ["--p" as string]: 0 }}
    >
      {children}
    </section>
  );
}
