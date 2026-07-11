import { Navigate, useParams } from "react-router-dom";

/**
 * Redirects legacy URLs from the retired sudo.kapadiya.net product to their
 * flux equivalent.
 *
 * Legacy shape: /media/tmdb-{movie|tv}-{tmdbId}-{slug}
 *   movie -> /watch/movie-{tmdbId}   (straight into the player)
 *   tv    -> /title/tv-{tmdbId}      (details; a bare /watch/tv-{id} is invalid)
 *
 * Anything that doesn't match falls back to the home page.
 */
const LEGACY_MEDIA_SLUG = /^tmdb-(movie|tv)-(\d+)(?:-.*)?$/;

function legacyMediaRedirectPath(slug: string | undefined): string {
  const match = slug?.match(LEGACY_MEDIA_SLUG);
  if (!match) return "/";
  const [, type, tmdbId] = match;
  return type === "movie" ? `/watch/movie-${tmdbId}` : `/title/tv-${tmdbId}`;
}

export default function LegacyMediaRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={legacyMediaRedirectPath(slug)} replace />;
}
