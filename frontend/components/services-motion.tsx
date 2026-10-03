"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ServicesMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const sections = [...container.querySelectorAll<HTMLElement>(".services-feature__grid, .services-cta__layout")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const start = window.innerHeight * .92;
      const distance = Math.max(window.innerHeight * .32, 1);
      for (const section of sections) {
        // Derive progress from layout, never from the transformed image or card.
        const progress = reducedMotion.matches || section.contains(document.activeElement)
          ? 1
          : Math.min(1, Math.max(0, (start - section.getBoundingClientRect().top) / distance));
        section.style.setProperty("--service-progress", progress.toFixed(4));
        section.dataset.motion = "ready";
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(container);
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);
    container.addEventListener("focusin", schedule);
    container.addEventListener("focusout", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", schedule);
      container.removeEventListener("focusin", schedule);
      container.removeEventListener("focusout", schedule);
      resizeObserver.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      for (const section of sections) {
        section.style.removeProperty("--service-progress");
        delete section.dataset.motion;
      }
    };
  }, []);

  return <div ref={root} className="services-motion">{children}</div>;
}
