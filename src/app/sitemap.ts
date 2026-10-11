import type { MetadataRoute } from 'next';
import { site, pagePaths } from '../lib/site';
export default function sitemap(): MetadataRoute.Sitemap { return site.indexable && site.url ? pagePaths.map(path => ({ url: `${site.url}${path === '/' ? '' : path}`, changeFrequency: 'monthly', priority: path === '/' ? 1 : 0.8 })) : []; }
