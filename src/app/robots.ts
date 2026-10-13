import type { MetadataRoute } from 'next';
import { site } from '../lib/site';
import { buildRobots } from '../lib/seo-config.mjs';

export default function robots(): MetadataRoute.Robots {
  return buildRobots(site.url, site.previewDeployment);
}
