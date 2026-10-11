# Phase 2 case-study evidence and maintenance

Scope: `/work`, `/work/rewatch`, `/work/arcus`. No added packages.

## Evidence
- Rewatch public homepage and Explore navigation were inspected in the browser. Diary, reviews, ratings and episode tracking are product-described capabilities, not verified signed-in flows. Rewatch source was unavailable during inspection. Its developer subsequently supplied the published technology stack: Next.js, React, TypeScript, REST API, workers, Zod, PostgreSQL, S3 bucket storage, Fastify monolith, HTTP session cookies, MusicBrainz, IMDb, Animefy, Nodemailer, and Portways hosting. These details are developer-provided, not independently source-inspected.
- Arcus public community feed and training dashboard were inspected. Local `D:/projects/arcus-repo` source confirms Next.js, React, TypeScript, IndexedDB workout storage, validated active-draft recovery and a shared Portways PostgreSQL pool. The deployed revision, signed-in workflows and live sync were not verified.
- Screenshots reuse the genuine captures documented in `public/projects/README.md`. Detail views are explicitly identified as crops. The Arcus capture predates the current live dashboard.

## Editing
- Case-study prose and evidence notes: `src/components/CaseStudy.tsx`.
- Interactive screenshot stories: `src/components/ProjectStory.tsx`.
- Scoped composition and responsive styles: `src/app/work/work.css`.
- Existing gallery/device controls are preserved; no new device-preview system was added.
- Image selection uses native buttons with pressed state. Full-size images open in a separate tab using normal links. Implementation disclosures use native details/summary.
- The brief opacity transition is enabled only for no-preference motion; no per-frame JavaScript or new scroll listeners were added.

## Verification
Lint and TypeScript passed; all 24 existing tests passed. Production build passed after retrying outside the filesystem sandbox.
Browser checks covered desktop (1440px), tablet (768px), and 360/390/430px mobile viewports across the focused routes, feature selection, Enter activation, section anchors, technical disclosure and project navigation including Back/Forward. No horizontal overflow was observed; the captured console was empty of warnings/errors. An overflowing Arcus crop was found and corrected during visual review.
Reduced-motion CSS was inspected, but preference emulation and physical touch/trackpad testing were unavailable. No browser performance trace or audio listening test was performed. Global background, audio and Lenis files were not modified.

Arcus stack update (developer-provided): Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, Portways-hosted PostgreSQL via WebSocket connections, Supabase migrations/tooling, S3-compatible profile photo storage, IndexedDB, service workers, Web Audio and Media Session APIs, and Framer Motion. Added to the technology summary and implementation notes; this update does not assert independent testing of offline, audio or account-sync workflows.

Rewatch credit correction: built collaboratively by OVIO and Suvo (Gaurav Raj Singh), with both contributing across all areas, as confirmed by the owner. The Rewatch role and Work label reflect collaboration. Suvo links: https://github.com/gauravxsuvo and https://www.mysuvo.com/ . Arcus remains independently developed.
