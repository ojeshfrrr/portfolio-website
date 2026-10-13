import { emailDraftUrl, whatsappUrl } from './contact.mjs';
import { isPreviewDeployment, resolvePublicOrigin, sitemapPaths } from './seo-config.mjs';

// Public business details only. Never put provider keys in NEXT_PUBLIC variables.
const candidateUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const siteUrl = resolvePublicOrigin(candidateUrl);
const previewDeployment = isPreviewDeployment(process.env.VERCEL_ENV);
export const site = {
  name: 'OVIO',
  description: 'Independent digital studio designing and building thoughtful websites, landing pages, and functional web applications. Websites and products that just work.',
  url: siteUrl,
  previewDeployment,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'workwithovio@gmail.com',
  contactFormEnabled: process.env.NEXT_PUBLIC_CONTACT_FORM_ENABLED === 'true',
  whatsapp: whatsappUrl(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''),
  // Add verified social profiles here: { label: '...', url: 'https://...' }
  socials: [] as { label: string; url: string }[],
};
export const hasEmail = Boolean(emailDraftUrl(site.email, ''));
export const navLinks = [
  { label: 'Home', href: '/' }, { label: 'Work', href: '/work' },
  { label: 'Lab', href: '/lab' }, { label: 'Services', href: '/services' }, { label: 'Process', href: '/process' },
  { label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' },
];
export type Project = { id: 'rewatch' | 'arcus'; name: string; category: string; description: string; details: string[]; url: string; caption: string };
export const projects: Project[] = [
  { id: 'rewatch', name: 'Rewatch', category: 'Media tracking web app',
    description: 'A home for what you watch and listen to. A media diary that brings films, series, anime, and music into one considered experience.',
    details: ['Media discovery', 'Ratings & reviews', 'Episode progress'], url: 'https://rewatch.cc/', caption: 'Films, series, anime, music. One place to keep your taste.' },
  { id: 'arcus', name: 'Arcus', category: 'Fitness web app',
    description: 'A training product for planning sessions, logging workouts, and reviewing progress, with a public community feed for workout inspiration.',
    details: ['Workout logging', 'Training programs', 'Progress views'], url: 'https://thearcus.vercel.app/', caption: 'A training experience built around the next session.' },
];
export { sitemapPaths };
