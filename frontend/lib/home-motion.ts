type Direction = "up" | "left" | "right" | "fade" | "hero";
export type MotionGroup = readonly [string, Direction, number];

const groups: readonly [string, Direction, number][] = [
  [".home-start__features > li", "up", 60],
  [".home-destinations__title, .home-faq__intro, .home-closing__heading", "up", 0],
  [".home-destination", "up", 60],
  [".home-service-card", "up", 60],
  [".home-universities__filters", "up", 0],
  [".home-universities", "up", 0],
  [".home-trust__header", "up", 0],
  [".home-trust__value", "up", 60],
  [".home-process__media", "right", 0],
  [".home-process__copy", "left", 0],
  [".home-news", "up", 0],
  [".home-faq__item", "up", 60],
  [".home-closing__image", "left", 0],
  [".home-closing__card", "right", 60],
];

export function animateHomeElement(element: HTMLElement, direction: Direction = "up", delay = 0) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (preference.matches || typeof element.animate !== "function") return () => {};
  const mobile = window.matchMedia("(max-width: 800px)").matches;
  const offset = direction === "fade" ? "0 0"
    : mobile ? "0 8px"
    : direction === "left" ? "-16px 0"
    : direction === "right" ? "16px 0" : "0 16px";
  const animation = element.animate(
    direction === "hero" ? [{ scale: 1.02 }, { scale: 1 }] : [{ opacity: 0, translate: offset }, { opacity: 1, translate: "0 0" }],
    { duration: direction === "hero" ? 1200 : direction === "fade" ? 600 : mobile ? 560 : 760, delay: mobile ? Math.min(delay / 2, 60) : Math.min(delay, 120), easing: "cubic-bezier(.25,.1,.25,1)", fill: "backwards" },
  );
  const cancel = () => {
    animation.cancel();
    preference.removeEventListener("change", onPreference);
  };
  const onPreference = () => { if (preference.matches) cancel(); };
  preference.addEventListener("change", onPreference);
  animation.addEventListener("finish", cancel, { once: true });
  return cancel;
}

/** Progressive enhancement: server HTML and unsupported browsers stay visible. */
export function startHomeMotion(root: HTMLElement, options: {
  groups?: readonly MotionGroup[];
  heroSelector?: string;
  includeFooter?: boolean;
} = {}) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (preference.matches || typeof IntersectionObserver === "undefined" || typeof root.animate !== "function") return () => {};

  const targets = new Map<HTMLElement, { direction: Direction; delay: number }>();
  for (const [selector, direction, stagger] of options.groups ?? groups) {
    root.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
      const evenStep = element.closest(".home-process__step:nth-child(even)");
      const side = evenStep && (direction === "left" || direction === "right")
        ? direction === "left" ? "right" : "left" : direction;
      targets.set(element, { direction: side, delay: index * stagger });
    });
  }
  // This footer belongs to the current home shell; shared shell markup is untouched.
  const footer = root.nextElementSibling;
  if (options.includeFooter !== false && footer instanceof HTMLElement && footer.matches(".site-footer")) {
    targets.set(footer, { direction: "fade", delay: 0 });
  }
  const hero = root.querySelector<HTMLElement>(options.heroSelector ?? ".home-hero__image");
  if (hero) targets.set(hero, { direction: "hero", delay: 0 });
  // Keep at most one animation cleanup per target across repeated scroll cycles.
  const cleanups = new Map<HTMLElement, () => void>();
  const revealed = new Set<HTMLElement>();
  let stopped = false;
  const reveal = (element: HTMLElement, immediate = false) => {
    delete element.dataset.homePending;
    if (revealed.has(element)) return;
    revealed.add(element);

    const motion = targets.get(element);
    if (!immediate && motion) {
      cleanups.get(element)?.();
      cleanups.set(element, animateHomeElement(element, motion.direction, motion.delay));
    }
  };
  const observer = new IntersectionObserver((entries) => {
    if (stopped) return;
    for (const entry of entries) {
      const element = entry.target as HTMLElement;
      if (entry.isIntersecting) reveal(element);
      else {
        // Ignore the entrance's own translation when testing the viewport edge.
        // Otherwise a 20px entrance could repeatedly trigger its own reset.
        const translateY = Number.parseFloat(window.getComputedStyle(element).translate.split(" ")[1] ?? "0") || 0;
        if (entry.boundingClientRect.top - translateY < window.innerHeight && element !== hero) continue;
        // Reset only after leaving below the viewport; content passed above stays visible.
        // The hero also replays when returning to the top of the page.
        const focused = root.ownerDocument?.activeElement;
        if (focused && element.contains(focused)) continue;
        cleanups.get(element)?.();
        cleanups.delete(element);
        revealed.delete(element);
        element.dataset.homePending = "true";
      }
    }
  }, { threshold: 0 });

  for (const element of targets.keys()) {
    observer.observe(element);
    const bounds = element.getBoundingClientRect();
    if (bounds.bottom <= 0) reveal(element, true);
    else if (bounds.top < window.innerHeight) reveal(element);
    else {
      element.dataset.homePending = "true";

    }
  }

  const focus = (event: FocusEvent) => {
    if (!(event.target instanceof Node)) return;
    for (const element of targets.keys()) {
      if (element.contains(event.target)) {
        reveal(element, true);
        // Keyboard focus must not wait for any entrance animation.
        element.getAnimations().forEach((animation) => animation.finish());
      }
    }
  };
  const cleanup = () => {
    stopped = true;
    observer.disconnect();
    for (const element of targets.keys()) delete element.dataset.homePending;
    for (const cancel of cleanups.values()) cancel();
    cleanups.clear();
    root.parentElement?.removeEventListener("focusin", focus);
    preference.removeEventListener("change", onPreference);
  };
  const onPreference = () => { if (preference.matches) cleanup(); };
  root.parentElement?.addEventListener("focusin", focus);
  preference.addEventListener("change", onPreference);
  return cleanup;
}
