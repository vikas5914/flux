/**
 * Redirect worker for the retired `flux.kapadiya.net` host.
 *
 * The app moved to `sudo.kapadiya.net` to recover that domain's Google
 * rankings (docs/superpowers/specs/2026-07-22-sudo-domain-seo-restore.md).
 * `flux.kapadiya.net` now exists only to 301 its remaining traffic across.
 *
 * This is deliberately a *separate* Worker from the app in `wrangler.jsonc`.
 * Putting the redirect in the app Worker would require
 * `assets.run_worker_first`, which turns every static-asset request on the
 * canonical host — free and Worker-less today — into a billed invocation.
 * The dead host should carry that cost, not the live one.
 *
 * NOTE: this Worker only runs if the Cloudflare edge redirect rule for
 * `flux.kapadiya.net/*` is removed. Redirect Rules, Bulk Redirects and Page
 * Rule forwarding all execute *before* Workers, so an edge rule shadows this
 * entirely.
 *
 * ## Why `/sw.js` is special-cased
 *
 * Browsers that visited flux.kapadiya.net before the cutover still have the
 * app's Workbox service worker registered on that origin. It answers every
 * in-scope navigation from its precache / `navigateFallback: /index.html`, and
 * that fetch now 301s cross-origin to sudo.kapadiya.net, which sends no
 * `Access-Control-Allow-Origin`. The fetch is CORS-blocked, the FetchEvent
 * rejects, and the navigation dies with a network error:
 *
 *   Access to fetch at 'https://sudo.kapadiya.net/index.html' (redirected from
 *   'https://flux.kapadiya.net/index.html') ... blocked by CORS policy
 *
 * It cannot self-heal: a service worker script behind a redirect is rejected by
 * spec, so the update check fails forever and the dead registration is pinned.
 * Serving the live app's `/sw.js` here would not help either — that worker's
 * install step precaches `/index.html` and `/assets/*` on this origin, which
 * all 301 cross-origin and fail CORS, so install rejects and the broken
 * registration survives.
 *
 * So `/sw.js` serves a tombstone worker instead: it takes over the
 * registration, drops every cache, unregisters itself, and reloads open tabs
 * into the 301. It has no fetch handler, so navigations go straight to the
 * network and land on the canonical host.
 */

const CANONICAL_ORIGIN = "https://sudo.kapadiya.net";
const SERVICE_WORKER_PATH = "/sw.js";

/**
 * Tombstone service worker. Kept dependency-free, and free of backticks and
 * `${` so it survives being a template literal here.
 */
const KILL_SWITCH_SW = `// Tombstone worker for the retired flux.kapadiya.net origin.
// Unregisters the stale Workbox worker left behind by the move to sudo.kapadiya.net.
self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    (async function () {
      const keys = await caches.keys();
      await Promise.all(keys.map(function (key) { return caches.delete(key); }));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});
`;

export default {
  fetch(request: Request): Response {
    const url = new URL(request.url);

    if (url.pathname === SERVICE_WORKER_PATH) {
      return new Response(KILL_SWITCH_SW, {
        headers: {
          "content-type": "text/javascript; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    return Response.redirect(`${CANONICAL_ORIGIN}${url.pathname}${url.search}`, 301);
  },
};
