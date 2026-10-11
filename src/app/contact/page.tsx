import PageHeading from '../../components/PageHeading';
import Contact from '../../components/Contact';
import Link from 'next/link';
import { pageMetadata } from '../../lib/metadata';
export const metadata = pageMetadata('Start a project', 'Describe your website or product idea and prepare a project enquiry for OVIO.', '/contact');
export default function ContactPage() { return <section className="contact-page container"><div className="contact-copy"><span className="section-label">Start a conversation</span><PageHeading>Have something<br/>worth building<span className="brand-dot">?</span></PageHeading><p>A new website. A better interface. A product idea. Tell me what you have in mind and what matters most.</p><div className="contact-guide"><h2>What helps at the start</h2><p>A little about your business, the job you need the site to do, and any priorities or timing. It is fine if the details are still taking shape.</p><Link href="/services" className="text-link">Explore services first</Link></div></div><div><Contact/></div></section>; }
