import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Hardcoded rather than window.location.origin so dev and preview hosts never claim to be canonical.
const SITE_ORIGIN = "https://flux.marcus5914.workers.dev";

function canonicalUrlFor(pathname: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  return `${SITE_ORIGIN}${path}`;
}

function upsertHeadElement<T extends HTMLElement>(selector: string, create: () => T): T {
  return document.head.querySelector<T>(selector) ?? document.head.appendChild(create());
}

/**
 * index.html is served for every route, so a static canonical would point all
 * pages at the home page. Sets canonical + og:url per route; query strings are
 * dropped so search/filter variants consolidate onto the path.
 */
export function useCanonicalUrl() {
  const { pathname } = useLocation();

  useEffect(() => {
    const href = canonicalUrlFor(pathname);

    upsertHeadElement('link[rel="canonical"]', () => {
      const link = document.createElement("link");
      link.rel = "canonical";
      return link;
    }).href = href;

    upsertHeadElement('meta[property="og:url"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:url");
      return meta;
    }).content = href;
  }, [pathname]);
}
