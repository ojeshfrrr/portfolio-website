import { createHash } from 'node:crypto';
import { prepareBrief } from './brief.mjs';
const maxBytes = 32000;
const fields = ['name', 'email', 'businessName', 'projectType', 'budget', 'timeline', 'description', 'industry', 'goal', 'features', 'plannerBrief'];
const required = ['name', 'email', 'projectType', 'description'];
const attempts = new Map();
const reply = (error, status, extras = {}) => Response.json({ error, ...extras }, { status, headers: { 'Cache-Control': 'no-store' } });
// Per-instance backstop only. Configure an edge/WAF rule for distributed deployments.
export function allowInquiry(key, now = Date.now()) {
  for (const [id, item] of attempts) if (item.until <= now) attempts.delete(id);
  const item = attempts.get(key) || { count: 0, until: now + 600000 };
  if (item.count >= 5) return false;
  if (attempts.size >= 2000 && !attempts.has(key)) return false;
  item.count++; attempts.set(key, item); return true;
}
export async function handleContact(request, env, send = fetch, allow = allowInquiry) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || url.host;
  if (request.headers.get('origin') !== `${url.protocol}//${host}`) return reply('Reload the page and try again.', 403);
  if (!(request.headers.get('content-type') || '').startsWith('application/json')) return reply('Use the project enquiry form.', 415);
  if (Number(request.headers.get('content-length')) > maxBytes) return reply('The brief is too large. Shorten it and try again.', 413);
  const reader = request.body?.getReader();
  if (!reader) return reply('The brief could not be read.', 400);
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); return reply('The brief is too large. Shorten it and try again.', 413); }
      chunks.push(value);
    }
  } catch { return reply('The brief could not be read.', 400); }
  let input;
  try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return reply('The brief could not be read.', 400); }
  if (!input || typeof input !== 'object' || Array.isArray(input) || required.some(key => typeof input[key] !== 'string') || fields.some(key => input[key] !== undefined && typeof input[key] !== 'string') || (input.website !== undefined && (typeof input.website !== 'string' || input.website.trim()))) return reply('Please check the project details.', 400);
  const safe = Object.fromEntries(fields.map(key => [key, (input[key] || '').trim()]));
  const { errors, brief } = prepareBrief(safe);
  if (Object.keys(errors).length) return reply('Check the highlighted fields before sending.', 400, { errors });
  const submissionId = request.headers.get('idempotency-key') || '';
  if (!/^[a-f0-9-]{36}$/i.test(submissionId)) return reply('Reload the form before sending.', 400);
  const key = createHash('sha256').update(request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown').digest('hex');
  if (!allow(key)) return reply('Too many attempts. Wait ten minutes, or use the email draft.', 429);
  const { RESEND_API_KEY: apiKey, CONTACT_FROM_EMAIL: from, CONTACT_TO_EMAIL: to } = env;
  if (!apiKey || !from || /[\r\n]/.test(from) || !from.includes('@') || to !== 'workwithovio@gmail.com') return reply('Online delivery is not configured. Your answers are preserved; use the email draft or copy your brief.', 503);
  const idempotency = createHash('sha256').update(submissionId + JSON.stringify(safe)).digest('hex');
  try {
    const delivery = await send('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `ovio-${idempotency}` },
      body: JSON.stringify({ from, to: [to], reply_to: safe.email, subject: `Project enquiry: ${safe.projectType}`, text: brief }),
      signal: AbortSignal.timeout(10000), cache: 'no-store',
    });
    if (!delivery.ok) return reply('The email service did not accept this attempt. Retry or open an email draft; your answers are preserved.', 502);
    const result = await delivery.json();
    if (typeof result.id !== 'string' || !result.id) throw new Error('Missing acceptance ID');
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return reply('Delivery could not be confirmed. Retry safely or use an email draft; your answers are preserved.', 502); }
}
