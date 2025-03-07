import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sentry/core", "@sentry/node"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

