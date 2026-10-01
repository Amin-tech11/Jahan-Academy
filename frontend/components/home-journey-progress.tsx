"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function HomeJourneyProgress({ children }: { children: ReactNode }) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const steps = Array.from(listRef.current?.querySelectorAll<HTMLElement>(".home-process__step") ?? []);
    let frame: number | null = null;
    const update = () => {
      frame = null;
      const focusLine = window.innerHeight * 0.5;
      let activeStep: HTMLElement | undefined;
      let closestDistance = Infinity;
      for (const step of steps) {
        const copy = step.querySelector<HTMLElement>(".home-process__copy");
        if (!copy) continue;
        const bounds = copy.getBoundingClientRect();
        if (bounds.top > window.innerHeight * 0.65 || bounds.bottom < window.innerHeight * 0.15) continue;
        const distance = Math.abs((bounds.top + bounds.bottom) / 2 - focusLine);
        if (distance < closestDistance) {
          closestDistance = distance;
          activeStep = step;
        }
      }
      for (const step of steps) {
        if (step === activeStep) step.dataset.active = "true";
        else delete step.dataset.active;
      }
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <ol ref={listRef} className="home-process__steps">{children}</ol>;
}
