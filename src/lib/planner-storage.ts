import { normalizeDraft, generateBrief, type PlannerDraft } from './planner.mjs';

const draftKey = 'ovio:planner:v1';
const briefKey = 'ovio:planner-brief:v1';
const handoffKey = 'ovio:planner-handoff:v1';
let memoryHandoff = '';
export function readPlannerHandoff() {
  try {
    let raw = memoryHandoff;
    try { raw = sessionStorage.getItem(handoffKey) || raw; } catch { /* Use memory. */ }
    const value = JSON.parse(raw || 'null');
    if (!value || value.version !== 1 || !Number.isFinite(value.savedAt) || value.savedAt > Date.now() || Date.now() - value.savedAt > 86400000) return null;
    const draft = normalizeDraft(value.draft);
    const brief = generateBrief(draft);
    return brief ? { draft, brief, savedAt: value.savedAt as number } : null;
  } catch { return null; }
}
// Client-only fallback survives App Router navigation when storage is blocked.
let memoryDraft: PlannerDraft | undefined;
let memoryBrief = '';
export function readPlannerDraft() {
  try { const stored = sessionStorage.getItem(draftKey); return normalizeDraft(stored ? JSON.parse(stored) : memoryDraft); }
  catch { return normalizeDraft(memoryDraft); }
}
export function savePlannerDraft(draft: PlannerDraft) {
  memoryDraft = draft;
  try { sessionStorage.setItem(draftKey, JSON.stringify(draft)); return true; }
  catch { return false; }
}
export function savePlannerBrief(brief: string) {
  memoryBrief = brief;
  const draft = readPlannerDraft();
  memoryHandoff = generateBrief(draft) ? JSON.stringify({ version: 1, savedAt: Date.now(), draft }) : '';
  try { if (memoryHandoff) sessionStorage.setItem(handoffKey, memoryHandoff); else sessionStorage.removeItem(handoffKey); } catch { /* Use memory. */ }
  try { sessionStorage.setItem(briefKey, brief); return true; }
  catch { return false; }
}
export function readPlannerBrief() {
  try { return sessionStorage.getItem(briefKey) || memoryBrief; }
  catch { return memoryBrief; }
}
export function clearPlanner() {
  memoryDraft = undefined;
  memoryBrief = '';
  memoryHandoff = '';
  try { sessionStorage.removeItem(draftKey); sessionStorage.removeItem(briefKey); sessionStorage.removeItem(handoffKey); }
  catch { /* In-memory data has still been cleared. */ }
}
