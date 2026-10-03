type Direction = "up" | "left" | "right" | "fade";

const groups: readonly [string, Direction, number][] = [
  [".home-start__features > li", "up", 80],
  [".home-destinations__title, .home-faq__intro, .home-closing__heading", "up", 0],
  [".home-destination", "up", 80],
  [".home-service-card", "up", 80],
  [".home-universities__filters", "up", 0],
  [".home-universities", "up", 0],
  [".home-trust__header", "up", 0],
  [".home-trust__value", "up", 80],
  [".home-process__media", "right", 0],
  [".home-process__copy", "left", 0],
  [".home-news", "up", 0],
  [".home-faq__item", "up", 60],
  [".home-closing__image", "left", 0],
  [".home-closing__card", "right", 80],
];

export function animateHomeElement(element: HTMLElement, direction: Direction = "up", delay = 0) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (preference.matches || typeof element.animate !== "function") return () => {};
  const mobile = window.matchMedia("(max-width: 800px)").matches;
  const offset = direction === "fade" ? "0 0"
    : mobile ? "0 8px"
    : direction === "left" ? "-20px 0"
    : direction === "right" ? "20px 0" : "0 20px";
  const animation = element.animate(
    [{ opacity: 0, translate: offset }, { opacity: 1, translate: "0 0" }],
    { duration: direction === "fade" ? 400 : mobile ? 400 : 560, delay: mobile ? Math.min(delay / 2, 120) : Math.min(delay, 240), easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" },
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
export function startHomeMotion(root: HTMLElement) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (preference.matches || typeof IntersectionObserver === "undefined" || typeof root.animate !== "function") return () => {};

  const targets = new Map<HTMLElement, { direction: Direction; delay: number }>();
  for (const [selector, direction, stagger] of groups) {
    root.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
      const evenStep = element.closest(".home-process__step:nth-child(even)");
      const side = evenStep && (direction === "left" || direction === "right")
        ? direction === "left" ? "right" : "left" : direction;
      targets.set(element, { direction: side, delay: index * stagger });
    });
  }
  // This footer belongs to the current home shell; shared shell markup is untouched.
  const footer = root.nextElementSibling;
  if (footer instanceof HTMLElement && footer.matches(".site-footer")) {
    targets.set(footer, { direction: "fade", delay: 0 });
  }
  const cleanups = new Set<() => void>();
  const revealed = new Set<HTMLElement>();
  let stopped = false;
  const reveal = (element: HTMLElement, immediate = false) => {
    delete element.dataset.homePending;
    if (revealed.has(element)) return;
    revealed.add(element);
    observer.unobserve(element);
    const motion = targets.get(element);
    if (!immediate && motion) cleanups.add(animateHomeElement(element, motion.direction, motion.delay));
  };
  const observer = new IntersectionObserver((entries) => {
    if (stopped) return;
    for (const entry of entries) {
      if (entry.isIntersecting) reveal(entry.target as HTMLElement);
    }
  }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });

  for (const element of targets.keys()) {
    const bounds = element.getBoundingClientRect();
    if (bounds.bottom <= 0) reveal(element, true);
    else if (bounds.top < window.innerHeight * .95) reveal(element);
    else {
      element.dataset.homePending = "true";
      observer.observe(element);
    }
  }

  const hero = root.querySelector<HTMLElement>(".home-hero__image");
  if (hero && hero.getBoundingClientRect().bottom > 0) {
    // Individual scale preserves the existing Persian image mirroring transform.
    const animation = hero.animate([{ scale: 1.03 }, { scale: 1 }], { duration: 900, easing: "cubic-bezier(.22,1,.36,1)" });
    cleanups.add(() => animation.cancel());
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
    for (const cancel of cleanups) cancel();
    root.parentElement?.removeEventListener("focusin", focus);
    preference.removeEventListener("change", onPreference);
  };
  const onPreference = () => { if (preference.matches) cleanup(); };
  root.parentElement?.addEventListener("focusin", focus);
  preference.addEventListener("change", onPreference);
  return cleanup;
}
