'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAnimate } from 'motion/react-mini';

// Effects run only in the browser; this tracks the first real route visit.
let initialRouteVisited = false;

export default function RouteMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [scope, animate] = useAnimate<HTMLDivElement>();

  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    let active = true;
    const firstVisit = !initialRouteVisited;
    // A cancelled Strict Mode setup must not consume the first real entrance.
    queueMicrotask(() => { if (active) initialRouteVisited = true; });
    const hero = root.querySelector<HTMLElement>('.hero');
    if (!hero || !firstVisit) return () => { active = false; };

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const controls: ReturnType<typeof animate>[] = [];
    const finish = () => controls.forEach(control => control.cancel());
    if (!preference.matches && hero.getBoundingClientRect().bottom > 0) {
      // Keep the existing direct-load hero entrance. Route returns use the
      // shared heading crossfade, preventing competing entrances.
      const ease: [number, number, number, number] = [0.22, 0.72, 0.28, 1];
      const reveal = (element: Element | null, delay: number, duration: number, headline = false) => {
        if (!element) return;
        controls.push(animate(element, headline ? {
          clipPath: ['inset(100% 0 0 0)', 'inset(-12% -2% -12% -2%)'],
          transform: ['translateY(0.18em)', 'translateY(0em)'],
        } : {
          opacity: [element.matches('.hero-actions > a') ? 0.55 : 0.15, 1],
          transform: ['translateY(6px)', 'translateY(0px)'],
        }, { delay, duration, ease }));
      };
      reveal(hero.querySelector('.hero-kicker'), 0, 0.28);
      hero.querySelectorAll('.hero-line').forEach((line, index) => reveal(line, 0.14 + index * 0.12, 0.54, true));
      reveal(hero.querySelector('.hero-description'), 0.7, 0.34);
      hero.querySelectorAll('.hero-actions > a').forEach((link, index) => reveal(link, 0.88 + index * 0.08, 0.32));
    }
    const updatePreference = () => { if (preference.matches) finish(); };
    preference.addEventListener('change', updatePreference);
    hero.addEventListener('focusin', finish);
    hero.addEventListener('pointerdown', finish, { passive: true });
    return () => {
      active = false;
      finish();
      preference.removeEventListener('change', updatePreference);
      hero.removeEventListener('focusin', finish);
      hero.removeEventListener('pointerdown', finish);
    };
  }, [pathname, scope, animate]);

  return <div ref={scope}>{children}</div>;
}
