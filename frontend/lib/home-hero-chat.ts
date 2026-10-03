export type HeroChatFrame = { scene: number; phase: number };

export function startHeroChat(element: HTMLElement, show: (frame: HeroChatFrame) => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const delays = [1200, 1800, 7200];
  let frame: HeroChatFrame = { scene: 0, phase: 0 };
  let remaining = delays[0];
  let started = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let paused = false;
  let visible = true;
  let disposed = false;
  const stop = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
      remaining = Math.max(0, remaining - (performance.now() - started));
    }
  };
  const sync = () => {
    stop();
    const suspended = disposed || paused || !visible || document.hidden || preference.matches;
    element.dataset.chatSuspended = String(suspended);
    if (suspended) return;
    started = performance.now();
    timer = setTimeout(() => {
      timer = undefined;
      frame = frame.phase < 2 ? { ...frame, phase: frame.phase + 1 } : { scene: (frame.scene + 1) % 3, phase: 0 };
      remaining = delays[frame.phase];
      show(frame);
      sync();
    }, remaining);
  };
  const onPreference = () => {
    stop();
    frame = { scene: frame.scene, phase: preference.matches ? 2 : 0 };
    remaining = delays[frame.phase];
    show(frame);
    sync();
  };
  const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    sync();
  });
  observer?.observe(element);
  preference.addEventListener("change", onPreference);
  document.addEventListener("visibilitychange", sync);
  onPreference();
  return {
    setPaused(value: boolean) { paused = value; sync(); },
    dispose() {
      disposed = true;
      stop();
      observer?.disconnect();
      delete element.dataset.chatSuspended;
      preference.removeEventListener("change", onPreference);
      document.removeEventListener("visibilitychange", sync);
    },
  };
}
