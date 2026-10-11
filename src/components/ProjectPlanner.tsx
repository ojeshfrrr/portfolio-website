'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Arrow from './Arrow';
import SelectionMark from './SelectionMark';
import { budgets, emptyDraft, features, generateBrief, goals, projectTypes, timelines, validateStep, type PlannerDraft } from '../lib/planner.mjs';
import { clearPlanner, readPlannerDraft, savePlannerBrief, savePlannerDraft } from '../lib/planner-storage';

const steps = ['Project type', 'Your idea', 'Features', 'Budget & timing', 'Review'];
const titles = ['What are we building?', 'Tell me about your project.', 'What should it do?', 'Set your preferences.', 'Your idea, in one brief.'];

export default function ProjectPlanner() {
  const selectionId = useId();
  const router = useRouter();
  const [draft, setDraft] = useState<PlannerDraft>(emptyDraft);
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [editing, setEditing] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const focusStep = useRef(false);
  const brief = generateBrief(draft);

  useEffect(() => {
    let active = true;
    // Read session data after hydration; server markup has the same initial state.
    Promise.resolve().then(() => {
      if (!active) return;
      const restored = readPlannerDraft();
      setDraft(restored);
      setStorageAvailable(savePlannerDraft(restored));
      setReady(true);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (focusStep.current) { heading.current?.focus(); focusStep.current = false; }
  }, [draft.step]);

  function commit(nextDraft: PlannerDraft) {
    setDraft(nextDraft);
    setStorageAvailable(savePlannerDraft(nextDraft));
  }
  function update<K extends keyof PlannerDraft>(key: K, value: PlannerDraft[K]) {
    commit({ ...draft, [key]: value });
    setErrors(previous => { const next = { ...previous }; delete next[key]; return next; });
    setStatus('');
  }
  function go(step: number) {
    focusStep.current = true;
    commit({ ...draft, step });
    setErrors({}); setStatus(''); setConfirmRestart(false);
  }
  function next() {
    const problems = validateStep(draft, draft.step);
    setErrors(problems);
    if (Object.keys(problems).length) {
      setStatus('Check the highlighted answers before continuing.');
      panel.current?.querySelector<HTMLElement>(`[name="${Object.keys(problems)[0]}"]`)?.focus();
      return;
    }
    go(editing ? 4 : draft.step + 1);
    setEditing(false);
  }
  function edit(step: number) { setEditing(true); go(step); }
  async function copy() {
    try { await navigator.clipboard.writeText(brief); setStatus('Project brief copied. Nothing has been sent.'); }
    catch { setStatus('Clipboard access is unavailable. Open “Copy manually” below to select and copy your brief.'); }
  }
  function handoff() {
    if (!brief) return;
    savePlannerDraft(draft);
    savePlannerBrief(brief);
    router.push('/contact');
  }
  function restart() {
    clearPlanner(); setEditing(false); focusStep.current = true; commit(emptyDraft());
    setErrors({}); setConfirmRestart(false);
    setStatus('Planner restarted. Your previous draft has been cleared.');
  }
  const error = (key: string) => errors[key] ? <p className="form-error" id={`planner-${key}-error`}>{errors[key]}</p> : null;
  const aria = (key: string) => ({ 'aria-invalid': Boolean(errors[key]), 'aria-describedby': errors[key] ? `planner-${key}-error` : undefined });
  function radioOptions(name: 'projectType' | 'budget' | 'timeline', options: [string, string][]) {
    return <div className="planner-choices">{options.map(([label, detail]) => <label className="planner-choice" key={label}><input type="radio" name={name} value={label} checked={draft[name] === label} onChange={() => update(name, label)} {...aria(name)}/><span><strong>{label}</strong>{detail ? <small>{detail}</small> : null}</span></label>)}</div>;
  }

  return <div className="planner-layout">
    <div className="planner-main">
      <ol className="planner-progress" aria-label="Project planner progress">{steps.map((label, index) => <li key={label} aria-current={draft.step === index ? 'step' : undefined} data-complete={draft.step > index}>{draft.step === index && <SelectionMark id={selectionId} style="bar"/>}<span>{String(index + 1).padStart(2, '0')}</span><span>{label}</span></li>)}</ol>
      <p className="planner-step-count">Step {draft.step + 1} of 5 · {steps[draft.step]}</p>
      <div ref={panel} className="planner-panel">
        <h2 ref={heading} tabIndex={-1}>{titles[draft.step]}</h2>
        {!ready ? <p role="status">Preparing your local draft…</p> : <form onSubmit={event => event.preventDefault()} noValidate>
          <div key={draft.step} className="planner-step">
            {draft.step === 0 && <fieldset><legend>Choose one project type</legend>{radioOptions('projectType', projectTypes)}{error('projectType')}</fieldset>}
            {draft.step === 1 && <>
              <div className="form-grid">
                <div className="form-field"><label htmlFor="planner-business">Business or project name (optional)</label><input id="planner-business" name="businessName" value={draft.businessName} onChange={event => update('businessName', event.target.value)} autoComplete="organization" maxLength={120}/></div>
                <div className="form-field"><label htmlFor="planner-industry">Industry or business type (optional)</label><input id="planner-industry" name="industry" value={draft.industry} onChange={event => update('industry', event.target.value)} maxLength={120}/></div>
              </div>
              <div className="form-field"><label htmlFor="planner-description">Describe your business or idea</label><textarea id="planner-description" name="description" required rows={4} maxLength={1000} value={draft.description} onChange={event => update('description', event.target.value)} placeholder="What do you do, and who is it for…" data-lenis-prevent {...aria('description')}/><p className="field-hint">A few sentences are enough. 20–1,000 characters; avoid confidential details.</p>{error('description')}</div>
              <div className="form-field"><label htmlFor="planner-goal">Main project goal</label><select id="planner-goal" name="goal" required value={draft.goal} onChange={event => update('goal', event.target.value)} {...aria('goal')}><option value="">Choose the closest fit</option>{goals.map(goal => <option key={goal}>{goal}</option>)}</select>{error('goal')}</div>
            </>}
            {draft.step === 2 && <fieldset><legend>Select the features you want to discuss (optional)</legend><p className="planner-note">Choose several, or ask for help deciding. “Scope separately” means complexity, provider costs, and feasibility need discussion — not that the feature is included.</p><div className="planner-choices">{features.map(([label, scoped]) => <label className="planner-choice" key={label}><input type="checkbox" name="features" value={label} checked={draft.features.includes(label)} onChange={event => update('features', event.target.checked ? [...draft.features, label] : draft.features.filter(item => item !== label))}/><span><strong>{label}</strong>{scoped ? <small>Scope separately</small> : null}</span></label>)}</div></fieldset>}
            {draft.step === 3 && <><p className="planner-note">These are your preferences, not a quote or guaranteed delivery date. The scope, price, and schedule are agreed separately.</p><fieldset><legend>Working budget · INR</legend>{radioOptions('budget', budgets.map(label => [label, '']))}{error('budget')}</fieldset><fieldset><legend>Desired timeline</legend>{radioOptions('timeline', timelines.map(label => [label, '']))}{error('timeline')}</fieldset></>}
            {draft.step === 4 && <>
              <p className="planner-note">Your answers, brought together. Review them before continuing; nothing has been sent.</p>
              <div className="planner-review">{[
                ['Project type', draft.projectType, 0],
                ['Business & goal', [draft.businessName, draft.industry, draft.description, `Goal: ${draft.goal}`].filter(Boolean).join('\n'), 1],
                ['Features for discussion', draft.features.join('\n') || 'No features selected — discuss what is needed.', 2],
                ['Budget & timing', `${draft.budget}\n${draft.timeline}`, 3],
              ].map(([label, value, step]) => <section key={label}><div><h3>{label}</h3><button type="button" className="edit-brief" aria-label={`Edit ${label}`} onClick={() => edit(Number(step))}>Edit</button></div><p>{value}</p></section>)}</div>
              <p className="planner-note">All features need an agreed scope. This brief is not a quote, confirmed schedule, or submitted enquiry. Complex features and e-commerce need additional scoping.</p>
              <div className="planner-review-actions"><button type="button" className="button primary" onClick={handoff}>Continue to contact <Arrow/></button><button type="button" className="button planner-secondary" onClick={copy}>Copy project brief</button></div>
              <details className="manual-copy"><summary>Copy manually</summary><label htmlFor="planner-brief">Generated project brief</label><textarea id="planner-brief" value={brief} readOnly rows={12} data-lenis-prevent onFocus={event => event.currentTarget.select()}/></details>
            </>}
          </div>
          {draft.step < 4 && <div className="planner-controls"><button type="button" className="edit-brief" disabled={draft.step === 0} onClick={() => { setEditing(false); go(draft.step - 1); }}>Back</button><button type="button" className="button primary" onClick={next}>{editing ? 'Update brief' : 'Continue'} <Arrow/></button></div>}
        </form>}
        <p role="status" aria-live="polite" className="contact-status">{status}</p>
      </div>
      <noscript><p>This interactive planner needs JavaScript. You can <Link href="/contact">contact OVIO directly</Link> instead.</p></noscript>
    </div>
    <aside className="planner-recap" aria-label="Requirements recap"><span className="section-label">Your starting point</span><h2>{draft.projectType || 'A little clarity.'}</h2><dl><div><dt>Goal</dt><dd>{draft.goal || 'Still to choose'}</dd></div><div><dt>Features</dt><dd>{draft.features.length ? `${draft.features.length} selected for discussion` : 'Still to discuss'}</dd></div><div><dt>Working budget</dt><dd>{draft.budget || 'Still to choose'}</dd></div><div><dt>Timing</dt><dd>{draft.timeline || 'Still to choose'}</dd></div></dl><p>{storageAvailable ? 'Saved in this browser session. No data is sent from the planner.' : 'Browser storage is unavailable. Your draft stays in memory during navigation, but a refresh may lose it. Copy your brief before leaving.'}</p>{confirmRestart ? <div className="planner-reset" role="group" aria-label="Confirm restart"><p>Discard this draft and start again?</p><button type="button" className="edit-brief" onClick={restart}>Yes, restart</button><button type="button" className="edit-brief" onClick={() => setConfirmRestart(false)}>Keep my draft</button></div> : <button type="button" className="edit-brief" disabled={!ready} onClick={() => setConfirmRestart(true)}>Restart planner</button>}</aside>
  </div>;
}
