import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Photos straight from a phone can be several megabytes.
    serverActions: { bodySizeLimit: "25mb" },
  },
  // Commonplace became Notes (Nov 26); keep old links working.
  async redirects() {
    return [
      // The archive is now the Posts page (Nov 26); notes live under Notes.
      { source: "/archive", destination: "/posts", permanent: true },
      { source: "/commonplace", destination: "/notes", permanent: true },
      { source: "/commonplace/:slug", destination: "/notes/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
