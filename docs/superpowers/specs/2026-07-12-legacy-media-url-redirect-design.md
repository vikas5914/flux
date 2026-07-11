# Legacy `/media/...` URL Redirect — Design

**Date:** 2026-07-12

## Problem

The retired product at `sudo.kapadiya.net` still receives Google traffic on legacy
URLs shaped like:

```
https://sudo.kapadiya.net/media/tmdb-movie-875828-peaky-blinders-the-immortal-man
```

That path does not exist in the current product (`flux.kapadiya.net`), which is a
different codebase. We need those visitors (and the SEO signal) to land on the
equivalent playable page in flux.

Legacy URL shape (the only one in scope):

```
/media/tmdb-{movie|tv}-{tmdbId}-{slug}
```

Flux content identity and routes:

- Content id: `movie-{tmdbId}` / `tv-{tmdbId}` (`src/data/content.ts`)
- Routes (`src/App.tsx`):
  - `/title/:id` — details
  - `/watch/:contentId/:season?/:episode?` — player

Target mapping:

- `movie` → `/watch/movie-{tmdbId}` (drops straight into the player).
- `tv` → `/title/tv-{tmdbId}` (details page). A bare `/watch/tv-{id}` with no
  season/episode is treated as **invalid** by `WatchPage` (`src/pages/WatchPage.tsx:510`)
  and bounces to `/`, so TV must land on details where the user picks an episode.

Example: `/media/tmdb-movie-875828-...` → `/watch/movie-875828`.

## Two independent pieces

### Piece 1 — Flux Worker (this repo)

Flux is currently a pure SPA served by Cloudflare Static Assets
(`wrangler.jsonc`, `not_found_handling: "single-page-application"`, no Worker
script). We add a minimal Worker that fires **only** for `/media/*` and issues a
real `301`.

**Why a server-side 301, not a React route:** Google holds the legacy URLs. A
server 301 passes ranking signal and updates the canonical URL in the index; a
client-side redirect is a soft 200 that does not. SEO preservation is the whole
point.

**New file `src/worker/index.ts`:**

- Regex-match the path: `^/media/tmdb-(movie|tv)-(\d+)(?:-.*)?$`.
- On match → `Response.redirect` (301):
  - `movie` → `/watch/movie-{tmdbId}`
  - `tv` → `/title/tv-{tmdbId}`
  Preserve the original query string. Emit an absolute URL built from the
  request origin.
- On no match → `env.ASSETS.fetch(request)` (safety fallback; in practice only
  `/media/*` reaches the Worker).

**`wrangler.jsonc` additions:**

```jsonc
"main": "./src/worker/index.ts",
"assets": {
  "not_found_handling": "single-page-application",
  "binding": "ASSETS",
  "run_worker_first": ["/media/*"]
}
```

`run_worker_first: ["/media/*"]` is essential. Per Cloudflare docs, in SPA mode
every non-asset path returns `index.html` (200) and the Worker is bypassed
unless the path is explicitly opted into worker-first routing. Everything outside
`/media/*` keeps today's exact behavior.

**Redirect target:** `movie-*` → watch page (as chosen); `tv-*` → details page
(forced by the `WatchPage` validity check above).

**Type of `env`:** minimal `interface Env { ASSETS: Fetcher }`.

### Piece 2 — `sudo` → `flux` domain forwarding (Cloudflare dashboard/API)

An existing redirect rule on `sudo.kapadiya.net` currently forwards to flux but
drops the path. Update it to preserve the full path (and query) so requests
reach flux's `/media/*` Worker:

- **When:** hostname equals `sudo.kapadiya.net`
- **Then:** Dynamic redirect, status `301`
  - Target expression: `concat("https://flux.kapadiya.net", http.request.uri.path)`
  - Preserve query string: **on**

Result chain:

```
sudo.kapadiya.net/media/tmdb-movie-875828-...
  → (redirect rule, path preserved) flux.kapadiya.net/media/tmdb-movie-875828-...
  → (flux Worker, 301) flux.kapadiya.net/watch/movie-875828
```

This piece will be applied via the Cloudflare API MCP against the existing rule.

## Out of scope

- Non-`/media` legacy URL shapes (confirmed none in scope).
- Any change to flux's existing routes or SPA behavior.

## Verification

- Unit-level: assert the path-parsing regex maps representative movie/tv legacy
  URLs to the correct `/watch/...` target and ignores non-matching paths.
- End-to-end: `curl -sI https://flux.kapadiya.net/media/tmdb-movie-875828-x`
  returns `301` with `Location: /watch/movie-875828`; a normal SPA route
  (e.g. `/title/movie-875828`) still returns the app.
- Confirm the updated `sudo` rule preserves path via
  `curl -sI https://sudo.kapadiya.net/media/tmdb-movie-875828-x`.
