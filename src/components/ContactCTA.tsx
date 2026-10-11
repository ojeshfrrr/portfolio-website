import Link from 'next/link';
import Arrow from './Arrow';
export default function ContactCTA() {
  return <section className="route-cta container"><div><h2>Have something worth building?</h2><p>A website, a product, or a better way to make it work.</p></div><Link href="/contact" className="button primary">Start a project <Arrow diagonal/></Link></section>;
}
