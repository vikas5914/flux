import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import WatchPage from "./WatchPage";
import DetailsPage from "./DetailsPage";
import { Spinner } from "../components/Spinner";
import {
  legacyToContentId,
  parseLegacyMediaSlug,
  resolveLegacySeasonEpisode,
} from "../lib/legacyMedia";
import { getTVDetails, getTVSeasonDetails } from "../lib/tmdb";

/**
 * Serves legacy sudo-flix URLs with Flux UI, keeping the original path
 * (important for reclaiming Google rankings on sudo.kapadiya.net).
 *
 * Legacy shape:
 *   /media/tmdb-{movie|tv|show}-{tmdbId}-{slug}
 *   /media/tmdb-tv-{tmdbId}-{slug}/{seasonIdOrNumber}/{episodeIdOrNumber}
 *
 * Behaviour:
 *   movie              → watch player (same URL)
 *   tv (no s/e)        → details page (pick episode)
 *   tv (with s/e)      → watch player after resolving TMDB season/episode IDs
 *   unrecognised slug  → home
 */

type ResolvedLegacy =
  | { kind: "watch"; contentId: string; season?: string; episode?: string }
  | { kind: "details"; contentId: string }
  | { kind: "home" };

export default function LegacyMediaRedirect() {
  const { slug, season, episode } = useParams<{
    slug: string;
    season?: string;
    episode?: string;
  }>();

  const [resolved, setResolved] = useState<ResolvedLegacy | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const parsed = parseLegacyMediaSlug(slug);
      if (!parsed) {
        if (!cancelled) setResolved({ kind: "home" });
        return;
      }

      const contentId = legacyToContentId(parsed);

      if (parsed.type === "movie") {
        if (!cancelled) setResolved({ kind: "watch", contentId });
        return;
      }

      // TV without season/episode → details (old bare /media/tmdb-tv-... links)
      if (!season || !episode) {
        if (!cancelled) setResolved({ kind: "details", contentId });
        return;
      }

      try {
        const show = await getTVDetails(parsed.tmdbId);
        const seasons =
          show.seasons
            ?.filter((s) => s.season_number > 0)
            .map((s) => ({
              id: s.id,
              seasonNumber: s.season_number,
              episodeCount: s.episode_count,
            })) ?? [];

        const se = await resolveLegacySeasonEpisode(
          seasons,
          season,
          episode,
          async (seasonNumber) => {
            const detail = await getTVSeasonDetails(parsed.tmdbId, seasonNumber);
            return detail.episodes.map((ep) => ({
              id: ep.id,
              episodeNumber: ep.episode_number,
            }));
          },
        );

        if (!se) {
          // Fall back to details rather than a broken player
          if (!cancelled) setResolved({ kind: "details", contentId });
          return;
        }

        if (!cancelled) {
          setResolved({
            kind: "watch",
            contentId,
            season: String(se.season),
            episode: String(se.episode),
          });
        }
      } catch {
        if (!cancelled) setResolved({ kind: "details", contentId });
      }
    }

    setResolved(null);
    void resolve();
    return () => {
      cancelled = true;
    };
  }, [slug, season, episode]);

  if (!resolved) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (resolved.kind === "home") {
    return <Navigate to="/" replace />;
  }

  if (resolved.kind === "details") {
    return <DetailsPage id={resolved.contentId} />;
  }

  return (
    <WatchPage
      contentId={resolved.contentId}
      season={resolved.season}
      episode={resolved.episode}
    />
  );
}
