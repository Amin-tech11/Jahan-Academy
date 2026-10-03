"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { startHomeMotion } from "@/lib/home-motion";

export function HomeMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (root.current) return startHomeMotion(root.current);
  }, []);
  return <main className="home-page" ref={root}>{children}</main>;
}
