import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
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
  distDir: process.env.JAHAN_DEV_PORT === "3200" ? ".next-3200" : ".next",
};

export default nextConfig;
