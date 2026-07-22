import { useEffect } from "react";

const DEFAULT_TITLE = "sudo-flix";

/**
 * Sets document.title for SEO parity with the old sudo-flix app.
 * Restores the default on unmount so navigations don't leave stale titles.
 */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    const previous = document.title;
    document.title = title?.trim() ? title : DEFAULT_TITLE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

export function formatPageTitle(pageTitle: string, asSubpage = true): string {
  if (!asSubpage) return pageTitle;
  return `${pageTitle} - sudo-flix`;
}
