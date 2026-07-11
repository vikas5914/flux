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

### Piece 1 — Client-side redirect route (this repo)

Flux is a pure SPA served by Cloudflare Static Assets
(`wrangler.jsonc`, `not_found_handling: "single-page-application"`). Non-asset
paths already serve `index.html`, so `/media/...` reaches React Router with no
infrastructure change. We add a redirect route rather than a Worker.

> **Note:** A server-side 301 (Cloudflare Worker) would be marginally better for
> SEO — it passes ranking signal and updates the canonical URL in Google's index,
> whereas a client-side redirect is a soft 200 + JS navigation. We deliberately
> chose the simpler client-side route: the legacy URL set is small and the added
> Worker + `run_worker_first` config wasn't worth the complexity.

**New file `src/pages/LegacyMediaRedirect.tsx`:**

- Route `/media/:slug` added in `src/App.tsx`.
- Regex-match the slug: `^tmdb-(movie|tv)-(\d+)(?:-.*)?$`.
- On match → `<Navigate replace>`:
  - `movie` → `/watch/movie-{tmdbId}`
  - `tv` → `/title/tv-{tmdbId}`
- On no match → `<Navigate replace to="/">` (home).

**Redirect target:** `movie-*` → watch page (as chosen); `tv-*` → details page
(forced by the `WatchPage` validity check above).

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

- Unit-level: the slug-parsing maps representative movie/tv legacy URLs to the
  correct target and falls back to `/` for non-matching slugs.
- SPA serving: `/media/...` returns `200` + `index.html` so React Router can
  route it.
- End-to-end: loading `flux.kapadiya.net/media/tmdb-movie-875828-x` in a browser
  lands on `/watch/movie-875828`; a `tv-*` legacy URL lands on `/title/tv-{id}`.
- Confirm the updated `sudo` rule preserves path via
  `curl -sI https://sudo.kapadiya.net/media/tmdb-movie-875828-x`.
