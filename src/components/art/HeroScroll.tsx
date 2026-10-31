"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll-driven hero ("scrollytelling"): the section is taller than the
 * screen and its content stays pinned while you scroll through it. Scroll
 * progress 0 → 1 is written to the CSS variable --p, which the hero scene
 * uses: at the top the airplane is in the sky; scrolling down, it flies
 * off and the container ship sails into port; scrolling up reverses it.
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
      const travel = el.offsetHeight - window.innerHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
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
    <section ref={ref} className={`hero-scroll relative h-[170vh] bg-navy-900 text-white ${className}`} style={{ ["--p" as string]: 0 }}>
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-hidden">{children}</div>
    </section>
  );
}
