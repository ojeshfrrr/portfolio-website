import Link from 'next/link';
import Arrow from './Arrow';
import { navLinks, site, hasEmail } from '../lib/site';
export default function Footer() {
  return <footer className="footer container"><div className="footer-top"><Link href="/" className="wordmark" aria-label="OVIO home">ovio<span className="brand-dot">.</span></Link><p>Websites and products<br/>that just work.</p><nav aria-label="Footer navigation">{navLinks.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} OVIO. Independent by design.</span><div>{hasEmail ? <a href={`mailto:${site.email}`}>{site.email}</a> : null}{site.socials.map(social => <a key={social.url} href={social.url} target="_blank" rel="noopener noreferrer">{social.label}</a>)}<a href="#top" className="back-to-top">Back to top <Arrow up/></a></div></div></footer>;
}
