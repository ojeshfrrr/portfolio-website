'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { usePathname } from 'next/navigation';

export default function SmoothScroll() {
  const pathname = usePathname();
  const synchronize = useRef<(() => void) | null>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const lenis = new Lenis({
      autoRaf: true,
      anchors: false,
      lerp: 0.12,
      smoothWheel: !reducedMotion.matches,
      wheelMultiplier: 1,
      syncTouch: false,
      respectReducedMotion: true,
      stopInertiaOnNavigate: true,
      allowNestedScroll: true,
      prevent: (node) => node.matches('select, dialog, [role="dialog"]'),
    });
    let anchorFrame = 0;
    let restoreFrame = 0;
    let menuLocked = window.matchMedia('(max-width: 800px)').matches &&
      document.querySelector('[aria-controls="mobile-navigation"]')?.getAttribute('aria-expanded') === 'true';
    let releaseFocus: (() => void) | undefined;

    // Useful during route/lifecycle verification, without exposing the instance.
    const root = document.documentElement;
    if (process.env.NODE_ENV !== 'production') root.dataset.lenisSession = String(performance.now());
    const updateMotionMode = () => {
      // 1.3.26 still interpolates reduced-motion wheel deltas with lerp: 1.
      // Let the browser own wheel scrolling completely for this preference.
      lenis.options.smoothWheel = !reducedMotion.matches;
    };
    const cancelInertia = () => {
      cancelAnimationFrame(anchorFrame);
      anchorFrame = 0;
      lenis.stop();
      if (!menuLocked && !document.hidden) lenis.start();
    };
    const synchronizePosition = () => {
      cancelInertia();
      lenis.resize();
      cancelAnimationFrame(restoreFrame);
      // Next/browser restoration can finish after its navigation event.
      // Synchronize with that actual position, without forcing a top/hash jump.
      restoreFrame = requestAnimationFrame(() => {
        cancelInertia();
        lenis.resize();
        restoreFrame = 0;
      });
    };
    synchronize.current = synchronizePosition;
    const onMenuLock = (event: Event) => {
      menuLocked = (event as CustomEvent<boolean>).detail;
      if (menuLocked) cancelInertia();
      else if (!document.hidden) lenis.start();
      lenis.resize();
    };
    const onMotionChange = () => {
      updateMotionMode();
      cancelInertia();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'Tab') {
        cancelInertia();
        return;
      }
      if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('input, textarea, select, button, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="listbox"], [role="slider"]')) return;
      // Native keyboard scrolling must not compete with a pending wheel tween.
      cancelInertia();
    };
    const onPointerDown = () => {
      // Yield to scrollbar dragging and native touch without preventing input.
      if (lenis.isScrolling) cancelInertia();
    };
    const onAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
        event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute('download') ||
        (link.target && link.target !== '_self')) return;

      const destination = new URL(link.href);
      if (destination.origin !== location.origin || destination.pathname !== location.pathname ||
        destination.search !== location.search || !destination.hash) return;
      let target: HTMLElement | null;
      try { target = document.getElementById(decodeURIComponent(destination.hash.slice(1))); }
      catch { return; }
      if (!target) return;

      event.preventDefault();
      cancelInertia();
      cancelAnimationFrame(restoreFrame);
      if (location.hash !== destination.hash) {
        // Next's patched history API supplies its own router state and URL sync.
        // Passing its private flags back would bypass that patch; keep only
        // custom history data while preserving the framework-owned state.
        const state = { ...history.state };
        delete state.__NA;
        delete state._N;
        delete state.__PRIVATE_NEXTJS_INTERNALS_TREE;
        history.pushState(state, '', destination.href);
      }

      // Move the keyboard starting point immediately, without a native scroll jump.
      // Moving out of the header also dismisses its disclosure menu.
      releaseFocus?.();
      const focusTarget = target.querySelector<HTMLElement>('h1, h2') || target;
      const previousTabIndex = focusTarget.getAttribute('tabindex');
      if (previousTabIndex === null) focusTarget.setAttribute('tabindex', '-1');
      releaseFocus = () => {
        if (previousTabIndex === null) focusTarget.removeAttribute('tabindex');
        focusTarget.removeEventListener('blur', releaseFocusForTarget);
      };
      const releaseFocusForTarget = releaseFocus;
      focusTarget.addEventListener('blur', releaseFocusForTarget, { once: true });
      focusTarget.focus({ preventScroll: true });

      // One deferred navigation callback lets React finish closing/unlocking the
      // menu before Lenis reads the new document dimensions. Not a second loop.
      anchorFrame = requestAnimationFrame(() => {
        lenis.resize();
        lenis.scrollTo(target, {
          duration: 0.65,
          lerp: 0,
          easing: (t) => 1 - (1 - t) ** 3,
          immediate: lenis.prefersReducedMotion || link.classList.contains('skip-link'),
        });
        anchorFrame = 0;
      });
    };

    updateMotionMode();
    cancelInertia();
    // Capture same-page hashes before Next Link prevents its default action.
    document.addEventListener('click', onAnchorClick, true);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('myovio:scroll-lock', onMenuLock);
    window.addEventListener('popstate', synchronizePosition);
    window.addEventListener('hashchange', synchronizePosition);
    document.addEventListener('visibilitychange', synchronizePosition);
    reducedMotion.addEventListener('change', onMotionChange);
    return () => {
      synchronize.current = null;
      cancelAnimationFrame(anchorFrame);
      cancelAnimationFrame(restoreFrame);
      releaseFocus?.();
      document.removeEventListener('click', onAnchorClick, true);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('myovio:scroll-lock', onMenuLock);
      window.removeEventListener('popstate', synchronizePosition);
      window.removeEventListener('hashchange', synchronizePosition);
      document.removeEventListener('visibilitychange', synchronizePosition);
      reducedMotion.removeEventListener('change', onMotionChange);
      lenis.destroy();
      delete root.dataset.lenisSession;
    };
  }, []);

  useEffect(() => {
    synchronize.current?.();
  }, [pathname]);

  return null;
}
