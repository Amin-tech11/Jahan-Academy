export const GA_MEASUREMENT_ID = "G-54XY5B8GLK";

export function analyticsHostAllowed(hostname: string) {
  return hostname === "jahanacademi.ir" || hostname === "www.jahanacademi.ir";
}

export function analyticsPageLocation(pathname: string) {
  pathname = pathname.split(/[?#]/)[0];
  if (!/^\/(fa|en)(\/|$)/.test(pathname) || /\/admin(\/|$)/.test(pathname)) return null;
  return `https://jahanacademi.ir${pathname}`;
}

export function analyticsReferrer(value: string) {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return "";
    return analyticsHostAllowed(url.hostname)
      ? (analyticsPageLocation(url.pathname) ?? "")
      : url.origin;
  } catch { return ""; }
}
