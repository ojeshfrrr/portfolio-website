const key = 'ovio:inquiry:v1';
const limits: Record<string, number> = { name: 100, email: 254, businessName: 120, projectType: 80, description: 3000, budget: 120, timeline: 150, goal: 120, industry: 120, features: 1200, plannerBrief: 6500 };
let memory = '';
export function readInquiry() {
  try {
    let raw = memory;
    try { raw = sessionStorage.getItem(key) || raw; } catch { /* Use memory. */ }
    const value = JSON.parse(raw || 'null');
    if (!value || value.version !== 1 || !Number.isFinite(value.savedAt) || value.savedAt > Date.now() || Date.now() - value.savedAt > 86400000 || !value.fields || typeof value.fields !== 'object') return null;
    const fields: Record<string, string> = {};
    for (const [name, limit] of Object.entries(limits)) if (typeof value.fields[name] === 'string') fields[name] = value.fields[name].slice(0, limit);
    return { fields, savedAt: value.savedAt as number, submissionId: typeof value.submissionId === 'string' && /^[a-f0-9-]{36}$/i.test(value.submissionId) ? value.submissionId : '' };
  } catch { return null; }
}
export function saveInquiry(fields: Record<string, string>, submissionId = '') {
  const safe: Record<string, string> = {};
  for (const [name, limit] of Object.entries(limits)) if (typeof fields[name] === 'string') safe[name] = fields[name].slice(0, limit);
  memory = JSON.stringify({ version: 1, savedAt: Date.now(), fields: safe, submissionId });
  try { sessionStorage.setItem(key, memory); return true; } catch { return false; }
}
export function clearInquiry() {
  memory = '';
  try { sessionStorage.removeItem(key); } catch { /* Memory cleared. */ }
}
