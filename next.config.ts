import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Photos straight from a phone can be several megabytes.
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
