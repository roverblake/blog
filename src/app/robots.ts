import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/studio", "/preview", "/api/", "/sign-in", "/unsubscribe", "/subscribe/confirm"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
