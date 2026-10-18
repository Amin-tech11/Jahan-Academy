import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicit LAN hostnames only; production routing is unaffected.
  allowedDevOrigins: (process.env.JAHAN_DEV_ORIGINS ?? "").split(",").map(host => host.trim()).filter(Boolean),
  output: "standalone",
  experimental: { globalNotFound: true },
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' https://www.googletagmanager.com" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "") + "; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://www.google-analytics.com https://region1.google-analytics.com; font-src 'self'; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com" + (process.env.NODE_ENV === "development" ? " ws: http://localhost:8000 http://127.0.0.1:8000" : "") + "; frame-src https://maps.google.com https://www.google.com/maps/; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" },
    ] }, { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] }, { source: "/hero-assets/:path*", headers: [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ] }];
  },
  async rewrites() {
    const backend = (
      process.env.ADMIN_API_URL ?? process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000"
    ).replace(/\/$/, "");
    const api = backend.endsWith("/api/v1") ? backend : `${backend}/api/v1`;
    return ["consultation-requests", "reference-data/:path*", "universities/:path*"].map(path => ({
      source: `/api/v1/${path}`,
      destination: `${api}/${path}`,
    }));
  },
  async redirects() {
    if (process.env.JAHAN_PANEL === "admin") {
      return [{ source: "/", destination: "/admin", permanent: false }];
    }
    return process.env.JAHAN_DESTINATION_PANEL === "1"
      ? [{ source: "/", destination: "/fa/countries/canada", permanent: false }]
      : [];
  },
  // Separate build locks allow panel dev servers to share one checkout.
  distDir: process.env.JAHAN_PERFORMANCE_BUILD === "1" ? ".next-audit" : process.env.JAHAN_DEV_PORT === "3200" ? ".next-3200" : ".next",
};

export default nextConfig;
