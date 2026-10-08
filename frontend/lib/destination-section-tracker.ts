type Rect = { top: number; bottom: number; left: number; right: number };
type SectionRect = Rect & { id: string };

export function mostVisibleDestinationSection(sections: SectionRect[], viewport: Rect, previous: string | null = null): string | null {
  let selected: string | null = null;
  let largestArea = 0;
  for (const section of sections) {
    const height = Math.max(0, Math.min(section.bottom, viewport.bottom) - Math.max(section.top, viewport.top));
    const width = Math.max(0, Math.min(section.right, viewport.right) - Math.max(section.left, viewport.left));
    const area = height * width;
    if (area > largestArea || (area > 0 && area === largestArea && section.id === previous)) {
      selected = section.id;
      largestArea = area;
    }
  }
  return selected;
}

export function trackDestinationSections(root: HTMLElement, navigation: HTMLElement, onChange: (id: string | null) => void) {
  const win = root.ownerDocument.defaultView;
  if (!win) return () => {};
  const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-destination-section]"));
  const header = root.closest(".site")?.querySelector<HTMLElement>(".site-header");
  let frame = 0;
  let current: string | null | undefined;
  const measure = () => {
    frame = 0;
    // Only content below the fixed header and sticky guide is actually visible.
    const top = Math.min(win.innerHeight, Math.max(0, header?.getBoundingClientRect().bottom ?? 0, navigation.getBoundingClientRect().bottom));
    const next = mostVisibleDestinationSection(sections.map((section) => {
      const { top, bottom, left, right } = section.getBoundingClientRect();
      return { id: section.id, top, bottom, left, right };
    }), { top, bottom: win.innerHeight, left: 0, right: root.ownerDocument.documentElement.clientWidth }, current);
    if (next !== current) {
      current = next;
      onChange(next);
    }
  };
  const schedule = () => {
    if (!frame) frame = win.requestAnimationFrame(measure);
  };
  win.addEventListener("scroll", schedule, { passive: true });
  win.addEventListener("resize", schedule);
  const observer = typeof win.ResizeObserver === "function" ? new win.ResizeObserver(schedule) : null;
  [root, navigation, header, ...sections].forEach((element) => { if (element) observer?.observe(element); });
  measure();
  return () => {
    win.removeEventListener("scroll", schedule);
    win.removeEventListener("resize", schedule);
    observer?.disconnect();
    if (frame) win.cancelAnimationFrame(frame);
  };
}
