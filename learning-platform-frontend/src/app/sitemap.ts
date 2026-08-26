import type { MetadataRoute } from "next";

const BASE = "https://jee-ai.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ["", "/login", "/signup", "/journey", "/learn", "/practice", "/tests", "/notebook", "/doubts"];
  return routes.map((route) => ({
    url: `${BASE}${route || "/"}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
