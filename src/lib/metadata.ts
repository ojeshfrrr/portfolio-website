import type { Metadata } from 'next';
import { site } from './site';
type SocialPreview = { url: string; alt: string; width: number; height: number };
const defaultPreview: SocialPreview = { url: '/opengraph-image', width: 1200, height: 630, alt: 'OVIO — Websites and products that just work.' };
export function pageMetadata(title: string, description: string, path: string, preview: SocialPreview = defaultPreview): Metadata {
  const fullTitle = `${title} — OVIO`;
  return { title, description,
    ...(site.url ? { alternates: { canonical: path } } : {}),
    openGraph: { title: fullTitle, description, type: 'website', siteName: site.name,
      images: [preview],
      ...(site.url ? { url: `${site.url}${path}` } : {}) },
    twitter: { title: fullTitle, description, card: 'summary_large_image', images: [preview.url] },
  };
}
