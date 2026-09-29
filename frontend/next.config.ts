import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  // Separate build locks allow panel dev servers to share one checkout.
  distDir: process.env.JAHAN_DEV_PORT === "3200" ? ".next-3200" : ".next",
};

export default nextConfig;
