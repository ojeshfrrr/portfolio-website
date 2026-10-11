# Phase 3 inquiry setup

Official recipient: **workwithovio@gmail.com**. Contact and footer expose a normal mailto link. Contact includes a copy-email control with honest clipboard failure feedback.

## Planner handoff and drafts
Continue to contact stores a validated, versioned snapshot in sessionStorage, not in a URL. Contact transfers the exact project type, business name, industry, description, goal, selected features, budget and desired timeline. The generated planner brief is editable and included in the complete enquiry review.

Contact edits are saved separately for this tab. A newer planner handoff updates project answers while retaining entered name/email. Back/Forward and reload restore edits. Handoffs and contact drafts expire after 24 hours; invalid or unavailable storage falls back safely to an empty form or in-memory data. In-memory fallback survives App Router navigation, but not a full reload. Successful provider acceptance clears saved drafts. Returning to the planner is available from the imported-brief notice.

## Existing Resend integration (no SDK dependency)
The server sends plain-text email using the official Resend HTTP API: https://resend.com/docs/api-reference/emails/send-email

Required environment variables:

```dotenv
NEXT_PUBLIC_CONTACT_EMAIL=workwithovio@gmail.com
NEXT_PUBLIC_CONTACT_FORM_ENABLED=false
CONTACT_TO_EMAIL=workwithovio@gmail.com
RESEND_API_KEY=
CONTACT_FROM_EMAIL=
```

1. In Resend, add and verify a sending domain you control.
2. Set CONTACT_FROM_EMAIL to a sender on that verified domain, optionally formatted as `OVIO <address@verified-domain>`.
3. Set a server-only RESEND_API_KEY with email-sending permission. Never prefix this secret with NEXT_PUBLIC_, commit it, or paste it into client code.
4. Keep CONTACT_TO_EMAIL set to the official Gmail inbox above; the endpoint rejects a different destination.
5. Set NEXT_PUBLIC_CONTACT_FORM_ENABLED=true after configuring the sender and key. Restart `npm run dev` or redeploy so public variables are rebuilt.
6. Send one controlled test enquiry. Check Resend's delivery event and the actual Gmail inbox (including spam). Provider acceptance is not proof of inbox receipt. No response-time promise is configured.

The current local environment has neither a Resend key nor sender. Email drafts and manual copy remain functional fallbacks. No real delivery has been verified.

## Validation and delivery behavior
Server checks origin, JSON content type, streamed body size (32KB), field types, field lengths, allowed project types/goals/features and the actual honeypot. Required fields are name, email, project type and description; additional answers are optional. Email is plain text so submitted content cannot become executable HTML. No enquiry database or input logs are added.

The client prevents concurrent submissions and preserves answers on failure. Retries of the same reviewed payload reuse a Resend idempotency key; changing the payload creates a new key. Success requires a successful provider response with a message identifier. Timeout feedback says delivery could not be confirmed, rather than claiming nothing was sent. The attempt identifier is stored with the session draft so unchanged retries can reuse it after route navigation or reload. Provider idempotency retention is limited; check the inbox before retrying an old uncertain delivery.

A bounded, hashed-IP in-memory rate limiter permits five validated attempts per ten minutes per application instance. This is a basic backstop, not distributed abuse protection. Configure a trusted edge/WAF rule on `/api/contact` for production (especially multiple instances/serverless). Ensure forwarded IP headers are set/overwritten by the trusted hosting proxy. Do not expose the server directly with untrusted forwarding headers.

## Verification
Automated tests cover invalid origin, malformed JSON, oversized streamed input, honeypot, invalid selections/email, missing provider, provider rejection/timeout, mocked acceptance, reply-to and recipient, idempotency, rate-limit expiry, valid handoff, retained edits and expired storage. Mocked acceptance does not prove email delivery.

Browser access was rejected by the browser tool's URL security policy during this task. Desktop/mobile visual review, real planner-to-contact clicks, clipboard permissions, browser navigation, duplicate-click behavior and submitting/success UI remain manual checks. No browser test or inbox receipt is claimed.

Final checks: `npm run lint` passed, `npm run check` passed, all 31 tests passed, and the final `npm run build` passed including its TypeScript check. HTTP checks returned 200 for `/start` and `/contact`, and the expected 503 for a valid enquiry with no email credentials. An initial 403 exposed an internal-host mismatch; this was fixed and covered by a regression test.

Changed files:
- `src/components/Contact.tsx`
- `src/components/PlannerHandoff.tsx`
- `src/app/contact/page.tsx`
- `src/app/api/contact/route.ts`
- `src/app/pages.css`
- `src/lib/brief.mjs`
- `src/lib/brief.d.mts`
- `src/lib/planner-storage.ts`
- `src/lib/inquiry-storage.ts`
- `src/lib/contact-handler.mjs`
- `src/lib/contact-handler.d.mts`
- `src/lib/site.ts`
- `tests/inquiry.test.mjs`
- `CONTACT-SETUP.md`

Run locally: `npm run dev`, then open http://127.0.0.1:3000/start .
