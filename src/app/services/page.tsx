import Link from 'next/link';
import PageIntro from '../../components/PageIntro';
import ContactCTA from '../../components/ContactCTA';
import Arrow from '../../components/Arrow';
import FAQ from '../../components/FAQ';
import { pageMetadata } from '../../lib/metadata';

export const metadata = pageMetadata(
  'Services',
  'Compare landing pages, small-business websites, and custom web applications. Scope, timing, and costs are agreed before work begins.',
  '/services',
);

const offers = [
  {
    id: 'landing-pages',
    title: 'Landing pages',
    position: 'One offer, one clear next step',
    description: 'A focused presentation for an offer, campaign, or product, shaped around one useful visitor action.',
    projectType: 'Landing page',
    fit: 'A product launch, campaign, service, or focused offer that needs a single considered page.',
    includes: 'Page structure, interface design, responsive development, your approved content, and an agreed call to action.',
    timing: 'Often the smallest scope. The delivery window is confirmed after the content, assets, dependencies, and review stages are clear.',
    provide: 'Your audience, offer, goals, approved copy and imagery, plus feedback at the agreed review points.',
    separate: 'Copywriting, photography, brand identity, extra pages, booking or payment flows, subscriptions, and ongoing maintenance unless the quote includes them.',
    cta: 'Plan a landing page',
  },
  {
    id: 'business-websites',
    title: 'Small-business websites',
    position: 'A clear home for your business',
    description: 'A professional multi-page home that helps customers understand your services and get in touch.',
    projectType: 'Small-business website',
    fit: 'Local businesses, gyms, creators, and independent professionals who need a useful multi-page website.',
    includes: 'An agreed set of pages, responsive layouts, enquiry paths, essential page metadata, testing, and the agreed launch handover.',
    timing: 'Page count, content readiness, and feedback affect the schedule. A target window is set in the proposal before the build starts.',
    provide: 'Business details, service information, contact preferences, approved copy and images, and access to any existing domain or hosting accounts.',
    separate: 'Writing, photography, identity work, content migration, domain registration, hosting, paid services, extra functionality, and maintenance unless specifically scoped.',
    cta: 'Plan a business website',
  },
  {
    id: 'web-applications',
    title: 'Custom web applications',
    position: 'A workflow made usable',
    description: 'A web product for a specific customer or team workflow, scoped from the jobs people need to complete.',
    projectType: 'Web application',
    fit: 'Founders and small businesses with a specific customer or internal workflow that a website alone cannot handle.',
    includes: 'Agreed user flows and interface, implementation of the defined features, and scoped data, backend, or third-party integrations where appropriate.',
    timing: 'This scope varies most. The workflow, data, access, and external dependencies are reviewed first; the proposal sets milestones and a delivery window.',
    provide: 'The problem and intended users, workflow rules, sample data where safe, access to required services, and a decision-maker for reviews.',
    separate: 'Hosting and infrastructure, third-party accounts or usage fees, unscoped integrations, security or compliance work, and ongoing operation or support unless quoted.',
    cta: 'Scope an application',
  },
];

export default function Services() {
  return <>
    <PageIntro label="Services" title="The right build. For your next move." text="Choose a focused page, a clear business website, or a custom product shaped around the workflow you need."/>
    <nav className="service-jump container" aria-label="Explore services">
      <span>Explore an option</span>
      {offers.map(offer => <a key={offer.id} href={`#${offer.id}`}>{offer.title}<Arrow/></a>)}
    </nav>
    <section className="service-details service-offers container" aria-label="Project offers">
      {offers.map(offer => <article id={offer.id} key={offer.id}>
        <div className="service-offer-heading">
          <span>{offer.position}</span>
          <h2>{offer.title}</h2>
          <p>{offer.description}</p>
          <Link className="text-link" href={`/contact?service=${encodeURIComponent(offer.projectType)}`}>{offer.cta}<Arrow/></Link>
        </div>
        <dl>
          <dt>A good fit for</dt><dd>{offer.fit}</dd>
          <dt>Included in scope</dt><dd>{offer.includes}</dd>
          <dt>Timing</dt><dd>{offer.timing}</dd>
          <dt>What you provide</dt><dd>{offer.provide}</dd>
          <dt>Quoted separately when needed</dt><dd>{offer.separate}</dd>
        </dl>
      </article>)}
    </section>
    <section className="scope-note container">
      <h2>Agree the edges before the build.</h2>
      <p>Every proposal sets the deliverables, review stages, revision allowance, client responsibilities, schedule, and handover. A new direction or added feature is discussed and quoted before it becomes extra work.</p>
      <div className="engagement-details">
        <div><h3>Costs stay visible</h3><p>There are no published package prices because the scope changes from project to project. Domain registration, hosting, licences, and third-party subscriptions are separate costs unless a proposal says otherwise.</p></div>
        <div><h3>Launch with a clear handover</h3><p>Domain and hosting accounts remain under your control. Setup, deployment, and post-launch maintenance are included only when described in the agreed scope.</p></div>
      </div>
      <Link href="/contact" className="button primary">Discuss your project<Arrow/></Link>
      <Link href="/process" className="text-link">See how a project moves forward<Arrow/></Link>
    </section>
    <FAQ/>
    <ContactCTA/>
  </>;
}
