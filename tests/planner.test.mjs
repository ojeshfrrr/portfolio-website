import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDraft, normalizeDraft, generateBrief, validateStep, projectTypes } from '../src/lib/planner.mjs';

const complete = () => ({ ...emptyDraft(), projectType: 'Business website', businessName: 'Example Studio', industry: 'Design', description: 'A small studio presenting its work and receiving project enquiries.', goal: 'Generate leads or inquiries', features: ['Contact forms', 'Authentication and user accounts'], budget: '₹10,000–₹20,000', timeline: 'Within 2–4 weeks', step: 4 });
test('each offered project type is accepted; incomplete steps cannot produce a brief', () => {
  for (const [projectType] of projectTypes) assert.deepEqual(validateStep({ ...emptyDraft(), projectType }, 0), {});
  assert.equal(generateBrief(emptyDraft()), '');
  assert.ok(validateStep(emptyDraft(), 1).description);
  assert.ok(validateStep(emptyDraft(), 3).timeline);
});
test('generated brief retains actual answers and explicitly qualifies complex scope', () => {
  const brief = generateBrief(complete());
  for (const value of ['Example Studio', 'Design', 'Contact forms', '₹10,000–₹20,000', 'Within 2–4 weeks', 'Additional scoping needed: Authentication and user accounts', 'not a quote']) assert.ok(brief.includes(value));
  assert.ok(generateBrief({ ...complete(), projectType: 'E-commerce website' }).includes('payment providers'));
});
test('restored storage is bounded, deduplicated, and returns incomplete drafts to the required step', () => {
  const draft = normalizeDraft({ ...complete(), businessName: 'x'.repeat(500), features: ['Contact forms', 'Contact forms', 'Invented feature'], goal: 'Invalid goal' });
  assert.equal(draft.businessName.length, 120);
  assert.deepEqual(draft.features, ['Contact forms']);
  assert.equal(draft.step, 1);
  assert.deepEqual(normalizeDraft({ version: 99 }), emptyDraft());
  assert.deepEqual(normalizeDraft(null), emptyDraft());
});
test('edits update the deterministic brief and optional fields never become invented information', () => {
  const draft = { ...complete(), businessName: '', industry: '', features: [], budget: 'Not sure yet' };
  const brief = generateBrief(draft);
  assert.ok(!brief.includes('Example Studio'));
  assert.ok(brief.includes('No features selected'));
  assert.ok(brief.includes('Working budget (INR): Not sure yet'));
  assert.ok(generateBrief({ ...draft, projectType: 'Website redesign' }).includes('Project type: Website redesign'));
});
