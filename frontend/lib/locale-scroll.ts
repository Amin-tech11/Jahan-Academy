export type LocaleScrollPosition = {
  path: string;
  scrollY: number;
  anchorId?: string;
  fraction?: number;
  viewportOffset: number;
};

function layoutBounds(element: HTMLElement) {
  let top = 0;
  for (let parent: HTMLElement | null = element; parent; parent = parent.offsetParent as HTMLElement | null) top += parent.offsetTop;
  return { top: top - window.scrollY, height: element.offsetHeight, bottom: top - window.scrollY + element.offsetHeight };
}

export function captureLocaleScroll(path: string): LocaleScrollPosition {
  const viewportOffset = (document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0) + 24;
  const anchors = [...document.querySelectorAll<HTMLElement>("main [id]")].filter(element => {
    // Headings can animate independently; use their stable containing section.
    if (/^H[1-6]$/.test(element.tagName)) return false;
    const bounds = layoutBounds(element);
    for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
      const position = getComputedStyle(parent).position;
      if (position === "sticky" || position === "fixed") return false;
    }
    return bounds.height > 0 && bounds.top <= viewportOffset && bounds.bottom > viewportOffset;
  });
  const anchor = anchors.at(-1);
  const bounds = anchor ? layoutBounds(anchor) : undefined;
  return { path, scrollY: window.scrollY, viewportOffset,
    ...(anchor && bounds ? { anchorId: anchor.id, fraction: (viewportOffset - bounds.top) / bounds.height } : {}),
  };
}

export function restoreLocaleScroll(position: LocaleScrollPosition) {
  const anchor = position.anchorId ? document.getElementById(position.anchorId) : null;
  const bounds = anchor ? layoutBounds(anchor) : undefined;
  const top = bounds && position.fraction !== undefined
    ? window.scrollY + bounds.top + bounds.height * position.fraction - position.viewportOffset
    : position.scrollY;
  window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
}
