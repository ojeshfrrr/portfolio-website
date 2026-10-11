import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function load(file, dependencies = {}, globals = {}) {
  const compiled = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiledModule = { exports: {} };
  runInNewContext(compiled, { module: compiledModule, exports: compiledModule.exports, require: id => {
    assert.ok(id in dependencies, `Unexpected dependency: ${id}`);
    return dependencies[id];
  }, ...globals });
  return compiledModule.exports;
}
const system = load('../src/lib/motion-system.ts');

// Controlled lifecycle test doubles, not a visual browser or DOM-layout test.
class Events {
  listeners = new Map();
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  removeEventListener(type, listener) { if (this.listeners.get(type) === listener) this.listeners.delete(type); }
  dispatch(type, event = {}) { this.listeners.get(type)?.(event); }
}
class Element extends Events {
  dataset = {};
  parentElement = null;
  style = { removeProperty() {} };
  constructor(heading = false) { super(); this.heading = heading; }
  querySelectorAll() { return []; }
  matches(selector) { return this.heading && selector.split(',').some(part => ['h2', '.case-features > h2'].includes(part.trim())); }
  closest(selector) { return this.matches(selector) ? this : null; }
  getClientRects() { return [{}]; }
  contains(element) { return element === this; }
}
function harness(reduced = false) {
  const heading = new Element(true);
  const root = new Element();
  root.querySelectorAll = () => [heading];
  const preference = Object.assign(new Events(), { matches: reduced });
  const window = Object.assign(new Events(), { IntersectionObserver: true });
  const document = Object.assign(new Events(), { hidden: false, querySelector: () => root });
  const observers = [];
  class Observer {
    disconnected = false;
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    unobserve() {}
    disconnect() { this.disconnected = true; }
  }
  const controls = [];
  let cleanup;
  const { default: SiteMotion } = load('../src/components/SiteMotion.tsx', {
    react: { useRef: value => ({ current: value }), useEffect: effect => { cleanup = effect(); } },
    'next/navigation': { usePathname: () => '/work' },
    motion: { animate: sequence => {
      const control = { cancelled: false, sequence, cancel() { this.cancelled = true; }, then() {} };
      controls.push(control); return control;
    } },
    '../lib/motion-system': system,
  }, { window, document, Element, HTMLElement: Element, Node: Element,
    IntersectionObserver: Observer, MutationObserver: Observer,
    matchMedia: query => query.includes('reduced-motion') ? preference : { matches: true }, innerHeight: 800 });
  assert.equal(SiteMotion(), null);
  const enter = () => observers[0].callback([{ target: heading, isIntersecting: true }]);
  return { enter, cleanup, controls, root, window, document, preference, observers, heading };
}

test('component entrances play once and focus restores the readable baseline immediately', () => {
  const site = harness();
  site.enter(); site.enter();
  assert.equal(site.controls.length, 1);
  assert.equal(site.heading.dataset.motionEntered, 'true');
  site.root.dispatch('focusin', { target: site.heading });
  assert.equal(site.controls[0].cancelled, true);
  site.cleanup();
});

test('an observer cannot start a reveal over content that was already focused', () => {
  const site = harness();
  site.document.activeElement = site.heading;
  site.enter();
  assert.equal(site.controls.length, 0);
  site.cleanup();
});

test('reduced motion starts no content animation and a changed preference cancels active motion', () => {
  const reduced = harness(true);
  reduced.enter();
  assert.equal(reduced.controls.length, 0);
  reduced.cleanup();
  const site = harness();
  site.enter();
  site.preference.matches = true;
  site.preference.dispatch('change');
  assert.equal(site.controls[0].cancelled, true);
  site.cleanup();
});

test('route cleanup disconnects observers, cancels animation, and removes every listener', () => {
  const site = harness();
  site.enter();
  site.cleanup();
  assert.equal(site.controls[0].cancelled, true);
  assert.ok(site.observers.every(observer => observer.disconnected));
  for (const events of [site.root, site.window, site.document, site.preference]) assert.equal(events.listeners.size, 0);
});

test('shared motion preference has a safe server snapshot and observes live preference changes', () => {
  const preference = Object.assign(new Events(), { matches: false });
  let store;
  const hook = load('../src/lib/useMotionPreference.ts', {
    react: { useSyncExternalStore: (...arguments_) => { store = arguments_; return arguments_[1](); } },
  }, { window: { matchMedia: () => preference } });
  assert.equal(hook.useMotionPreference(), false);
  const [subscribe, snapshot, serverSnapshot] = store;
  assert.equal(serverSnapshot(), true);
  let updates = 0;
  const unsubscribe = subscribe(() => updates++);
  preference.matches = true;
  preference.dispatch('change');
  assert.equal(updates, 1);
  assert.equal(snapshot(), true);
  unsubscribe();
  assert.equal(preference.listeners.size, 0);
});
