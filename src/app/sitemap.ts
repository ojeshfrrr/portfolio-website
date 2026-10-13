import type { MetadataRoute } from 'next';
import { site, sitemapPaths } from '../lib/site';
import { buildSitemap } from '../lib/seo-config.mjs';

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(site.url, sitemapPaths, site.previewDeployment);
}
