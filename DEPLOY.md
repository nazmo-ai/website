# Running Nazmo AI

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

No environment variables or backend services are required to build or run
the site as it stands today — the early-access form is client-side only and
does not submit anywhere yet.
