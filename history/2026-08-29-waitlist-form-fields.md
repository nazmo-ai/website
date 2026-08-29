# 2026-08-29 — Expanded waitlist form

Follow-up to [the map hero redesign](2026-08-29-map-hero-orchestration-redesign.md).

## Requested

A form collecting name, company, role/position, job location and email, with
phone number optional.

Read the explicit "phone as optional" as meaning the other five are required.
The old free-text "What would you orchestrate first?" dropdown was not in the
list, so it was dropped.

## The form

Six fields in a two-up grid: Name, Company, Role, Job location, Work email,
Phone. Required fields carry an accent asterisk; phone is labelled `optional`.

Validation now names the field that failed, so the message is specific
("Please enter your role.") and the offending input is outlined and focused
rather than leaving the person to hunt for it. Phone is checked only when
filled, and permissively — formatting is unconstrained, but it must be 7-15
digits and contain no letters, so `+1 (555) 010-9999` and `+81-3-1234-5678`
both pass.

The Apps Script gained matching columns and repeats every check server-side:

| Timestamp | Name | Company | Role | Job location | Email | Phone | Source |

## A silent failure the browser test exposed

Previewing the form locally needs an endpoint, so a placeholder URL was set.
Google returned **404** — and the form reported success anyway.

The cause is structural, not a typo. A cross-origin 404 carries no CORS headers,
so `fetch` *throws* rather than resolving with `ok: false`; the `catch` then
retried with `mode: 'no-cors'`, which always resolves opaquely, which the code
read as success. Any wrong URL would have told every visitor they were on the
list while saving nothing.

The opaque retry has to stay — a genuinely working Apps Script deployment can
also produce an unreadable response, and failing those signups would be worse.
So the fix is at the other end: `VITE_WAITLIST_ENDPOINT` is now checked against
the Apps Script deployment URL shape, and anything malformed leaves the form in
its closed state instead of accepting submissions it cannot deliver. The opaque
path also logs a console warning now, so a broken deployment is diagnosable.

**Residual risk, documented in DEPLOY.md:** a well-formed URL pointing at an
undeployed or wrongly-permissioned script can still report success while saving
nothing. There is no way for the page to detect this — the browser is not
allowed to read the response. The mitigation is procedural: submit the form once
after deploying and confirm the row lands.

## Verified

106 tests, up from 78 — required-field, email, phone, honeypot, dwell-time and
endpoint-shape cases. Exercised in the browser: submitting empty names the first
missing field and focuses it, and each subsequent gap surfaces in order through
company, location, email and phone.
