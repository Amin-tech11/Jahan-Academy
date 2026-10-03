"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Find the point at a viewport Y coordinate on the actual rendered SVG curve. */
export function journeyPoint(path: SVGPathElement, viewportY: number) {
  const matrix = path.getScreenCTM();
  if (!matrix) return null;
  const length = path.getTotalLength();
  const pointAt = (distance: number) => {
    const point = path.getPointAtLength(distance);
    return { x: matrix.a * point.x + matrix.c * point.y + matrix.e, y: matrix.b * point.x + matrix.d * point.y + matrix.f };
  };
  let low = 0;
  let high = length;
  // All journey segments run monotonically downwards, including the mobile line.
  for (let i = 0; i < 18; i++) {
    const middle = (low + high) / 2;
    if (pointAt(middle).y < viewportY) low = middle;
    else high = middle;
  }
  return pointAt((low + high) / 2);
}

export function HomeJourneyProgress({ children }: { children: ReactNode }) {
  const listRef = useRef<HTMLOListElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const dot = dotRef.current;
    if (!list || !dot) return;
    const steps = Array.from(list.querySelectorAll<HTMLElement>(".home-process__step")).map((step) => ({
      step,
      rail: step.querySelector<HTMLElement>(".home-process__rail"),
      path: step.querySelector<SVGPathElement>(".home-process__rail path"),
      marker: step.querySelector<HTMLElement>(".home-process__number"),
    }));
    let frame: number | null = null;
    const update = () => {
      frame = null;
      const focusLine = window.innerHeight * 0.5;
      const segments = steps.flatMap((entry) => entry.rail && entry.path && entry.marker
        ? [{ ...entry, bounds: entry.rail.getBoundingClientRect() }] : []);
      if (!segments.length) return;
      const first = segments[0].bounds.top;
      const last = segments[segments.length - 1].bounds.bottom;
      const viewportY = Math.max(first, Math.min(last, focusLine));
      const segment = segments.find((entry) => viewportY <= entry.bounds.bottom) ?? segments[segments.length - 1];
      const point = journeyPoint(segment.path!, viewportY);
      if (!point) return;
      const origin = list.parentElement!.getBoundingClientRect();
      dot.style.transform = `translate3d(${point.x - origin.left}px, ${point.y - origin.top}px, 0) translate(-50%, -50%)`;
      dot.dataset.ready = "true";

      let active: HTMLElement | undefined;
      let nearest = Infinity;
      let absorption = 0;
      for (const entry of segments) {
        const marker = entry.marker!.getBoundingClientRect();
        const center = (marker.top + marker.bottom) / 2;
        const distance = Math.abs(point.y - center);
        const radius = marker.height / 2;
        entry.step.style.setProperty("--journey-fill", "0");
        // Exchange the moving dot for a radial fill as it reaches the numbered circle.
        if (focusLine >= first && focusLine <= last && distance <= radius + 14 && distance < nearest) {
          active = entry.step;
          nearest = distance;
          const progress = Math.max(0, Math.min(1, (radius + 14 - distance) / (radius * .65 + 14)));
          absorption = progress * progress * (3 - 2 * progress);
          entry.step.style.setProperty("--journey-fill-origin", point.y < center ? "50% 0%" : "50% 100%");
        }
      }
      active?.style.setProperty("--journey-fill", absorption.toFixed(4));
      dot.style.opacity = (1 - absorption).toFixed(4);
      for (const { step } of steps) {
        if (step === active && absorption >= .65) step.dataset.active = "true";
        else delete step.dataset.active;
      }
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(list);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="home-process__timeline">
    <ol ref={listRef} className="home-process__steps">{children}</ol>
    <span ref={dotRef} className="home-process__dot" aria-hidden="true" />
  </div>;
}
