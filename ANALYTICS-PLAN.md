# Conversion analytics plan

No analytics provider, project key, or account is configured, so analytics are not active and no tracking package or script has been added.

The smallest useful setup after choosing a provider is one shared, provider-specific adapter with an allow-list of events:

- `start_project_click` — primary project CTA, with a short placement value such as `header`, `service_offer`, or `page_cta`.
- `work_project_click` — a Rewatch or Arcus case-study link, with only the public project ID.
- `page_view` — use the provider's normal page view for `/contact`; strip query parameters such as the preselected service.
- `enquiry_sent` — fire only after the configured delivery endpoint returns success. Opening an email draft or copying a brief is not a sent enquiry.

Never send names, email addresses, descriptions, budgets, timelines, or form field values to analytics. Before implementation, choose the hosting/provider account and confirm the applicable privacy, retention, and consent requirements. Keep the key server-side if the selected provider requires a secret; only a documented public site ID may be client-side.
