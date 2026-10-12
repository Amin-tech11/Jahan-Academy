import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-seo";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/fa/admin", "/en/admin", "/api/", "/reset-password", "/verify-email"] }, sitemap: `${siteOrigin}/sitemap.xml` };
}
