const questions = [
  ['What kinds of projects do you take on?', 'OVIO builds focused landing pages, multi-page websites for small businesses and independent professionals, and custom web applications for defined workflows. The right format and feature set are agreed after discussing what the project needs to do.'],
  ['How much does a website cost?', 'There is no fixed package price because page count, content, functionality, and integrations change the work. Share your priorities and working budget; the proposal will set out the agreed deliverables and costs before work begins.'],
  ['How long does a project usually take?', 'A focused landing page is generally a smaller scope than a multi-page site or custom application. The delivery window depends on scope, content, access, dependencies, and review pace, so it is confirmed in the proposal rather than promised in advance.'],
  ['What do you need from me to begin?', 'Start with the audience, the job the site should do, and what you already have. Approved content, imagery, account access, and timely feedback help the build move forward. Missing content or assets can be discussed and scoped separately.'],
  ['Are domain and hosting included?', 'Domain registration, hosting, provider subscriptions, and licences are separate costs unless they are listed in your proposal. Accounts should remain in your name; setup and deployment responsibilities are agreed before launch.'],
  ['How do revisions work?', 'The proposal defines review stages and the revision allowance. Feedback within the agreed brief is handled at those stages. A changed direction or additional feature is discussed and quoted before it is added.'],
  ['Can you improve an existing website?', 'Yes. Existing-site work begins with a review of the current site and the access available. We agree on a bounded set of improvements and note platform limitations before quoting.'],
  ['Who owns the finished website and source code?', 'The proposal sets out ownership, source-code delivery, and handover before work begins. Third-party services, fonts, and open-source packages remain subject to their own licences and terms.'],
  ['Is ongoing support available?', 'Maintenance and support are not assumed to be included. If you need updates after launch, ask during scoping so the responsibilities and any separate arrangement can be agreed.'],
  ['What happens after I send an enquiry?', 'I review the brief and get back to you to discuss fit, open questions, and possible scope. There is no fixed response-time promise, and sending an enquiry does not commit you to a project.'],
];

export default function FAQ() {
  return <section className="faq-section container" aria-labelledby="faq-heading"><div><h2 id="faq-heading">Before we begin.</h2><p>Practical answers. The details are agreed for your project.</p></div><div className="faq-list">{questions.map(([question,answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>;
}
