import test from 'node:test';
import assert from 'node:assert/strict';
import Lenis from 'lenis';

// These tests run the installed Lenis module against synthetic input and minimal
// DOM dimensions. They do not emulate browser layout, native touch momentum,
// trackpad hardware, Next routing, or the application's event integration.
class TestElement extends EventTarget {
  attributes = new Set();
  classList = new Set();
  scrollTop = 0;
  scrollLeft = 0;
  scrollHeight = 4000;
  scrollWidth = 1000;
  clientHeight = 800;
  clientWidth = 1000;
  computedStyle = {
    overflowX: 'auto', overflowY: 'auto',
    overscrollBehaviorX: 'auto', overscrollBehaviorY: 'auto',
    scrollMarginTop: '0px', scrollPaddingTop: '0px',
  };

  constructor() {
    super();
    this.classList.remove = this.classList.delete.bind(this.classList);
  }

  hasAttribute(name) { return this.attributes.has(name); }
}

class TestWindow extends EventTarget {
  innerWidth = 1000;
  innerHeight = 800;
  scrollX = 0;
  scrollY = 0;
  listeners = new Map();

  addEventListener(type, listener, options) {
    super.addEventListener(type, listener, options);
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }

  removeEventListener(type, listener, options) {
    super.removeEventListener(type, listener, options);
    this.listeners.get(type)?.delete(listener);
  }

  scrollTo({ top = this.scrollY, left = this.scrollX }) {
    this.scrollY = top;
    this.scrollX = left;
  }
}

function browserFixture(run) {
  const saved = new Map();
  const root = new TestElement();
  const browser = new TestWindow();
  const motion = { matches: false };
  const frames = new Map();
  let nextFrame = 0;
  let time = 0;
  const install = (name, value) => {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  };
  browser.matchMedia = () => motion;
  browser.getComputedStyle = element => element.computedStyle;
  install('Window', TestWindow);
  install('HTMLElement', TestElement);
  install('window', browser);
  install('document', { documentElement: root });
  install('navigator', { userAgent: 'Lenis Node simulation' });
  install('getComputedStyle', element => element.computedStyle);
  install('requestAnimationFrame', callback => {
    const id = ++nextFrame;
    frames.set(id, callback);
    return id;
  });
  install('cancelAnimationFrame', id => frames.delete(id));
  const lenis = new Lenis({
    autoResize: false,
    autoRaf: true,
    lerp: 0.12,
    syncTouch: false,
    respectReducedMotion: true,
    allowNestedScroll: true,
  });
  const frame = () => {
    time += 1000 / 60;
    const pending = [...frames.values()];
    frames.clear();
    for (const callback of pending) callback(time);
  };
  const input = (type, values = {}, target = root) => {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { deltaX: 0, deltaY: 0, deltaMode: 0, ctrlKey: false, ...values });
    event.composedPath = () => target === root ? [root, browser] : [target, root, browser];
    browser.dispatchEvent(event);
    return event;
  };
  try {
    run({ lenis, browser, root, motion, frames, frame, input });
  } finally {
    lenis.destroy();
    frames.clear();
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
}

test('installed Lenis smooths wheel input, reverses, and settles without overshoot', () => {
  browserFixture(({ lenis, browser, frame, input }) => {
    const wheel = input('wheel', { deltaY: 240 });
    assert.equal(wheel.defaultPrevented, true);
    assert.equal(browser.scrollY, 0);
    frame();
    frame();
    assert.ok(browser.scrollY > 0 && browser.scrollY < 240);
    for (let i = 0; i < 6; i++) frame();
    const beforeReversal = browser.scrollY;
    input('wheel', { deltaY: -200 });
    frame();
    assert.ok(browser.scrollY < beforeReversal);
    assert.equal(lenis.direction, -1);
    let previous = browser.scrollY;
    for (let i = 0; i < 180; i++) {
      frame();
      assert.ok(browser.scrollY <= previous);
      assert.ok(browser.scrollY >= 40);
      previous = browser.scrollY;
    }
    assert.equal(browser.scrollY, 40);
    assert.equal(lenis.isScrolling, false);
  });
});

test('Lenis reduced motion settles wheel input quickly and makes programmatic scrolling immediate', () => {
  browserFixture(({ lenis, browser, motion, frame, input }) => {
    motion.matches = true;
    assert.equal(lenis.prefersReducedMotion, true);
    input('wheel', { deltaY: 240 });
    frame();
    frame();
    // In 1.3.26, lerp:1 still uses exponential damping, so reduced wheel input
    // settles quickly rather than changing by the full delta on its first frame.
    assert.ok(browser.scrollY > 150);
    for (let i = 0; i < 12; i++) frame();
    assert.equal(browser.scrollY, 240);
    assert.equal(lenis.isScrolling, false);
    lenis.scrollTo(600, { duration: 0.7, lerp: 0 });
    assert.equal(browser.scrollY, 600);
    assert.equal(lenis.isScrolling, false);
  });
});

test('disabling smoothWheel for reduced motion leaves wheel handling native', () => {
  browserFixture(({ lenis, browser, motion, frame, input }) => {
    motion.matches = true;
    lenis.options.smoothWheel = false;
    assert.equal(input('wheel', { deltaY: 240 }).defaultPrevented, false);
    assert.equal(lenis.isScrolling, 'native');
    for (let i = 0; i < 10; i++) frame();
    assert.equal(browser.scrollY, 0);
    assert.equal(lenis.animate.isRunning, false);
  });
});

test('syncTouch false leaves touch movement and touchend unprevented', () => {
  browserFixture(({ lenis, browser, frame, input }) => {
    const touch = clientY => ({ targetTouches: [{ clientX: 100, clientY }] });
    input('touchstart', touch(300));
    const move = input('touchmove', touch(220));
    const end = input('touchend');
    assert.equal(move.defaultPrevented, false);
    assert.equal(end.defaultPrevented, false);
    assert.equal(lenis.isScrolling, 'native');
    for (let i = 0; i < 10; i++) frame();
    // The fixture intentionally does not synthesize native browser scrolling.
    assert.equal(browser.scrollY, 0);
    assert.equal(lenis.animate.isRunning, false);
  });
});

test('nested textarea scrolling and explicit prevent markers bypass page smoothing', () => {
  browserFixture(({ lenis, browser, frame, input }) => {
    const textarea = new TestElement();
    textarea.clientHeight = 100;
    textarea.scrollHeight = 500;
    textarea.scrollTop = 50;
    assert.equal(input('wheel', { deltaY: 100 }, textarea).defaultPrevented, false);
    assert.equal(lenis.animate.isRunning, false);

    textarea.scrollTop = 400;
    assert.equal(input('wheel', { deltaY: 100 }, textarea).defaultPrevented, true);
    frame();
    frame();
    assert.ok(browser.scrollY > 0);

    lenis.reset();
    textarea.attributes.add('data-lenis-prevent');
    assert.equal(input('wheel', { deltaY: 100 }, textarea).defaultPrevented, false);
    assert.equal(lenis.animate.isRunning, false);
  });
});

test('automatic RAF stays singular and destroy releases its loop and input listeners', () => {
  browserFixture(({ lenis, root, frames, frame, input, browser }) => {
    assert.equal(frames.size, 1);
    input('wheel', { deltaY: 240 });
    for (let i = 0; i < 4; i++) {
      frame();
      assert.equal(frames.size, 1);
    }
    lenis.destroy();
    assert.equal(frames.size, 0);
    assert.equal([...root.classList].some(name => name.startsWith('lenis')), false);
    assert.equal([...browser.listeners.values()].reduce((sum, listeners) => sum + listeners.size, 0), 0);
    assert.equal(input('wheel', { deltaY: 100 }).defaultPrevented, false);
  });
});
