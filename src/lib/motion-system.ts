// Shared choreography; route h1s and the hero have their own protected timelines.
export const motionTiming = {
  feedback: 0.18,
  content: 0.32,
  display: 0.46,
  image: 0.5,
  stagger: 0.035,
  ease: [0.22, 0.72, 0.28, 1] as [number, number, number, number],
  spring: { type: 'spring' as const, duration: 0.26, bounce: 0.08 },
};

export const entranceGroups = [
  '.home-intro', '.home-work', '.featured-grid article', '.home-services', '.route-cta', '.page-intro',
  '.portfolio-list .project', '.case-intro', '.case-preview', '.case-purpose',
  '.story-heading', '.case-features article', '.case-features > h2',
  '.case-notes > div', '.case-notes > aside', '.next-project',
  '.service-offers article', '.service-offers dl > dd', '.scope-note', '.faq-section > div:first-child', '.faq-list details',
  '.editorial-process li', '.process-detail > p', '.process-principles', '.process-ending',
  '.about-route', '.principles article', '.contact-copy', '.contact-guide',
  '.planner-intro', '.planner-recap', '.planner-panel > h2', '.footer-top', '.footer-bottom',
  '.contact-compose', '.brief-progress', '.story-controls',
  '.planner-step', '.brief-review', '.story-panel > div', '.device-preview-frame', '.planner-reset',
].join(',');

export const imageTargets = '.featured-preview, .project-preview-link, .story-image, .device-preview-frame, .about-mark';
export const contentTargets = [
  'h2', 'h3', '.section-label', '.step-number', '.project-category',
  '.service-offer-heading > span', '.case-metadata > div',
  'p', 'figcaption', '.visual-caption', '.featured-caption',
  'dt', 'dd', 'li', 'summary', '.text-link', '.button', 'legend', '.planner-choice', '.form-field',
  '.story-controls button', '.footer nav a', '.footer-bottom > span', '.footer-bottom a', '.footer .wordmark',
].join(',');

export function entranceFor(kind: 'image' | 'heading' | 'label' | 'content', reverse = false) {
  if (kind === 'image') return { clipPath: [reverse ? 'inset(0 0 0 12%)' : 'inset(0 12% 0 0)', 'inset(0 0 0 0)'], opacity: [0.65, 1] };
  if (kind === 'heading') return { clipPath: ['inset(0 0 90% 0)', 'inset(-8% -2% -8% -2%)'], transform: ['translateY(8px)', 'translateY(0px)'] };
  if (kind === 'label') return { opacity: [0.35, 1], transform: ['translateX(-6px)', 'translateX(0px)'] };
  return { opacity: [0.45, 1] };
}
