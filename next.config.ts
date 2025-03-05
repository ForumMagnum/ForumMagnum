import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sentry/core", "@sentry/node"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

