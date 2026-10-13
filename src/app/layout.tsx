import type { Metadata, Viewport } from 'next';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-600.css';
import { brand } from '../lib/brand';
import { site } from '../lib/site';
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

export const metadata: Metadata = {
  title: { default: 'OVIO — Websites and products that just work.', template: '%s | OVIO' },
  description: site.description,
  metadataBase: new URL(site.url || 'http://127.0.0.1:3000'),
  ...(site.url ? { alternates: { canonical: '/' } } : {}),
  robots: site.indexable ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { title: 'OVIO — Independent digital studio', description: site.description, type: 'website', siteName: 'OVIO', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'OVIO — Websites and products that just work.' }], ...(site.url ? { url: site.url } : {}) },
  twitter: { card: 'summary_large_image', title: 'OVIO — Independent digital studio', description: site.description, images: ['/opengraph-image'] },
};
export const viewport: Viewport = { themeColor: brand.background, colorScheme: 'dark' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SmoothScroll/><SiteMotion/><div className="site-shell"><HomeSceneBackground/><div className="site-shell-content"><a className="skip-link" href="#main">Skip to content</a><div id="top"/><Header/><main id="main">{children}</main><Footer/></div></div></body></html>;
}
