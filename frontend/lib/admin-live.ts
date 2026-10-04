/** Serial refreshes: never overlap requests or deliver results after disposal. */
export function startLiveRefresh<T>({
  load, onData, onError, active, interval = 2000,
}: {
  load: (signal: AbortSignal) => Promise<T>;
  onData: (data: T) => void;
  onError: (error: unknown) => void;
  active: () => boolean;
  interval?: number;
}) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let failures = 0;
  async function refresh() {
    if (controller.signal.aborted || running) return;
    clearTimeout(timer);
    if (!active()) return;
    running = true;
    try {
      const data = await load(controller.signal);
      if (!controller.signal.aborted) {
        failures = 0;
        onData(data);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        failures += 1;
        onError(error);
      }
    } finally {
      running = false;
      if (!controller.signal.aborted)
        timer = setTimeout(refresh, Math.min(interval * 2 ** failures, 30000));
    }
  }
  void refresh();
  return {
    refresh,
    stop() { controller.abort(); clearTimeout(timer); },
  };
}
