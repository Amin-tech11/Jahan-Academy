"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function HomeJourneyProgress({ children }: { children: ReactNode }) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const steps = Array.from(listRef.current?.querySelectorAll<HTMLElement>(".home-process__step") ?? []);
    let frame: number | null = null;
    const update = () => {
      frame = null;
      const arrivalLine = window.innerHeight * 0.65;
      for (const step of steps) {
        const copy = step.querySelector<HTMLElement>(".home-process__copy");
        if (copy && copy.getBoundingClientRect().top <= arrivalLine) {
          step.dataset.reached = "true";
        }
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
