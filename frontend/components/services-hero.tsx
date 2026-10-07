"use client";

import Image from "next/image";
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
    <Image src="/services-hero.png" alt="" fill sizes="100vw" preload className="services-hero__image" />
    <div className="services-hero__brand">JAHAN ACADEMY</div>
  </section>;
}
