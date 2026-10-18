/** Per-process bounded admission, including requests rejected before the API. */
const clients = new Map<string, { count: number; until: number }>();
let active = 0;
let windowStart = 0;
let total = 0;
export class IngressError extends Error {
  status: number;
  constructor(status: number) { super("Request rejected"); this.status = status; }
}
export function admit(client: string, now = Date.now()): () => void {
  if (now - windowStart >= 60_000) { windowStart = now; total = 0; }
  for (const [key, value] of clients) if (value.until <= now) clients.delete(key);
  const entry = clients.get(client) ?? { count: 0, until: now + 60_000 };
  if (++total > 300 || ++entry.count > 60 || active >= 8 || clients.size >= 4096) throw new IngressError(429);
  clients.set(client, entry);
  active++;
  let released = false;
  return () => { if (!released) { active--; released = true; } };
}
export async function boundedBody(request: Request, limit: number, timeoutMs = 5000): Promise<string> {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > limit)) throw new IngressError(413);
  if (!request.body) return "";
  const reader = request.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new IngressError(408)), timeoutMs);
  });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await Promise.race([reader.read(), deadline]);
      if (part.done) break;
      size += part.value.byteLength;
      if (size > limit) throw new IngressError(413);
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error instanceof IngressError ? error : new IngressError(400);
  } finally { clearTimeout(timer); reader.releaseLock(); }
}
