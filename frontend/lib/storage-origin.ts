/** One trusted storage origin; never accept CSP fragments or wildcard hosts. */
export function storageOrigin(value?: string): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (!/^[a-z0-9.-]+$|^\[[0-9a-f:]+\]$/i.test(url.hostname)) return "";
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return "";
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) return "";
    return url.origin;
  } catch { return ""; }
}
