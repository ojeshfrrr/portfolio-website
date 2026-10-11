# OVIO component motion

Uses the installed Motion 14.1.0 library: DOM animation sequences, React shared-layout spring markers, presence, nested variants, and native CSS transitions. No dependency was added. The existing hero timeline, heading-only 220ms React ViewTransition, background renderer, audio controller, and Lenis remain separate.

## Coverage

| Route / group | Treatment |
| --- | --- |
| Home | Existing cinematic hero preserved; featured screenshot masks, coordinated captions, display-heading clipping, service and CTA entrances |
| Work | Genuine preview masks, restrained pointer perspective, category / caption / tag sequencing, directional links |
| Rewatch | Left-to-right screenshot masks, metadata choreography, spring story selector and device controls, genuine keyed screenshot transitions, native implementation disclosure |
| Arcus | Mirrored screenshot masks in its existing alternate composition, shared device controls, training-story state transitions and technical disclosure |
| Services | Offer heading / label sequence, independently observed deliverable paragraphs, scoped CTA feedback, native FAQ expansion |
| Process | Stage heading and number sequence, once-drawn amber rule, independent detail entrances |
| About | Typographic mark mask, clipped headings, readable paragraph and principle sequences |
| Contact | Fields and progress entry, native focus / invalid styling, brief-review choreography, real sending indicator and accepted-state accent, status / error feedback |
| Start | Native selection-card feedback, shared-layout progress line, keyed step choreography, recap updates, validation and copy status, review and reset confirmation |
| Shared header / footer | Wordmark feedback, active/hover drawn rules, directional arrows, CTA highlight and press feedback, footer sequence |
| Mobile menu | Presence-managed entry and exit, staggered links, preserved hamburger, Escape/focus/scroll-lock logic; exiting links become inert immediately |
| Audio / motion controls | Press and state feedback; no change to playback, consent, mute, fade, or background behavior |

## Safeguards

- All server content is visible without JavaScript. Viewport observers start short entrances only when their groups enter view; ordinary content stays still afterward.
- No new application RAF loop, scroll driver, canvas, or per-frame React state. Pointer bounds are cached at entry and discarded on scrolling/resizing.
- One intersection observer and one child/text mutation observer per route lifetime. Completed, removed, interrupted, and unmounted animations release their styles/resources. Observers ignore animation style writes.
- Dynamic state feedback cancels an overlapping parent entrance. Focus or pointer activation restores a group's baseline immediately.
- Reduced motion suppresses new choreography, removes CSS movement, and uses immediate layout/menu transitions. A changed preference cancels active DOM animations.
- The mobile menu overlays the content rather than shifting it. Exiting links are inert and hidden from accessibility; existing scroll locking releases on close. Keyboard focus exposes menu content immediately.
- Native disclosures animate intrinsic block size only in supporting browsers; all others retain native instant expansion. No measured-height loop.
- Screenshots retain dimensions and genuine content. Preview stages continue reserving their space; tilt is limited to under one degree on fine-pointer devices.

## Verification and limits

Automated checks cover business validation, contact provider failures/idempotency with mocks, planner data/handoff, Lenis input and cleanup, light-field calculations, heading server rendering, and new component-motion lifecycle tests. The lifecycle tests use controlled event/observer doubles; they are not a browser rendering or performance measurement.

Final results: `npm run lint` passed with no warnings; `npm run check` passed; `npm test` passed all 38 tests; `npm run build` compiled, type-checked, and generated all routes successfully. The build required host filesystem access after sandboxed Turbopack path resolution returned access denied. No credentials or configuration were changed. No real enquiry was sent during this motion task.

Local browser access was rejected by the browser tool's URL security policy. No alternative browser or protocol was used to bypass that restriction. Desktop/mobile appearance, Web Animation playback, shared-layout interpolation, native disclosure support, audio, history, and scrolling with all effects active still require manual browser verification.

Run `npm run dev`, then visit http://127.0.0.1:3000. Check all nine routes at desktop and 360/390/430px widths, with reduced motion both enabled and disabled. Check menu keyboard/Escape/touch behavior, rapid screenshot switching, planner Back/Continue/review/reset/copy and Contact handoff, validation and recovery, audio consent/mute, and browser back/forward. Use mocked provider responses for failure/success UI checks unless intentionally sending a real email. Record a performance trace while scrolling before making performance claims.

## Files changed

- `src/lib/motion-system.ts`, `src/lib/useMotionPreference.ts`: shared timing, recipes, target inventory, and a hydration-safe live preference subscription.
- `src/components/SiteMotion.tsx`, `src/components/SelectionMark.tsx`: observer-driven choreography and spring layout indicator.
- `src/app/layout.tsx`, `src/app/signature-motion.css`: register shared motion and feedback styles.
- `src/components/Header.tsx`: native-link menu presence, stagger, and inert exit state.
- `src/components/DevicePreview.tsx`, `src/components/ProjectStory.tsx`, `src/components/ProjectPlanner.tsx`: reuse the shared marker without changing data or navigation logic.
- `src/components/Contact.tsx`: expose truthful busy/delivery states to accessibility and styling.
- `src/components/device-preview.css`, `src/app/start/planner.css`, `src/app/work/work.css`, `src/app/interactions.css`: remove old competing entry animations and duplicate selection backgrounds.
- `tests/site-motion.test.mjs`, `MOTION-VERIFICATION.md`: lifecycle/preference verification and coverage/manual testing record.
