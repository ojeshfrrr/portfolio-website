'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { emailDraftUrl } from '../lib/contact.mjs';
import { hasEmail, site } from '../lib/site';
import { contactProjectTypes, prepareBrief } from '../lib/brief.mjs';
import Arrow from './Arrow';
import PlannerHandoff from './PlannerHandoff';
import { features, goals } from '../lib/planner.mjs';
import { readPlannerHandoff, clearPlanner } from '../lib/planner-storage';
import { readInquiry, saveInquiry, clearInquiry } from '../lib/inquiry-storage';

export default function Contact() {
  const [plannerLoaded, setPlannerLoaded] = useState(false);
  const compose = useRef<HTMLFormElement>(null);
  const attempt = useRef({ body: '', id: '' });
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [review, setReview] = useState<Record<string, string> | null>(null);
  const [prepared, setPrepared] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const projectTypeSelect = useRef<HTMLSelectElement>(null);
  const inFlight = useRef(false);
  function readFields(form: HTMLFormElement) {
    const data = new FormData(form);
    return { ...Object.fromEntries(data) as Record<string, string>, features: data.getAll('feature').join('\n') };
  }
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active || !compose.current) return;
      const saved = readInquiry();
      const handoff = readPlannerHandoff();
      const fields = { ...saved?.fields };
      if (handoff && (!saved || handoff.savedAt > saved.savedAt)) {
        const { draft, brief } = handoff;
        Object.assign(fields, { projectType: draft.projectType, businessName: draft.businessName, description: draft.description, industry: draft.industry, goal: draft.goal, features: draft.features.join('\n'), budget: draft.budget, timeline: draft.timeline, plannerBrief: brief });
      }
      const service = new URLSearchParams(window.location.search).get('service');
      if (!handoff && !saved && service && contactProjectTypes.includes(service)) fields.projectType = service;
      for (const [name, value] of Object.entries(fields)) {
        const field = compose.current.elements.namedItem(name);
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) field.value = value;
      }
      compose.current.querySelectorAll<HTMLInputElement>('[name="feature"]').forEach(field => { field.checked = (fields.features || '').split('\n').includes(field.value); });
      setPlannerLoaded(Boolean(fields.plannerBrief));
      if (Object.keys(fields).length) {
        const restored = readFields(compose.current);
        const submissionId = handoff && (!saved || handoff.savedAt > saved.savedAt) ? '' : saved?.submissionId || '';
        attempt.current = { body: JSON.stringify(restored), id: submissionId };
        saveInquiry(restored, submissionId);
      }
    });
    return () => { active = false; };
  }, []);
  function reviewBrief(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = readFields(form);
    saveInquiry(fields);
    const result = prepareBrief(fields);
    setErrors(result.errors);
    setStatus('');
    if (Object.keys(result.errors).length) {
      setStatus('Check the highlighted fields, then review your brief again.');
      form.querySelector<HTMLElement>(`[name="${Object.keys(result.errors)[0]}"]`)?.focus();
      return;
    }
    setPrepared(result.brief);
    setReview(fields);
    requestAnimationFrame(() => reviewHeading.current?.focus());
  }
  function editBrief() {
    setReview(null);
    setSent(false);
    if (sent && compose.current) { compose.current.reset(); clearInquiry(); clearPlanner(); setPlannerLoaded(false); }
    setStatus('');
    requestAnimationFrame(() => nameInput.current?.focus());
  }
  async function deliverBrief() {
    if (inFlight.current || !review) return;
    inFlight.current = true;
    setBusy(true);
    setStatus('Sending your project brief…');
    try {
      if (site.contactFormEnabled) {
        const body = JSON.stringify(review);
        if (attempt.current.body !== body || !attempt.current.id) attempt.current = { body, id: crypto.randomUUID() };
        saveInquiry(review, attempt.current.id);
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.current.id },
          body,
        });
        const result = await response.json().catch(() => ({}));
        if (result.errors) setErrors(result.errors);
        if (!response.ok || result.ok !== true) throw new Error(typeof result.error === 'string' ? result.error : 'Your enquiry could not be delivered. Please try again or use the contact alternative below.');
        setSent(true);
        clearInquiry(); clearPlanner();
        setStatus('The email service accepted your enquiry for OVIO. Thanks for getting in touch.');
      } else if (hasEmail) {
        window.location.href = emailDraftUrl(site.email, prepared)!;
        setStatus('Your email app should open with the reviewed draft. Send it there when ready. Nothing has been sent from this website.');
      } else {
        await navigator.clipboard.writeText(prepared);
        setStatus('Project brief copied. Nothing has been sent. Keep your brief until studio contact details are configured.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The automatic action is unavailable. Open “Copy manually” below, select the brief, and copy it. Nothing has been sent.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function copyEmail() {
    try { await navigator.clipboard.writeText(site.email); setStatus('Email copied.'); }
    catch { setStatus(`Copy is unavailable. Select the address ${site.email} or use the email link.`); }
  }
  const fieldError = (name: string) => errors[name] ? <p className="form-error" id={`${name}-error`}>{errors[name]}</p> : null;
  const aria = (name: string) => ({ 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `${name}-error` : undefined });
  return <div className="brief-form" aria-busy={busy} data-delivery-state={busy ? 'sending' : sent ? 'accepted' : 'idle'}>
    {plannerLoaded ? <PlannerHandoff/> : null}
    <ol className="brief-progress" aria-label="Project brief progress"><li aria-current={!review ? 'step' : undefined}><span>01</span> Your project</li><li aria-current={review ? 'step' : undefined}><span>02</span> Review & share</li></ol>
    <p className="brief-notice">{site.contactFormEnabled ? 'Review your brief, then send it securely to the configured studio inbox.' : hasEmail ? 'Online sending is not configured yet. Review your brief and open an email draft to workwithovio@gmail.com.' : 'Studio contact is not configured yet. You can review and copy your brief; nothing is sent.'}</p>
    <form ref={compose} className="contact-compose" noValidate onSubmit={reviewBrief} onChange={event => { setErrors({}); setStatus(''); saveInquiry(readFields(event.currentTarget)); }} hidden={Boolean(review)}>
      <div className="form-grid">
        <div className="form-field"><label htmlFor="enquiry-name">Name</label><input ref={nameInput} id="enquiry-name" name="name" autoComplete="name" maxLength={100} required {...aria('name')}/>{fieldError('name')}</div>
        <div className="form-field"><label htmlFor="enquiry-email">Email</label><input id="enquiry-email" name="email" type="email" autoComplete="email" spellCheck={false} maxLength={254} required {...aria('email')}/>{fieldError('email')}</div>
        <div className="form-field"><label htmlFor="business-name">Business or project name <span className="field-hint">(optional)</span></label><input id="business-name" name="businessName" autoComplete="organization" maxLength={120} {...aria('businessName')}/>{fieldError('businessName')}</div>
        <div className="form-field"><label htmlFor="project-type">Project type</label><select ref={projectTypeSelect} id="project-type" name="projectType" defaultValue="" required {...aria('projectType')}><option value="">Choose a starting point</option>{contactProjectTypes.map(type => <option key={type} value={type}>{type}</option>)}</select>{fieldError('projectType')}</div>
        <div className="form-field"><label htmlFor="project-industry">Industry (optional)</label><input id="project-industry" name="industry" maxLength={120} {...aria('industry')}/>{fieldError('industry')}</div><div className="form-field"><label htmlFor="project-goal">Primary goal (optional)</label><select id="project-goal" name="goal" {...aria('goal')}><option value="">To discuss</option>{goals.map(goal => <option key={goal}>{goal}</option>)}</select>{fieldError('goal')}</div><div className="form-field"><label htmlFor="project-budget">Working budget (optional)</label><input id="project-budget" name="budget" autoComplete="off" maxLength={120} placeholder="Your range, or let’s discuss…" {...aria('budget')}/>{fieldError('budget')}</div>
      </div>
      <div className="form-field"><label htmlFor="project-brief">Tell me about your project</label><textarea id="project-brief" name="description" data-lenis-prevent rows={5} maxLength={3000} autoComplete="off" required placeholder="Your business, what you want to build, and what matters most…" {...aria('description')}/>{fieldError('description')}</div>
      <div className="form-field timeline-field"><label htmlFor="project-timeline">Desired timeline (optional)</label><input id="project-timeline" name="timeline" autoComplete="off" maxLength={150} placeholder="A target date, or flexible…" {...aria('timeline')}/>{fieldError('timeline')}<p className="field-hint">A preference to discuss, not a confirmed delivery date.</p></div>
      <details className="inquiry-features"><summary>Features for discussion (optional)</summary><fieldset><legend>Select relevant features</legend>{features.map(([feature]) => <label key={feature}><input type="checkbox" name="feature" value={feature}/><span>{feature}</span></label>)}</fieldset>{fieldError('features')}</details>
      <details className="manual-copy" hidden={!plannerLoaded}><summary>Review or edit your planner brief</summary><label htmlFor="planner-brief">Planner brief</label><textarea id="planner-brief" name="plannerBrief" rows={10} maxLength={6500} data-lenis-prevent {...aria('plannerBrief')}/>{fieldError('plannerBrief')}<p className="field-hint">Included with your enquiry. A planning brief is not a quote or confirmed schedule.</p></details>
      <div className="form-trap" aria-hidden="true"><label htmlFor="company-website">Leave this field empty</label><input id="company-website" name="website" tabIndex={-1} autoComplete="off"/></div>
      <p className="field-hint">Your draft stays in this browser tab for up to 24 hours. It is sent only when you choose Send, or send it from your email app.</p>
      <button className="button primary" type="submit">Review your brief <Arrow/></button>
    </form>
    {review ? <section className="brief-review" aria-labelledby="brief-review-heading"><h2 ref={reviewHeading} tabIndex={-1} id="brief-review-heading">{sent ? 'Your brief is ready for follow-up.' : 'Ready for a conversation.'}</h2><p>{sent ? 'The email service accepted your enquiry for workwithovio@gmail.com. Inbox delivery is not independently confirmed here.' : 'Check the details below. You can go back and change anything.'}</p>{!sent && Object.keys(errors).length > 0 ? <div className="brief-error-summary" role="alert"><p>Some answers need attention. Go back to edit; your entries are preserved.</p><ul>{Object.values(errors).map(error => <li key={error}>{error}</li>)}</ul></div> : null}<dl>{[['Name',review.name],['Email',review.email],['Business or project',review.businessName?.trim() || 'Not provided'],['Project type',review.projectType],['Primary goal',review.goal || 'To discuss'],['Industry',review.industry || 'Not provided'],['Selected features',review.features || 'To discuss'],['Working budget',review.budget?.trim() || 'To discuss'],['Desired timeline',review.timeline?.trim() || 'Flexible / to discuss']].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value.trim()}</dd></div>)}</dl><h3>Your project</h3><p className="review-description">{review.description.trim()}</p><details className="manual-copy"><summary>Review the complete enquiry</summary><label htmlFor="complete-enquiry">Complete enquiry, including planner notes</label><textarea id="complete-enquiry" value={prepared} readOnly rows={10} data-lenis-prevent/></details><div className="brief-actions">{sent ? null : <button type="button" className="button primary" disabled={busy} onClick={deliverBrief}>{busy ? 'Sending…' : site.contactFormEnabled ? 'Send project brief' : hasEmail ? 'Open email draft' : 'Copy project brief'}<Arrow diagonal={site.contactFormEnabled || hasEmail}/></button>}<button type="button" className="edit-brief" disabled={busy} onClick={editBrief}>{sent ? 'Start another brief' : 'Back to edit'}</button></div>{!sent && !busy && hasEmail && site.contactFormEnabled ? <a className="text-link" href={emailDraftUrl(site.email, prepared)!}>Open email draft instead <Arrow diagonal/></a> : null}{!sent ? <details className="manual-copy"><summary>Copy manually</summary><label htmlFor="prepared-brief">Your reviewed brief</label><textarea id="prepared-brief" value={prepared} readOnly rows={8} data-lenis-prevent onFocus={event => event.currentTarget.select()}/></details> : null}</section> : null}
    <p className="contact-status" role="status" aria-live="polite">{status}</p>
    {hasEmail ? <div className="email-shortcuts"><a className="contact-email" href={`mailto:${site.email}`}>{site.email}</a><button type="button" className="edit-brief" onClick={copyEmail}>Copy email</button></div> : null}
    {site.whatsapp ? <a className="text-link whatsapp-link" href={site.whatsapp} target="_blank" rel="noopener noreferrer">Discuss your project on WhatsApp <Arrow diagonal/></a> : null}
  </div>;
}
