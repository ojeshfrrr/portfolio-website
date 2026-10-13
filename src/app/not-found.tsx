import Link from 'next/link';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Page not found', description: 'Find your way back to OVIO’s studio pages and selected work.', robots: { index: false, follow: true } };
export default function NotFound() { return <section className="page-intro container"><span className="section-label">Page not found</span><h1>This page isn’t here.</h1><p>Return to the studio homepage or explore the selected work.</p><div className="link-pair"><Link className="button primary" href="/">Return home</Link><Link className="text-link" href="/work">Explore the work</Link></div></section>; }
