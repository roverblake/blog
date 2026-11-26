import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Photos straight from a phone can be several megabytes.
    serverActions: { bodySizeLimit: "25mb" },
  },
  // Commonplace became Notes (Nov 26); keep old links working.
  async redirects() {
    return [
      { source: "/commonplace", destination: "/notes", permanent: true },
      { source: "/commonplace/:slug", destination: "/notes/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
