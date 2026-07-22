# Restore `sudo.kapadiya.net` with Flux code + legacy SEO

**Date:** 2026-07-22

## Goal

Serve the **current Flux app** on the **old domain** `sudo.kapadiya.net`, so Google
traffic and rankings on the old site can recover. Stop the domain-level redirect
to `flux.kapadiya.net`. Keep old URL paths working and restore old SEO metadata.

## Code changes (this repo)

### 1. Legacy routes (same path, no client hop away from indexed URLs)

| Old (sudo-flix / smov) | Flux behaviour |
| --- | --- |
| `/media/tmdb-movie-{id}-{slug}` | Watch player **at the same URL** |
| `/media/tmdb-tv-{id}-{slug}` or `tmdb-show-...` | Details page at the same URL |
| `/media/tmdb-tv-{id}-{slug}/{season}/{episode}` | Watch player (resolves TMDB season/episode IDs → numbers) |
| `/browse/:query?`, `?q=` | Home + search |
| `/s/:query` | Home + search |
| `/search/:type/:query?` | Redirects to `/browse/...` |
| `/`, `/title/:id`, `/watch/...` | Unchanged Flux routes |

Implementation: `src/pages/LegacyMediaRedirect.tsx`, `src/lib/legacyMedia.ts`,
`src/App.tsx`.

### 2. SEO metadata parity

From [sussy-code/smov](https://github.com/sussy-code/smov):

- `<title>sudo-flix</title>`
- Description: `Watch your favorite shows and movies for free with no ads ever! (っ'ヮ'c)`
- `theme-color` / tile: `#120f1d`
- OG / Twitter tags, canonical `https://sudo.kapadiya.net/`
- PWA manifest name/description match sudo-flix
- `public/robots.txt` — allow all
- Per-page `document.title` (home, details, watch, search)

### 3. Branding

Header brand text: **sudo-flix** (was “Flux”). App code remains Flux.

## Ops cutover (Cloudflare — do after deploy)

1. **Deploy** this app (`bun run deploy` / your usual pipeline).
2. **Custom domain**: attach `sudo.kapadiya.net` to this Cloudflare Pages/Workers
   project (the one that currently serves flux).
3. **Remove** the bulk redirect / page rule that 301s
   `sudo.kapadiya.net/*` → `flux.kapadiya.net/*`.
4. **Optional but recommended for SEO consolidation**: 301
   `flux.kapadiya.net/*` → `https://sudo.kapadiya.net$1` (path + query preserved)
   so one canonical host remains.
5. **Google Search Console**:
   - Ensure property for `sudo.kapadiya.net` is verified.
   - Request re-indexing of home + top `/media/...` URLs.
   - If you used a domain move to flux, reverse or clear that in GSC.
6. **Auth / Convex**: if Google OAuth redirect URIs or Convex HTTP routes list
   `flux.kapadiya.net`, add `https://sudo.kapadiya.net` (and callback paths).

## Verification

```bash
# After cutover: no 301 to flux
curl -sI https://sudo.kapadiya.net/ | head -15

# SPA still serves index for media paths
curl -sI https://sudo.kapadiya.net/media/tmdb-movie-875828-x | head -15

# SEO tags present in HTML
curl -sL https://sudo.kapadiya.net/ | rg -i 'sudo-flix|description|canonical|robots'
```

In-browser:

- `/media/tmdb-movie-…` opens the player without rewriting the path to `/watch/…`.
- `/media/tmdb-tv-…` opens details without rewriting to `/title/…`.
- `/browse/inception` pre-fills search.

## Out of scope

- Full smov feature set (discover, settings, scrape player, etc.).
- Server-side rendered meta per title (still a SPA; titles update client-side).
- Recreating old PWA splash screens / favicon set pixel-for-pixel.
