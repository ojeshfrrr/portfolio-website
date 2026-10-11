import type { MetadataRoute } from 'next';
import { site } from '../lib/site';
export default function robots(): MetadataRoute.Robots {
  return site.indexable && site.url ? { rules: { userAgent: '*', allow: '/' }, sitemap: `${site.url}/sitemap.xml` } : { rules: { userAgent: '*', disallow: '/' } };
}
