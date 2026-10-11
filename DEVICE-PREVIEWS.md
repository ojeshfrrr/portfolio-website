# Case-study device previews

`src/components/DevicePreview.tsx` renders a single genuine screenshot for the selected device. `ProjectGallery.tsx` supplies each project's captures. The existing Work cards and interface-story views are unchanged.

## Assets and provenance

- Both existing desktop captures: 1425 × 891 WebP, October 10, 2026.
- Both existing mobile captures: 375 × 812 WebP, October 10, 2026.
- New tablet captures: taken in the connected browser at a 768 × 1024 CSS viewport, October 12, 2026. The browser exported 753 × 1004 JPEGs; removing only the right-hand scrollbar strip produced 738 × 1004 WebPs. No application content was reconstructed or stretched.
- Rewatch tablet: `https://rewatch.cc/`, public homepage in its current light theme.
- Arcus tablet: `https://thearcus.vercel.app/dashboard`, current public training dashboard. The newer dashboard differs from the original desktop/mobile captures; the UI captions distinguish the dates and revision.

Replace a capture by updating its path, actual pixel dimensions, alternative text, and date in `ProjectGallery.tsx`. Keep original aspect ratios. Do not reuse a desktop capture as a substitute for another device.

## Why screenshots

On October 12, Rewatch returned `X-Frame-Options: DENY`. Arcus returned no X-Frame-Options or CSP header, but its public community feed showed a loading failure during inspection. A reliable interactive embed was not verified. Screenshots provide a consistent low-cost presentation without adding another application runtime alongside OVIO's background animation.

## Interaction and manual verification

The stage reserves the same height for all modes at each breakpoint. Buttons use native keyboard behavior and `aria-pressed`, with visible focus. Switching uses a short opacity transition only when reduced motion is not requested. Images load through Next Image; loading failures display an honest message and retain the original-image link.

Local browser automation was rejected by the browser security policy. Before release, inspect both case studies at 360, 390, 430, 768, and desktop widths. Switch all modes repeatedly, activate the buttons with Space/Enter, follow full-size links, enable reduced motion, and scroll with the background running. Check for image-request errors and unexpected scroll movement. Compilation and asset checks do not replace these visual checks.
