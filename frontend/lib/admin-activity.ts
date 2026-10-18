/** Only trusted input events produce activity; no heartbeat or polling timer. */
export function trackAdminActivity(target: Window, send: () => Promise<unknown>) {
  let last = -Infinity;
  let pending = false;
  const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
  const activity = (event: Event) => {
    if (!event.isTrusted || target.document.hidden || pending || Date.now() - last < 60000) return;
    pending = true;
    last = Date.now();
    void send().catch(() => {}).finally(() => { pending = false; });
  };
  for (const event of events) target.addEventListener(event, activity, { passive: true });
  return () => { for (const event of events) target.removeEventListener(event, activity); };
}
