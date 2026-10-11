# Project planner — Phase 1

Open `/start`. The homepage hero's Start a project link opens it; other CTA destinations remain unchanged.

The planner creates a deterministic brief from five steps. No AI, estimate, external request, or enquiry delivery happens here. Requirements, INR budget ranges, and desired timing are preferences for scoping.

Drafts use `sessionStorage` keys `ovio:planner:v1` and `ovio:planner-brief:v1`. Versioned drafts are validated on restoration. They survive refresh within the current browser tab. Restart clears the saved brief and resets the saved draft, after explicit confirmation.

Continue to contact saves the generated brief and navigates to `/contact` without putting the brief in a URL. The Contact page displays a reference panel with a selectable brief and a return link. It does not populate or submit the existing contact form: field mapping and final delivery integration remain Phase 3 work. Existing enquiry options remain intact.

If storage is blocked, a client-only in-memory fallback survives App Router navigation. A warning explains that refresh may lose the draft. Copy project brief uses the Clipboard API and reports success only after it resolves; a selectable read-only textarea is available if clipboard permission is denied.

Options, validation, and formatting live in `src/lib/planner.mjs`; storage is in `src/lib/planner-storage.ts`; presentation is in `ProjectPlanner.tsx` and `src/app/start/planner.css`. No provider credentials are needed for this phase.

Run locally: `npm run dev`. Checks: `npm run lint`, `npm run check`, `npm test`, `npm run build`.

## Files added or changed

- `src/app/start/page.tsx`, `src/app/start/planner.css`
- `src/components/ProjectPlanner.tsx`, `src/components/PlannerHandoff.tsx`
- `src/lib/planner.mjs`, `src/lib/planner.d.mts`, `src/lib/planner-storage.ts`
- `src/app/page.tsx`, `src/app/contact/page.tsx`, `src/app/pages.css`, `src/lib/site.ts`
- `tests/planner.test.mjs`, `tests/planner-storage.test.mjs`
- `PROJECT-PLANNER.md`
