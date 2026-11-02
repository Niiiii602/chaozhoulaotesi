# Website domain migration

Migration date: 2026-11-02 (Asia/Shanghai).
Production version: 97c86f1c-ef60-447b-a8c5-371180140595.

## Production configuration

- Canonical website: https://maylendy.com
- Canonical analytics dashboard: https://maylendy.com/analytics
- Cloudflare Worker: chaozhoulaotesi (existing service, not a new copy).
- maylendy.com and www.maylendy.com are configured as Worker custom domains.
- Keep laotes.com and www.laotes.com bound to the same Worker.
- Public GET/HEAD requests on legacy hosts permanently redirect to the new
  canonical host, preserving paths and query strings.
- www and HTTP page aliases converge on HTTPS maylendy.com.
- Legacy /r/ and /o/ mail tracking links remain directly handled, using the
  original OUTREACH_KV. Click destinations now use the new homepage.
- API requests are not redirected. This preserves POST bodies and existing
  authenticated monitoring clients on the old host.

## Enquiries and mailboxes

- The homepage and Contact forms use the relative action /api/quote.
  On the new website the submission address is https://maylendy.com/api/quote.
- Enquiry notifications identify their website source as maylendy.com.
- The verified recipient remains nichole@laotes.com, and the authenticated
  sender remains website@laotes.com. Their Zoho configuration is unchanged.
- Visible contact email links and Organization.email intentionally retain the
  working mailbox. A website domain change does not create new mailboxes.
- Do not replace email addresses with unverified maylendy.com addresses.
  Migrate mailboxes separately only after mailbox provisioning, MX, SPF, DKIM,
  DMARC, provider sender verification, and inbound/outbound delivery tests.
- Marketing keyword filtering, attachment limits, rate limiting, and provider
  fallback remain enabled.

## Analytics continuity

- /api/visit and /api/analytics are same-origin on the new site.
- The original OUTREACH_KV namespace and admin secret are retained.
- Existing data remains available within the existing 14-day retention.
- Browser storage is origin-specific: the new dashboard requires the same
  admin key to be entered again; anonymous browser session IDs start anew.
- The dashboard is not included in the public sitemap and retains noindex.

## Validation and publication

- All 88 Node regression tests pass, including new/legacy domain migration cases.

- Verified live: 8 pages, 164 referenced assets, and 3 cross-host redirects.
- Verified live: 16 desktop/mobile rendering checks, no broken visible images,
  old website links, JavaScript errors, or horizontal overflow.
- Verified live: the unchanged admin key reads the same analytics report on
  both hosts; legacy click links and open pixels still respond correctly.
- A clearly labelled test enquiry was accepted by Zoho for nichole@laotes.com
  with message ID 1793623943695155300. This is provider acknowledgment, not an
  independent confirmation of inbox placement.
- The migration audit also corrected a pre-existing low-contrast quote-section
  heading on the light Contact background and versioned the stylesheet.
- Reusable checks: tools/verify-domain-migration.cjs (--send-test sends one
  labelled test enquiry) and tools/verify-domain-browser.cjs (requires
  Playwright and installed Chrome; PLAYWRIGHT_MODULE can point to the module).

- Run the Node test suite in tests/*.test.cjs.
- Check all seven public canonical pages, the analytics page, sitemap, robots,
  local images/scripts/styles, redirects, and API responses after deployment.
- Test one clearly labelled migration enquiry and confirm provider acceptance.
- Confirm GitHub main matches the published migration commit.
- Internal tools, tests, configuration, audit documents, and temporary files
  are excluded from static publication by .assetsignore.

## Rollback

Revert the migration commit and redeploy the same Worker if a rollback is
needed. Do not delete the shared KV namespaces or overwrite mail secrets.
Keep both legacy hosts active for search redirects and historical mail links.
