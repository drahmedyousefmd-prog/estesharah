import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { SERVICES } from "@/lib/services";

export const dynamic = "force-static";

const lastModified = new Date("2026-09-21");

export default function sitemap(): MetadataRoute.Sitemap {
  const root: MetadataRoute.Sitemap[number] = {
    url: SITE_URL,
    lastModified,
    changeFrequency: "daily",
    priority: 1,
  };

  const services: MetadataRoute.Sitemap[number][] = SERVICES.map((s) => ({
    url: `${SITE_URL}/new/${s.type}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [root, ...services];
}