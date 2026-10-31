"use client";

import { useEffect, useState } from "react";
import { Truck } from "./art/ServiceArt";
import { Icon, type IconName } from "./Icon";

/**
 * "How it works" with a driving truck: the truck goes from step to step;
 * the step it just left (its last destination) blurs, and the step it
 * arrives at comes into focus. Loops. Static for prefers-reduced-motion.
 */
export interface Step {
  icon: IconName;
  title: string;
  body: string;
}

const DWELL_MS = 8000; // the truck stays at least 8 s at each arrival
const DRIVE_MS = 1200; // drive between steps (focus lands on arrival)
const STOP_MS = DRIVE_MS + DWELL_MS; // full cycle per step: drive, then dwell

export function HowItWorks({ steps }: { steps: Step[] }) {
  const [active, setActive] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setMotion(true);
    const id = window.setInterval(() => {
      setActive((current) => {
        if (current < steps.length - 1) return current + 1;
        // After the last step: jump back to the start without driving backwards.
        setResetting(true);
        window.setTimeout(() => setResetting(false), 60);
        return 0;
      });
    }, STOP_MS);
    return () => window.clearInterval(id);
  }, [steps.length]);

  const centre = (i: number) => ((i + 0.5) / steps.length) * 100;
  const last = active === 0 ? -1 : active - 1;

  return (
    <ol className="relative mt-12 grid gap-6 md:grid-cols-4">
      {/* The road and the truck (wide screens) */}
      <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-[44px] hidden h-px bg-[repeating-linear-gradient(90deg,#94a3b8_0_6px,transparent_6px_12px)] md:block" />
      {motion && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-[12px] z-10 hidden w-[64px] -translate-x-1/2 md:block"
          style={{
            left: `${centre(active)}%`,
            transition: resetting ? "none" : `left ${DRIVE_MS}ms cubic-bezier(0.45, 0.05, 0.25, 1)`,
            opacity: resetting ? 0 : 1,
          }}
        >
          <Truck inverse className="h-auto w-full drop-shadow-[0_4px_6px_rgba(11,27,63,0.18)]" />
        </span>
      )}

      {steps.map((step, i) => {
        const focused = motion && i === active;
        const leftBehind = motion && i === last;
        return (
          <li
            key={step.title}
            className={`relative rounded-2xl p-4 transition-all duration-700 md:p-5 md:pt-[60px] md:text-center ${
              focused
                ? "scale-[1.04] bg-white shadow-[0_18px_40px_-20px_rgba(11,27,63,0.35)] ring-2 ring-blue-200"
                : leftBehind
                  ? "opacity-50 blur-[2px]"
                  : ""
            }`}
            style={{ transitionDelay: focused ? `${DRIVE_MS - 300}ms` : "0ms" }}
          >
            <span
              className={`relative flex h-12 w-12 items-center justify-center rounded-full border bg-white shadow-sm transition-colors duration-700 md:mx-auto ${
                focused ? "border-blue-600 text-blue-700" : "border-slate-200 text-navy-900"
              }`}
            >
              <Icon name={step.icon} size={22} />
            </span>
            <h3 className="mt-5 font-semibold text-navy-900">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
          </li>
        );
      })}
    </ol>
  );
}
