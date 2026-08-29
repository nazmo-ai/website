# Running Nazmo.AI

## Requirements

- Node.js 20+ and npm

## Install

```bash
npm install
```

## Run locally (development)

```bash
npm run dev
```

Starts the Vite dev server at `http://localhost:5173` with hot module reload.

## Type-check

```bash
npx tsc -b
```

## Test

```bash
npm test
```

Runs the Vitest suite over the pure logic — map projection and magnification,
the orchestration run state machine, and waitlist validation. No DOM or visual
tests; verify the visuals in a browser.

## Regenerate the world map dots

```bash
npm run build:land-dots
```

Only needed if the grid spacing or latitude clip in
`scripts/build-land-dots.mjs` changes. The output, `src/data/landDots.ts`, is
committed, so a normal build never runs this.

## Production build

```bash
npm run build
```

Type-checks the project and outputs a static build to `dist/`.

## Preview the production build locally

```bash
npm run preview
```

Serves the contents of `dist/` locally so you can sanity-check the build
before deploying.

## Run with Docker

The `Dockerfile` builds the app and serves the static output with nginx.

```bash
./docker-run.sh
```

Or directly:

```bash
docker compose up -d --build
```

Visit `http://localhost:8080`. Stop it with `docker compose down`.

Without compose:

```bash
docker build -t nazmo-ai-website .
docker run -d --name nazmo-ai-website -p 8080:80 nazmo-ai-website
```

## Deploying `dist/`

This is a static single-page app — `dist/` after `npm run build` is all
that's needed. Any static host works:

- **Vercel / Netlify**: connect the repo, set build command `npm run build`
  and output directory `dist`. Both auto-detect Vite projects.
- **Static bucket (S3 + CloudFront, Cloudflare Pages, GitHub Pages, etc.)**:
  upload the contents of `dist/` to the host/bucket serving `nazmo.ai`.

Since this is a client-side-routed SPA with a single route (`/`), no special
rewrite/fallback rules are required beyond serving `index.html` for `/`.

## Waitlist → Google Sheets

The site is static, so signups go to a Google Apps Script web app bound to the
signup spreadsheet. There is no backend and no service-account key.

**One-time setup:**

1. Create a blank Google Sheet to collect signups.
2. In that sheet: **Extensions → Apps Script**.
3. Delete the placeholder `Code.gs` contents and paste all of
   [`scripts/waitlist-appscript.gs`](scripts/waitlist-appscript.gs). Save.
4. **Deploy → New deployment → Web app**, with:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
5. Authorise when prompted, then copy the deployment's `/exec` URL.
6. Copy `.env.example` to `.env` and put the URL in it:

   ```bash
   cp .env.example .env
   # then edit:
   VITE_WAITLIST_ENDPOINT=https://script.google.com/macros/s/AKfy.../exec
   ```

   One file covers both paths: Vite reads `.env` for `npm run dev` and
   `npm run build`, and docker compose reads it to fill the build arg. `.env` is
   gitignored, and `.dockerignore` keeps it out of the image context — the value
   reaches the Docker build as an explicit `--build-arg` instead.

   Deploying without compose:

   ```bash
   docker build --build-arg VITE_WAITLIST_ENDPOINT="https://script.google.com/macros/s/AKfy.../exec" -t nazmo-ai-website .
   ```

   On Vercel/Netlify/Cloudflare, set `VITE_WAITLIST_ENDPOINT` in the host's
   environment-variable settings.

   > The value is inlined into the JavaScript bundle at **build** time, not read
   > at container start. Changing it means rebuilding.

The script creates a `Waitlist` tab on first submission with these columns, and
skips addresses already on the list:

| Timestamp | Name | Company | Role | Job location | Email | Phone | Source |
| --- | --- | --- | --- | --- | --- | --- | --- |

Name, company, role, job location and email are required; phone is optional.

**If the variable is unset — or is not a well-formed Apps Script `/exec` URL —**
the form is replaced by a "waitlist opens shortly" notice, so the site never
ships a form that silently drops signups. This is the current state.

The URL shape is checked deliberately. A cross-origin 404 carries no CORS
headers, so `fetch` throws rather than reporting a failure status, and the
opaque retry below would then look like a successful signup. Rejecting a
malformed URL up front turns the most likely misconfiguration into a visible
closed state instead of a form that quietly discards everything.

> **After deploying, submit the form once and confirm the row appears in the
> sheet.** A URL that is well-formed but points at an undeployed or
> wrongly-permissioned script can still report success to the visitor while
> saving nothing — the browser is not allowed to read the real response. The
> browser console logs a warning whenever the response was unreadable.

> ⚠️ **The endpoint is public.** It ships in the client bundle and anyone who
> reads it can POST to it. A honeypot field, a 2.5s minimum form dwell time, and
> email validation run in the browser *and again inside the Apps Script*, since
> the browser-side checks are trivially bypassed. That is appropriate for a beta
> waitlist and not for anything sensitive. To rotate the URL, create a new
> deployment and update the variable.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_WAITLIST_ENDPOINT` | No | Apps Script `/exec` URL for waitlist signups. Without it the form renders closed. |

Nothing else is required to build or run the site.
