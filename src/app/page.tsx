import PageHeading from '../components/PageHeading';
import Link from 'next/link';
import Arrow from '../components/Arrow';
import ProjectImage from '../components/ProjectImage';
import ContactCTA from '../components/ContactCTA';
import HeroSculpture from '../components/HeroSculpture';
import { projects } from '../lib/site';

export default function Home() {
  return <div className="home-page">
    <div className="home-page-content">
    <section className="hero container" aria-labelledby="hero-heading"><div className="hero-kicker"><span className="little-cross" aria-hidden="true">✳</span><p>Independent digital studio.<br/>Design minded. Built with purpose.</p><span className="hero-location">Websites & web applications</span></div><div className="hero-grid"><div className="hero-copy"><PageHeading id="hero-heading" aria-label="Websites and products that just work."><span className="hero-line-mask" aria-hidden="true"><span className="hero-line">Websites and</span></span><span className="hero-line-mask" aria-hidden="true"><span className="hero-line">products that</span></span><span className="hero-line-mask" aria-hidden="true"><span className="hero-line">just work<span className="brand-dot">.</span></span></span></PageHeading><p className="hero-description">Design and development for business websites, focused landing pages, and useful web apps — built around what your project needs to do.</p><div className="hero-actions"><Link href="/start" className="button primary">Start a project <Arrow diagonal/></Link><Link href="/work" className="text-link">Explore selected work <Arrow/></Link></div></div><HeroSculpture/></div></section>
    <section className="home-intro container"><p>One independent studio. Design and development, considered together.</p><Link href="/about" className="text-link">Meet OVIO <Arrow/></Link></section>
    <section className="home-work container"><div className="compact-heading"><h2>A little of the work.</h2><Link href="/work" className="text-link">Explore the portfolio <Arrow/></Link></div><div className="featured-grid">{projects.map(project => <article key={project.id}><Link href={`/work/${project.id}`} className="featured-preview" aria-label={`Read ${project.name} case study`}><ProjectImage id={project.id}/></Link><div className="featured-caption"><h3><Link href={`/work/${project.id}`}>{project.name}</Link></h3><span>{project.category}</span><Arrow diagonal/></div></article>)}</div></section>
    <section className="home-services container"><div><h2>The right build.<br/>For your next move.</h2><Link className="text-link" href="/services">Find your starting point <Arrow/></Link></div><ul><li>Landing pages</li><li>Small-business websites</li><li>Custom web applications</li></ul></section><ContactCTA/>
    </div>
  </div>;
}

