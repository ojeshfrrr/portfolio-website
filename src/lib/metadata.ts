import type { Metadata } from 'next';
import { site } from './site';
import { buildSocialUrls } from './seo-config.mjs';
type SocialPreview = { url: string; alt: string; width: number; height: number };
const defaultPreview: SocialPreview = { url: '/opengraph-image', width: 1200, height: 630, alt: 'OVIO — Websites and products that just work.' };
export function pageMetadata(title: string, description: string, path: string, preview: SocialPreview = defaultPreview): Metadata {
  const socialUrls = buildSocialUrls(site.url, path);
  const fullTitle = `${title} | ${site.name}`;
  return { title, description,
    ...(socialUrls ? { alternates: { canonical: socialUrls.canonical } } : {}),
    openGraph: { title: fullTitle, description, type: 'website', siteName: site.name,
      ...(socialUrls ? { url: socialUrls.page, images: [{ ...preview, url: new URL(preview.url, site.url).href }] } : {}) },
    twitter: { title: fullTitle, description, card: 'summary_large_image', ...(socialUrls ? { images: [new URL(preview.url, site.url).href] } : {}) },
  };
}
