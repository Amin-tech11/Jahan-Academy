/** Destination-scoped entrances matching the home panel's timing and easing. */
export function startDestinationMotion(root: HTMLElement) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (preference.matches || typeof IntersectionObserver === "undefined" || typeof root.animate !== "function") return () => {};

  const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-destination-motion]"));
  const revealed = new Set<HTMLElement>();
  const animations = new Map<HTMLElement, Animation>();
  let stopped = false;
  const cancel = (element: HTMLElement) => {
    animations.get(element)?.cancel();
    animations.delete(element);
  };
  const reveal = (element: HTMLElement, immediate = false) => {
    delete element.dataset.destinationPending;
    if (immediate) cancel(element);
    if (revealed.has(element)) return;
    revealed.add(element);
    if (immediate) return;
    const mobile = window.matchMedia("(max-width: 800px)").matches;
    const kind = element.dataset.destinationMotion;
    const bounds = element.getBoundingClientRect();
    const offset = kind === "fade" ? "0 0" : mobile ? "0 8px"
      : kind === "side" ? `${bounds.left + bounds.width / 2 < window.innerWidth / 2 ? -16 : 16}px 0` : "0 16px";
    const delay = Math.max(0, Math.min(Number(element.dataset.destinationDelay) || 0, 120));
    const animation = element.animate(
      kind === "zoom" ? [{ scale: 1.02 }, { scale: 1 }]
        : [{ opacity: 0, translate: offset }, { opacity: 1, translate: "0 0" }],
      { duration: kind === "zoom" ? 1200 : kind === "fade" ? 600 : mobile ? 560 : 760,
        delay: mobile ? delay / 2 : delay, easing: "cubic-bezier(.25,.1,.25,1)", fill: "backwards" },
    );
    animations.set(element, animation);
    animation.addEventListener("finish", () => {
      if (animations.get(element) === animation) cancel(element);
    }, { once: true });
  };
  const observer = new IntersectionObserver((entries) => {
    if (stopped) return;
    for (const entry of entries) {
      const element = entry.target as HTMLElement;
      if (entry.isIntersecting) reveal(element);
      else {
        // Ignore our entrance translation, so crossing the edge cannot replay itself.
        const translateY = Number.parseFloat(window.getComputedStyle(element).translate.split(" ")[1] ?? "0") || 0;
        if (entry.boundingClientRect.top - translateY < window.innerHeight) continue;
        const focused = root.ownerDocument.activeElement;
        if (focused && element.contains(focused)) continue;
        cancel(element);
        revealed.delete(element);
        element.dataset.destinationPending = "true";
      }
    }
  }, { threshold: 0 });
  for (const element of targets) {
    observer.observe(element);
    const bounds = element.getBoundingClientRect();
    if (bounds.bottom <= 0) reveal(element, true);
    else if (bounds.top < window.innerHeight) reveal(element);
    else element.dataset.destinationPending = "true";
  }
  const focus = (event: FocusEvent) => {
    if (!(event.target instanceof Node)) return;
    for (const element of targets) if (element.contains(event.target)) reveal(element, true);
  };
  const cleanup = () => {
    stopped = true;
    observer.disconnect();
    for (const element of targets) {
      delete element.dataset.destinationPending;
      cancel(element);
    }
    root.removeEventListener("focusin", focus);
    preference.removeEventListener("change", onPreference);
  };
  const onPreference = () => { if (preference.matches) cleanup(); };
  root.addEventListener("focusin", focus);
  preference.addEventListener("change", onPreference);
  return cleanup;
}
