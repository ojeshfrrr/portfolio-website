# Heading transition verification

## Audit: October 12, 2026

Installed React and React DOM are both 19.3.0; Next.js is 16.4.0 and Motion is 14.1.0. The bundled Next.js view-transition guide documents React 19.3 support without extra configuration. The installed React DOM implementation supports shared-name pairing and restores transition names after completion.

`PageHeading` keys its boundary by pathname so nested case-study navigation also replaces the boundary. Each normal page mounts one heading with the shared name `ovio-heading`. Synchronous state changes have `update="none"`; query-only or hash-only navigation does not change the key. No clicks or routing events are intercepted by this component.

Only the heading is named. The root has `view-transition-name: none`, and the background remains a sibling outside the route template. The transition does not add a canvas or requestAnimationFrame loop. The 220ms old/new opacity animations run together, with no delay, movement, or group-size animation. Reduced motion sets the animation duration to zero. Heading markup has no hidden or transparent baseline styles.

The original homepage Motion entrance runs only on the initial homepage visit. Other initial routes consume the initial-visit marker, preventing the hero entrance from competing with heading transitions when navigating home. Cancelled Strict Mode effects do not consume the marker. Media-query listeners and Motion controls are cleaned up.

Contact inputs already persist through inquiry storage; planner drafts and handoff already use their own storage. Header pathname changes unmount the menu content and run its scroll-lock cleanup. This audit did not change those implementations.

## Verification limits

No local Playwright, Puppeteer, or browser-test configuration is installed. The browser tool rejected localhost access under its security policy. A terminal browser would target the same blocked resource, so it was not used as a workaround. No browser navigation sequence, screenshot, video, hydration test, or performance trace was recorded for this audit.

`tests/heading.test.mjs` renders the actual component through React DOM's server renderer, including all nine route pathname contexts and absent browser APIs. It checks one readable h1, preserved labels/IDs/children, and no hidden baseline styling. These tests do **not** establish that the native transition runs or looks smooth. Existing tests cover planner storage, inquiry handling, and Lenis behavior in their test environments.

## Manual checks before claiming visual completion

1. Start with `npm run dev`. Open `http://127.0.0.1:3000/` directly. Confirm the initial hero entrance completes and buttons remain available.
2. Navigate Home → Work → Rewatch → Arcus → Services → Contact → Start. Watch at normal speed: headings should crossfade briefly without page movement, blank frames, flashes, or lingering duplicate text. Content controls should respond immediately. Navigate home again; the long hero entrance should not replay.
3. Use browser Back/Forward several times, refresh `/work/rewatch`, and open a case-study link in a new tab. Confirm correct routes and readable headings. Try same-page anchors and compare their destinations with the header position.
4. Navigate rapidly through header links. Confirm each final destination has one fully visible heading and no stuck overlay. Check the console for transition-name or hydration errors.
5. At 360px, 390px, and 430px, open the mobile menu, navigate, then scroll. Confirm the menu closes and scroll locking releases. Repeat at a desktop width.
6. Enable reduced motion and repeat navigation, including while a transition is running. Content must stay readable and ordinary navigation must work. In a browser without View Transition support, confirm immediate normal page changes.
7. Type unsent Contact answers, navigate away and back, and confirm restoration. Create a planner draft, navigate away and back, then use its Contact handoff. Verify the restored answers. No test email is needed.
8. Start music intentionally, navigate through routes, and confirm the existing audio state and motion controls behave as before. Watch the red background for restart or freeze while navigating. Scroll with it running; record a Performance trace if stutter appears. Check small wheel inputs, direction reversals, and native phone touch behavior separately.

Acceptance still requires these browser observations. Passing server-rendering tests, lint, TypeScript, and a build does not prove animation smoothness or browser history behavior.
