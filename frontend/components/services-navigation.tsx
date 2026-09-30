"use client";

import { useEffect, useState } from "react";

type ServiceLink = { id: string; label: string };

export function ServicesNavigation({ label, services }: { label: string; services: ServiceLink[] }) {
  const [activeId, setActiveId] = useState(services[0]?.id ?? "");

  useEffect(() => {
    const sections = services.map(({ id }) => document.getElementById(id)).filter((section): section is HTMLElement => section !== null);
    if (!sections.length) return;

    let frame = 0;
    const updateActive = () => {
      frame = 0;
      const activationLine = Math.min(window.innerHeight * 0.45, 420);
      let current = sections[0].id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= activationLine) current = section.id;
      }
      setActiveId((previous) => previous === current ? previous : current);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActive);
    };

    updateActive();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [services]);

  return <nav className="services-navigation" aria-label={label}>
    {services.map(({ id, label: serviceLabel }) => <a key={id} href={`#${id}`} data-active={activeId === id} aria-current={activeId === id ? "location" : undefined} onClick={() => setActiveId(id)}>{serviceLabel}</a>)}
  </nav>;
}
