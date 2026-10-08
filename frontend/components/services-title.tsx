"use client";

import { useEffect, useRef } from "react";
import { startHomeMotion } from "@/lib/home-motion";

export function ServicesTitle({ children }: { children: string }) {
  const root = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (root.current) return startHomeMotion(root.current, {
      groups: [[".services-title__text", "up", 0]],
      includeFooter: false,
    });
  }, []);

  return <h1 ref={root} id="services-title"><span className="services-title__text">{children}</span></h1>;
}
