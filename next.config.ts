import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sentry/core", "@sentry/node"],
};

export default nextConfig;
