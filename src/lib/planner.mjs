export const projectTypes = [
  ['Landing page', 'One offer, campaign, or product with a clear next step.'],
  ['Business website', 'A multi-page home for your business and services.'],
  ['Custom web application', 'A useful tool built around a specific workflow.'],
  ['E-commerce website', 'A shop or selling experience; scope and payments to discuss.'],
  ['Website redesign', 'Improve or replace the website you already have.'],
  ['Not sure yet', 'Start with the idea. We can discuss the right format.'],
];
export const goals = ['Generate leads or inquiries', 'Present a business or portfolio', 'Sell products or services', 'Provide a tool or application', 'Improve or replace an existing website', 'Explore an idea or something else'];
export const features = [
  ['Contact forms', false], ['WhatsApp contact integration', false],
  ['Booking or appointment requests', true], ['Blog or content management', true],
  ['Authentication and user accounts', true], ['User dashboards', true],
  ['E-commerce and payments', true], ['Third-party integrations', true],
  ['Interactive animations', false], ['Analytics and SEO', false],
  ['Not sure — help me decide', false],
];
export const budgets = ['Under ₹5,000', '₹5,000–₹10,000', '₹10,000–₹20,000', '₹20,000–₹50,000', '₹50,000+', 'Not sure yet'];
export const timelines = ['As soon as reasonably possible', 'Within 1–2 weeks', 'Within 2–4 weeks', 'Within 1–2 months', 'Flexible — quality matters more than speed', 'Not sure yet'];
export function emptyDraft() {
  return { version: 1, step: 0, projectType: '', businessName: '', industry: '', description: '', goal: '', features: [], budget: '', timeline: '' };
}
// Storage is untrusted input: accept only bounded strings and known choices.
export function normalizeDraft(value) {
  const draft = emptyDraft();
  if (!value || typeof value !== 'object' || value.version !== 1) return draft;
  for (const [key, limit] of [['businessName', 120], ['industry', 120], ['description', 1000]]) {
    if (typeof value[key] === 'string') draft[key] = value[key].slice(0, limit);
  }
  for (const [key, options] of [['projectType', projectTypes.map(([label]) => label)], ['goal', goals], ['budget', budgets], ['timeline', timelines]]) {
    if (options.includes(value[key])) draft[key] = value[key];
  }
  if (Array.isArray(value.features)) draft.features = [...new Set(value.features.filter(item => features.some(([label]) => item === label)))];
  if (Number.isInteger(value.step) && value.step >= 0 && value.step <= 4) draft.step = value.step;
  // Never restore an inaccessible review from a partial or corrupt draft.
  for (let step = 0; step < draft.step; step++) {
    if (Object.keys(validateStep(draft, step)).length) { draft.step = step; break; }
  }
  return draft;
}
export function validateStep(draft, step) {
  const errors = {};
  if (step === 0 && !projectTypes.some(([label]) => label === draft.projectType)) errors.projectType = 'Choose a project type, or select “Not sure yet”.';
  if (step === 1) {
    if (draft.description.trim().length < 20 || draft.description.length > 1000) errors.description = 'Describe the business or idea in 20–1,000 characters.';
    if (!goals.includes(draft.goal)) errors.goal = 'Choose the main goal that comes closest to your project.';
  }
  if (step === 3) {
    if (!budgets.includes(draft.budget)) errors.budget = 'Choose a working budget, or select “Not sure yet”.';
    if (!timelines.includes(draft.timeline)) errors.timeline = 'Choose a timeline preference, or select “Not sure yet”.';
  }
  return errors;
}
export function generateBrief(draft) {
  if ([0, 1, 3].some(step => Object.keys(validateStep(draft, step)).length)) return '';
  const complex = draft.features.filter(item => features.some(([label, scoped]) => label === item && scoped));
  return [
    'OVIO — Project planning brief', '', `Project type: ${draft.projectType}`,
    ...(draft.businessName.trim() ? [`Business / project: ${draft.businessName.trim()}`] : []),
    ...(draft.industry.trim() ? [`Industry: ${draft.industry.trim()}`] : []),
    '', 'Business / idea', draft.description.trim(), '', `Main goal: ${draft.goal}`,
    '', 'Features for discussion', ...(draft.features.length ? draft.features.map(item => `• ${item}`) : ['No features selected — discuss what is needed.']),
    '', `Working budget (INR): ${draft.budget}`, `Timeline preference: ${draft.timeline}`,
    '', 'Scope notes', 'This is a planning brief, not a quote, confirmed schedule, or submitted enquiry.',
    'Every feature requires an agreed scope; no package inclusion or technical estimate is implied.',
    ...(complex.length ? [`Additional scoping needed: ${complex.join(', ')}.`] : []),
    ...(draft.projectType === 'Not sure yet' || draft.features.includes('Not sure — help me decide') ? ['The project format or features still need discussion.'] : []),
    ...(draft.projectType === 'E-commerce website' ? ['Selling, payment providers, platform suitability, and ongoing costs need separate discussion.'] : []),
  ].join('\n');
}
