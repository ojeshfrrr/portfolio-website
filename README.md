# OVIO

Independent digital studio portfolio built with Next.js App Router, React, TypeScript, and plain CSS. Most content is rendered by Server Components; only the mobile menu and project-brief composer use client state. Fonts are bundled locally.

## Run locally

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Production: `npm run build`, then `npm start`.

## Checks

```sh
npm run lint
npm run check
npm test
npm run build
```

## Before production

Copy `.env.example` to `.env.local` and provide your real business email and confirmed HTTPS site origin. WhatsApp is optional; use a full international number. These are public details, not secrets. Resend delivery is optional and requires its three server-only settings before enabling the public form flag. Rebuild after changing public variables. No domain is assumed to be registered. Until a valid public origin is set, canonical and absolute social-preview URLs are omitted and the sitemap is empty; robots still allows public pages and excludes `/api/`. Vercel Preview deployments remain noindex even when the production origin is configured. The interactive project planner is intentionally noindex and excluded from the sitemap.

Contact uses the server-side Resend route only when its delivery credentials and the public enable flag are configured. Otherwise it opens a prefilled email draft for the visitor to send, or offers a copyable brief. Clipboard requires localhost or HTTPS; failures give manual-copy instructions. Optional WhatsApp appears only with a valid number. Add verified social URLs in `src/lib/site.ts`. No inquiry-delivery credentials are present in this repository environment, so delivery must be verified after configuration.

Project content and navigation live in `src/lib/site.ts`. Rewatch and Arcus descriptions use their observed public interfaces plus the supplied Arcus AI-coach description. Logged-in workflows, persistence, implementation details, and results have not been independently verified. The homepage, work index, and case studies use genuine captures of the public Rewatch homepage and Arcus dashboard. Case studies offer desktop/mobile switching. Provenance and dimensions are documented in `public/projects/README.md`; refresh these images as products change. `ProjectImage.tsx` uses Next.js responsive image delivery and below-fold lazy loading. The older illustrative `ProjectPreview.tsx` remains available but is no longer rendered. No invented customer results or testimonials are included.

SEO includes route-specific metadata, a generated Open Graph image, favicon, robots, and sitemap. Add a real domain before launch and verify sharing/indexing on that domain. The app is not deployed by this task. No database, authentication, analytics, or external form service is included. Service offers are grouped as landing pages, small-business websites, and custom web applications. Each explains fit, scope, timing dependencies, client inputs, and possible exclusions; rates and fixed turnaround promises are not published. Service CTAs preselect a matching project type in the brief. `ANALYTICS-PLAN.md` records a privacy-conscious event proposal. No provider has been selected or configured, so tracking is inactive.

## Scrolling and interactions

Lenis 1.3.26 is pinned exactly. `src/components/SmoothScroll.tsx` owns one persistent instance in the root layout, with its single automatic RAF loop. Wheel input uses lerp 0.12 and an unchanged multiplier; native touch momentum is preserved with `syncTouch: false`. Next.js/browser routing and restoration remain authoritative: pathname, hash, and history events synchronize Lenis with the actual position instead of forcing a top jump. Deferred synchronization and anchor callbacks are one-shot frames, not additional animation loops. Reduced motion disables wheel smoothing completely and makes anchor navigation immediate; live preference changes cancel outstanding inertia. Hero motion remains controlled independently. The supplied Lenis CSS is loaded; CSS smooth scrolling is disabled consistently. Native anchors remain the no-JS fallback.

Same-page links are handled in capture phase so both native anchors and Next links update the URL/history and move keyboard focus without a native scroll jump. Next's private history flags are supplied by its patched API; custom history data is retained. Modified clicks, downloads, external links, and new-tab navigation retain browser behaviour. Anchor spacing uses the desktop/mobile header-height token, and Lenis reads CSS scroll margins/padding directly, without adding a duplicate offset. Keyboard navigation and pointer interaction cancel pending inertia without preventing native input. Automatic nested-scroll detection, explicit prevent markers, and native select/dialog exceptions preserve independent controls. All listeners and frames are released on unmount. Development-only data-lenis-session on html helps verify persistence without exposing the Lenis object.

The mobile disclosure menu locks background scrolling and stops Lenis while open, restores prior styles and starts Lenis on dismissal/unmount, and releases the lock at desktop sizes. A small DOM event bridges the menu to the scroll component without a provider or global instance. Its bounded scrolling area and the project-brief textarea use `data-lenis-prevent` to retain native nested scrolling. Escape returns focus to the toggle; leaving the header with Tab closes the disclosure without trapping focus.

## Focused presentation polish

Case-study Desktop/Mobile switching uses a stable screenshot stage and original public captures. Switching announces the selected view and uses a brief opacity transition only when motion is permitted. The full-size link opens the actual selected image in a new tab for closer inspection. FAQs remain native details/summary controls. Browsers supporting interpolate-size and ::details-content receive a short opening/closing transition; other browsers and reduced-motion preferences use immediate disclosure. No route-delay animation, library, or second frame loop is added.

Research used publicly readable Godly showcase structure, Transitions.dev disclosure descriptions, and Deck.gallery's 72andSunny deck guide. Animos.app returned no inspectable content. This was page-content research, not visual playback testing. Full access limits and actual browser verification are recorded in VERIFICATION.md.

## Pages and enquiries

The compact homepage links to `/work`, `/services`, `/process`, `/about`, and `/contact`. Work includes dedicated `/work/rewatch` and `/work/arcus` case studies with next-project links. Shared header/footer links use Next.js navigation; the header marks the current page and keeps Work active on case studies. Public routes have route-specific metadata; the configured production sitemap includes the homepage, work index and case studies, Lab, Services, Process, About, and Contact. The interactive planner and not-found page are excluded.

The contact composer validates name, email, project type, and a useful description; budget and desired timeline are optional. It focuses the first invalid field and associates inline errors with fields. A two-step progress indicator leads to a review screen before any copy or email action. Back to edit retains the entered details. The public contact email is configured through `NEXT_PUBLIC_CONTACT_EMAIL`. Until the server-side Resend settings are configured, the reviewed brief opens an email draft; manual copying is also available and the website does not claim a message was sent. When enabled, the server route sends only after the visitor reviews and chooses Send. See `CONTACT-SETUP.md` for the required provider and domain setup.

## Visual system

Palette: charcoal `#101214`, warm surfaces `#292522`, soft ivory `#F0E8DE`, and restrained copper `#D9824B`. Supporting text uses warm gray `#B5AAA0`; hover uses `#EAA374`. Supporting tones and aliases are centralised at the top of `src/app/globals.css`; `src/lib/brand.ts` mirrors non-CSS colours for metadata and WebGL. Form boundaries use `#8A7C70` rather than the decorative border so they remain visible. Space Grotesk and Manrope, the editorial layouts, content, and genuine product captures are preserved. The wordmark punctuation, favicon, generated Open Graph image, browser theme colour, focus feedback, buttons, and forms share this palette.

## Uiverse interaction sources

The primary CTA fill and contact field focus treatment are adapted from two inspected Uiverse components. Complete item notices and adaptation details are preserved in THIRD_PARTY_NOTICES.md. The changes use scoped CSS, existing design tokens, native controls, keyboard focus feedback, and reduced-motion rules. No runtime dependency or scroll-loop change is needed.

## Open-source light-field hero

The homepage uses six original open procedural paths and three illuminated nodes in a dark charcoal field with subtle amber trails. The existing `HeroSculpture.tsx` wrapper and `SculptureCanvas.tsx` renderer are retained to avoid disrupting their loading and lifecycle safeguards. The rejected rings are no longer rendered. Three.js 0.186.1, React Three Fiber 9.8.1, and @types/three 0.186.0 remain unchanged; no dependency was added for this theme pass.

One R3F frame loop continuously deforms the reusable trail vertices and moves their nodes along the same deformed paths. Passive pointer observation across the hero adds a local, smoothly damped bend/ripple, which settles when the pointer leaves; mouse and trackpad use the same pointer events, while touch needs no hover. No React state changes occur per pointer move or frame. Reduced motion defaults to demand rendering; an explicit Play motion control allows a visitor to opt in for the current page. Pause restores a still presentation; hidden tabs and menu locks pause motion, and the canvas unmounts outside the viewport. Geometry, observers, and context listeners are cleaned up. Pixel ratio remains capped at 1.5 on desktop and 1 on mobile/coarse pointers. Thin reusable tubes and small nodes require no light maps, shadow maps, external assets, or paid service. Native vertical touch scrolling is preserved.

`public/ovio-amber-light-field.webp` is a capture of the actual warm local field (source: `verification/amber-light-field-render.png`). It stays visible during loading or WebGL failure; the editable SVG composition uses matching warm colours. Older blue field and sculpture captures are retained as historical assets and are not displayed. Development-only canvas attributes expose frame/time, a deformed point, pointer strength/target and mean update cost at most twice per simulation second. Production excludes this diagnostic branch. The stage keeps its existing mobile/desktop dimensions, accessible description, and separation from the headline/CTA.

## Separate Unicorn Studio draft

An authenticated connection created **MYOVIO — Slate Light Field** as a separate scene, preserving both earlier scenes. The original analytic effect compiled successfully and was inspected through desktop motion samples and a portrait preview. Portrait node travel was refined to keep highlights visible. It is saved as an unpublished draft, not embedded in the website. Review: https://www.unicorn.studio/edit/NdZlFlLdSs22LayKyvZ8?canvasId=2e85f8da-7acf-40ae-854a-42a1b0165c95

Approve the draft before publishing or replacing any external scene. After approval, publish that scene in Unicorn Studio and obtain its real project/embed identifier or export; integration is a separate step. No scene URL was fabricated and the current website runs its local open-source field.
