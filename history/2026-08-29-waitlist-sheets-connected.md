# 2026-08-29 — Waitlist connected to Google Sheets

The Apps Script web app is deployed and the site now writes signups to the
spreadsheet.

## Configuration

`VITE_WAITLIST_ENDPOINT` holds the Apps Script `/exec` URL. It lives in `.env`,
which is gitignored — one file serves both paths, because Vite reads `.env` for
dev and build, and docker compose reads the same file to fill a build arg.

Docker needed plumbing: Vite inlines env vars at **build** time, so the value
has to be present during `npm run build` inside the image, not at container
start. The Dockerfile takes `ARG VITE_WAITLIST_ENDPOINT` (empty by default, so
an unconfigured build renders the waitlist closed rather than shipping a form
that discards signups), and compose passes it through. `.dockerignore` now
excludes `.env*` so local config cannot leak into an image by accident.

`.env.example` is committed as the template.

## Verified against the live endpoint

`GET` returned `{"ok":true,"service":"nazmo-waitlist"}`, confirming the
deployment, its "Anyone" permission, and that the pasted script is the one
running.

Each `POST` path, read back through the redirect target:

| Case | Response | Row written |
| --- | --- | --- |
| Complete submission | `{"ok":true}` | yes |
| Same email again | `{"ok":true,"duplicate":true}` | no |
| No phone number | `{"ok":true}` | yes |
| Honeypot filled | `{"ok":true}` | no |
| Malformed phone | `{"ok":false,"error":"invalid_phone"}` | no |
| Missing name | `{"ok":false,"error":"missing_name"}` | no |
| Submitted too fast | `{"ok":false,"error":"too_fast"}` | no |

Then end to end through the real form in a browser: the POST returned 302, the
success state rendered, and re-sending the same address afterwards returned
`duplicate:true` — proving the row reached the sheet rather than the UI merely
claiming so.

**The response is readable.** The redirect target carries
`access-control-allow-origin: *`, so the browser reads the real result and the
blind opaque fallback documented in
[the form change](2026-08-29-waitlist-form-fields.md) never runs. No console
warning was emitted, which is the signal that the good path was taken.

## Note on the 405

Probing with `curl -L` reported `HTTP 405` and Google's "file cannot be opened"
page, which looks like a broken deployment and is not. `/exec` answers a POST
with a 302 to `script.googleusercontent.com`; the 405 came from curl
re-requesting that redirect target. Following the redirect by hand and reading
the body shows the real JSON. Browsers handle this correctly on their own.

## Cleanup

Three test rows were written and should be deleted: `DELETE ME - test 1`,
`DELETE ME - test 2`, `DELETE ME - browser test`.
