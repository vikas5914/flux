/**
 * Redirect worker for the retired `flux.kapadiya.net` and `sudo.kapadiya.net`
 * hosts.
 *
 * The app now lives only on its workers.dev URL. Both old hosts exist solely to
 * 301 their traffic there, path and query intact, so Google transfers their
 * rankings via Search Console's change of address instead of dropping them.
 * Keep them attached here for at least a year after the move.
 *
 * This is deliberately a *separate* Worker from the app in `wrangler.jsonc`.
 * Putting the redirect in the app Worker would require
 * `assets.run_worker_first`, which turns every static-asset request on the
 * canonical host — free and Worker-less today — into a billed invocation.
 * The dead host should carry that cost, not the live one.
 *
 * NOTE: this Worker only runs if no Cloudflare edge redirect rule matches the
 * retired hosts. Redirect Rules, Bulk Redirects and Page
 * Rule forwarding all execute *before* Workers, so an edge rule shadows this
 * entirely.
 *
 * ## Why `/sw.js` is special-cased
 *
 * Browsers that visited a retired host before the cutover still have the
 * app's Workbox service worker registered on that origin. It answers every
 * in-scope navigation from its precache / `navigateFallback: /index.html`, and
 * that fetch now 301s cross-origin to the canonical host, which sends no
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

const CANONICAL_ORIGIN = "https://flux.marcus5914.workers.dev";
const SERVICE_WORKER_PATH = "/sw.js";

/**
 * Tombstone service worker. Kept dependency-free, and free of backticks and
 * `${` so it survives being a template literal here.
 */
const KILL_SWITCH_SW = `// Tombstone worker for a retired kapadiya.net origin.
// Unregisters the stale Workbox worker left behind by the move to flux.marcus5914.workers.dev.
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
