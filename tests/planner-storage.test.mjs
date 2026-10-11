import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDraft } from '../src/lib/planner.mjs';
import { clearPlanner, readPlannerBrief, readPlannerDraft, savePlannerBrief, savePlannerDraft } from '../src/lib/planner-storage.ts';

test('blocked session storage falls back to memory and restart clears both draft and brief', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new Error('Storage blocked'); } });
  try {
    const draft = { ...emptyDraft(), projectType: 'Landing page' };
    assert.equal(savePlannerDraft(draft), false);
    assert.equal(savePlannerBrief('A reviewed brief'), false);
    assert.equal(readPlannerDraft().projectType, 'Landing page');
    assert.equal(readPlannerBrief(), 'A reviewed brief');
    clearPlanner();
    assert.deepEqual(readPlannerDraft(), emptyDraft());
    assert.equal(readPlannerBrief(), '');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous);
    else delete globalThis.sessionStorage;
  }
});

test('session storage preserves the versioned draft and handoff independently', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const entries = new Map();
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) } });
  try {
    assert.equal(savePlannerDraft({ ...emptyDraft(), projectType: 'Website redesign' }), true);
    assert.equal(savePlannerBrief('Brief for contact'), true);
    assert.equal(readPlannerDraft().projectType, 'Website redesign');
    assert.equal(readPlannerBrief(), 'Brief for contact');
    clearPlanner();
    assert.equal(entries.size, 0);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous);
    else delete globalThis.sessionStorage;
  }
});
