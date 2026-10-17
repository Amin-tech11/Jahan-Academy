"use client";

import { PreparedImage as Image } from "@/components/prepared-image";
import { useEffect, useRef } from "react";
import { startHomeMotion } from "@/lib/home-motion";

export function ServicesHero({ title }: { title: string }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (root.current) return startHomeMotion(root.current, {
      groups: [],
      heroSelector: ".services-hero__image",
      includeFooter: false,
    });
  }, []);

  return <section ref={root} className="services-hero" aria-label={title}>
    <Image src="/services-hero-interview.png" alt="" fill sizes="100vw" preload className="services-hero__image" />
    <div className="services-hero__brand public-hero-brand" lang="en">JAHAN ACADEMY</div>
  </section>;
}
