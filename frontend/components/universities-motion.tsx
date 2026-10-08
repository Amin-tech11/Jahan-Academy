"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { startHomeMotion, type MotionGroup } from "@/lib/home-motion";
import guide from "./universities-guide.module.css";
import hero from "./universities-hero.module.css";
import styles from "./universities-motion.module.css";

const groups: readonly MotionGroup[] = [
  [`.${hero.wordmark}`, "fade", 0],
  [`.${guide.navigation} > h2, .${guide.intro}`, "up", 0],
  [`.${guide.section} > h2, .${guide.section} > p, .${guide.section} > header`, "up", 0],
  [`.${guide.cards} > article`, "up", 60],
  [`.${guide.criteria} > article`, "up", 60],
  [`.${guide.tableWrap}`, "up", 0],
  [".home-universities__filters, .home-universities", "up", 0],
  [".home-faq__intro, .home-closing__heading", "up", 0],
  [".home-faq__item", "up", 60],
  [".home-closing__image", "left", 0],
  [".home-closing__card", "right", 60],
];

export function UniversitiesMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (root.current) return startHomeMotion(root.current, {
      groups,
      heroSelector: `.${hero.image}`,
      includeFooter: false,
    });
  }, []);
  // Keep the main and sticky navigation untransformed; animate their contents only.
  return <main ref={root} className={styles.page}>{children}</main>;
}
