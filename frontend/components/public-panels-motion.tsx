"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { startHomeMotion, type MotionGroup } from "@/lib/home-motion";
import about from "./about-page.module.css";
import destinations from "./destinations-overview.module.css";
import styles from "./universities-motion.module.css";

const shared: readonly MotionGroup[] = [
  [".panel-consultation-callout", "up", 0],
  [".home-faq__intro, .home-closing__heading", "up", 0],
  [".home-faq__item", "up", 60],
  [".home-closing__image", "left", 0],
  [".home-closing__card", "right", 60],
];
const presets = {
  about: {
    hero: `.${about.banner} > img`,
    groups: [
      [`.${about.wordmark}`, "fade", 0],
      [`.${about.heroCopy}, .${about.sectionHeader}, .${about.cta}`, "up", 0],
      [`.${about.story} > div:first-child`, "right", 0],
      [`.${about.prose}`, "left", 0],
      [`.${about.purposeGrid} > article, .${about.valuesGrid} > article, .${about.steps} > li`, "up", 60],
    ],
  },
  destinations: {
    hero: `.${destinations.heroArtwork}`,
    groups: [
      [`.${destinations.heroBrand}`, "fade", 0],
      [`.${destinations.intro}, .${destinations.section} > h2, .${destinations.decisionHeading}`, "up", 0],
      [`.${destinations.countryCard}, .${destinations.decisionCriteria} > article`, "up", 60],
      [`.${destinations.comparisonTableWrap}`, "up", 0],
    ],
  },
  blog: {
    hero: ".journal-campus-hero > img",
    groups: [
      [".journal-campus-hero > p", "fade", 0],
      [".journal-navigation > h1, .journal-intro, .journal-section-heading", "up", 0],
      [".journal-card", "up", 60],
      [".journal-filters, .journal-pagination", "up", 0],
    ],
  },
} satisfies Record<string, { hero: string; groups: readonly MotionGroup[] }>;

export function PublicPanelsMotion({ panel, className, id, children }: {
  panel: keyof typeof presets;
  className: string;
  id?: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!root.current) return;
    const preset = presets[panel];
    return startHomeMotion(root.current, {
      groups: [...preset.groups, ...shared],
      heroSelector: preset.hero,
      includeFooter: false,
    });
  }, [panel]);
  return <main ref={root} id={id} className={`${className} ${styles.page}`}>{children}</main>;
}
