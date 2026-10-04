import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
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
