'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { animate, type AnimationSequence } from 'motion';
import { contentTargets, entranceFor, entranceGroups, imageTargets, motionTiming } from '../lib/motion-system';

/** Component choreography only. No scroll driver, frame loop, or hidden SSR content. */
export default function SiteMotion() {
  const pathname = usePathname();
  const seen = useRef(new WeakSet<Element>());
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.site-shell-content');
    if (!root || !('IntersectionObserver' in window)) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const animations = new Map<Element, ReturnType<typeof animate>>();
    const stop = (element: Element) => { animations.get(element)?.cancel(); animations.delete(element); };
    const stopAll = () => { for (const element of animations.keys()) stop(element); };
    const play = (group: Element, sequence: AnimationSequence) => {
      if (!sequence.length || preference.matches || document.hidden ||
        (document.activeElement && group.contains(document.activeElement))) return;
      // State changes may interrupt a parent entrance; never animate the same
      // subtree twice (for example, a restored planner recap then an updated dd).
      for (const running of animations.keys()) {
        if (running.contains(group) || group.contains(running)) stop(running);
      }
      const control = animate(sequence, { defaultTransition: { duration: motionTiming.content, ease: motionTiming.ease } });
      animations.set(group, control);
      void control.then(() => { if (animations.get(group) === control) stop(group); });
    };
    const enter = (group: HTMLElement) => {
      seen.current.add(group);
      group.dataset.motionEntered = 'true';
      const candidates = [group, ...group.querySelectorAll<HTMLElement>(`${contentTargets}, ${imageTargets}`)];
      const targets = candidates.filter(element => {
        if (element.closest('.verification-disclosure')) return false;
        if (element.closest('.hero') || element.matches('h1') || element.closest('[hidden]')) return false;
        if (!element.getClientRects().length) return false;
        if (element === group && element.matches('li')) return false;
        if (element !== group && element.closest(entranceGroups) !== group) return false;
        // Animate a caption or screenshot as a unit, never its nested text twice.
        const parentUnit = element.parentElement?.closest(`${imageTargets}, .featured-caption, .case-metadata > div, .form-field, .planner-choice, .visual-caption, li`);
        return !parentUnit || parentUnit === group;
      }).filter(element => element.matches(`${contentTargets}, ${imageTargets}`));
      const sequence: AnimationSequence = targets.map((element, index) => {
        const kind = element.matches(imageTargets) ? 'image' : element.matches('h2,h3') ? 'heading' : element.matches('.section-label,.step-number,.project-category,dt,legend,.service-offer-heading > span') ? 'label' : 'content';
        return [element, entranceFor(kind, Boolean(group.closest('.case-arcus, .project-arcus'))), {
          at: Math.min(index * motionTiming.stagger, 0.16),
          duration: kind === 'image' ? motionTiming.image : kind === 'heading' ? motionTiming.display : motionTiming.content,
        }];
      });
      // An image switching modes is itself the reveal target.
      play(group, sequence);
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !seen.current.has(entry.target)) { observer.unobserve(entry.target); enter(entry.target as HTMLElement); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    const register = (node: Element) => {
      const groups = [...node.querySelectorAll<HTMLElement>(entranceGroups)];
      if (node.matches(entranceGroups)) groups.unshift(node as HTMLElement);
      groups.forEach(group => { if (!seen.current.has(group) && !group.closest('[hidden]')) observer.observe(group); });
    };
    register(root);
    const stateTargets = '.contact-status, .form-error, .planner-recap dd, .planner-recap h2, .planner-step-count, .planner-panel > h2';
    const mutations = new MutationObserver(records => {
      const changed = new Set<HTMLElement>();
      records.forEach(record => {
        record.removedNodes.forEach(node => {
          if (!(node instanceof Element)) return;
          observer.unobserve(node);
          node.querySelectorAll(entranceGroups).forEach(element => observer.unobserve(element));
          for (const running of animations.keys()) if (node.contains(running)) stop(running);
        });
        record.addedNodes.forEach(node => {
          if (node instanceof Element) {
            register(node);
            if (node.matches(stateTargets)) changed.add(node as HTMLElement);
          }
        });
        const element = record.target instanceof Element ? record.target : record.target.parentElement;
        const state = element?.closest<HTMLElement>(stateTargets);
        if (state) changed.add(state);
      });
      changed.forEach(element => {
        if (!element.textContent?.trim() || element.closest('[hidden]')) return;
        const bounds = element.getBoundingClientRect();
        if (bounds.bottom <= 0 || bounds.top >= innerHeight) return;
        play(element, [[element, { opacity: [0.45, 1], transform: ['translateY(3px)', 'translateY(0px)'] }, { duration: motionTiming.feedback }]]);
      });
    });
    // Child/text changes only: animation style writes never feed this observer.
    mutations.observe(root, { childList: true, characterData: true, subtree: true });

    let pointerTarget: HTMLElement | null = null;
    let pointerBounds: DOMRect | null = null;
    const resetPointer = () => {
      pointerTarget?.style.removeProperty('--pointer-x');
      pointerTarget?.style.removeProperty('--pointer-y');
      pointerTarget = null; pointerBounds = null;
    };
    const pointerOver = (event: PointerEvent) => {
      if (preference.matches || !finePointer.matches || event.pointerType !== 'mouse') return;
      const target = (event.target as Element).closest<HTMLElement>(`.button.primary, ${imageTargets}`);
      if (target === pointerTarget) return;
      resetPointer();
      if (target && !target.matches('.about-mark') && !target.closest('.hero-actions')) {
        pointerTarget = target; pointerBounds = target.getBoundingClientRect();
      }
    };
    const pointerMove = (event: PointerEvent) => {
      if (!pointerTarget || !pointerBounds) return;
      // Cached on entry; no layout reads or React updates on pointer movement.
      const x = Math.max(-1, Math.min(1, (event.clientX - pointerBounds.left) / pointerBounds.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - pointerBounds.top) / pointerBounds.height * 2 - 1));
      pointerTarget.style.setProperty('--pointer-x', String(x));
      pointerTarget.style.setProperty('--pointer-y', String(y));
    };
    const pointerOut = (event: PointerEvent) => { if (!(event.relatedTarget instanceof Node) || !pointerTarget?.contains(event.relatedTarget)) resetPointer(); };
    const finishFocused = (event: Event) => {
      const target = event.target as Element;
      for (const group of animations.keys()) if (group.contains(target)) stop(group);
    };
    const changePreference = () => { if (preference.matches) { stopAll(); resetPointer(); } };
    const visibility = () => { if (document.hidden) { stopAll(); resetPointer(); } };
    root.addEventListener('pointerover', pointerOver, { passive: true });
    root.addEventListener('pointermove', pointerMove, { passive: true });
    root.addEventListener('pointerout', pointerOut, { passive: true });
    root.addEventListener('focusin', finishFocused);
    root.addEventListener('pointerdown', finishFocused, { passive: true });
    window.addEventListener('scroll', resetPointer, { passive: true });
    window.addEventListener('resize', resetPointer, { passive: true });
    preference.addEventListener('change', changePreference);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      observer.disconnect(); mutations.disconnect(); stopAll(); resetPointer();
      root.removeEventListener('pointerover', pointerOver); root.removeEventListener('pointermove', pointerMove);
      root.removeEventListener('pointerout', pointerOut); root.removeEventListener('focusin', finishFocused);
      root.removeEventListener('pointerdown', finishFocused);
      window.removeEventListener('scroll', resetPointer); window.removeEventListener('resize', resetPointer);
      preference.removeEventListener('change', changePreference); document.removeEventListener('visibilitychange', visibility);
    };
  }, [pathname]);
  return null;
}
