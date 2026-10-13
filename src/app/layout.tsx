import type { Metadata, Viewport } from 'next';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-600.css';
import { brand } from '../lib/brand';
import { site } from '../lib/site';
import { buildSocialUrls } from '../lib/seo-config.mjs';
import SmoothScroll from '../components/SmoothScroll';
import SiteMotion from '../components/SiteMotion';
import HomeSceneBackground from '../components/HomeSceneBackground';
import Header from '../components/Header';
import Footer from '../components/Footer';
import 'lenis/dist/lenis.css';
import './globals.css';
import './interactions.css';
import './pages.css';
import './ui-polish.css';
import './route-transitions.css';
import './signature-motion.css';
import './typography.css';

const homeSocialUrls = buildSocialUrls(site.url, '/');

export const metadata: Metadata = {
  title: { default: 'OVIO — Websites and products that just work.', template: '%s | OVIO' },
  description: site.description,
  ...(site.url ? { metadataBase: new URL(site.url), alternates: { canonical: homeSocialUrls?.canonical } } : {}),
  ...(site.previewDeployment ? { robots: { index: false, follow: false } } : { robots: { index: true, follow: true } }),
  openGraph: {
    title: 'OVIO — Independent digital studio', description: site.description, type: 'website', siteName: 'OVIO',
    ...(homeSocialUrls ? { url: homeSocialUrls.page, images: [{ url: homeSocialUrls.image, width: 1200, height: 630, alt: 'OVIO — Websites and products that just work.' }] } : {}),
  },
  twitter: { card: 'summary_large_image', title: 'OVIO — Independent digital studio', description: site.description, ...(homeSocialUrls ? { images: [homeSocialUrls.image] } : {}) },
};
export const viewport: Viewport = { themeColor: brand.background, colorScheme: 'dark' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SmoothScroll/><SiteMotion/><div className="site-shell"><HomeSceneBackground/><div className="site-shell-content"><a className="skip-link" href="#main">Skip to content</a><div id="top"/><Header/><main id="main">{children}</main><Footer/></div></div></body></html>;
}
