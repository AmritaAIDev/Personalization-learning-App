import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/diagnostic/", "/analysis/", "/mock-test/"],
      },
    ],
    sitemap: "https://jee-ai.example.com/sitemap.xml",
  };
}
