/**
 * Legacy sudo-flix / smov media URL helpers.
 *
 * Old shape (indexed by Google on sudo.kapadiya.net):
 *   /media/tmdb-{movie|tv|show}-{tmdbId}-{slug}
 *   /media/tmdb-tv-{tmdbId}-{slug}/{seasonTmdbId}/{episodeTmdbId}
 *
 * Season/episode path segments in the old app were TMDB resource IDs
 * (not season/episode numbers). We accept either form.
 */

export type LegacyMediaType = "movie" | "tv";

export interface ParsedLegacyMediaSlug {
  type: LegacyMediaType;
  tmdbId: number;
  /** Full slug after the id, if any (unused for routing, kept for debugging). */
  titleSlug?: string;
}

/** Matches tmdb-movie-123-title, tmdb-tv-123-title, and legacy tmdb-show-123-title */
const LEGACY_MEDIA_SLUG = /^tmdb-(movie|tv|show)-(\d+)(?:-(.*))?$/i;

export function parseLegacyMediaSlug(slug: string | undefined): ParsedLegacyMediaSlug | null {
  if (!slug) return null;
  const match = slug.match(LEGACY_MEDIA_SLUG);
  if (!match) return null;
  const rawType = match[1].toLowerCase();
  const tmdbId = parseInt(match[2], 10);
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) return null;
  const type: LegacyMediaType = rawType === "movie" ? "movie" : "tv";
  return {
    type,
    tmdbId,
    titleSlug: match[3] || undefined,
  };
}

export function legacyToContentId(parsed: ParsedLegacyMediaSlug): string {
  return `${parsed.type === "movie" ? "movie" : "tv"}-${parsed.tmdbId}`;
}

/**
 * Map a legacy season/episode path pair onto Flux season/episode numbers.
 *
 * @param seasons - TV show seasons from TMDB (includes season id + season_number)
 * @param fetchSeasonEpisodes - loads episodes for a season_number
 */
export async function resolveLegacySeasonEpisode(
  seasons: { id: number; seasonNumber: number; episodeCount: number }[],
  seasonParam: string,
  episodeParam: string,
  fetchSeasonEpisodes: (
    seasonNumber: number,
  ) => Promise<{ id: number; episodeNumber: number }[]>,
): Promise<{ season: number; episode: number } | null> {
  const seasonNumOrId = Number(seasonParam);
  const episodeNumOrId = Number(episodeParam);
  if (!Number.isFinite(seasonNumOrId) || !Number.isFinite(episodeNumOrId)) {
    return null;
  }

  // Prefer match by TMDB season id (old app), fall back to season_number.
  let season =
    seasons.find((s) => s.id === seasonNumOrId) ??
    seasons.find((s) => s.seasonNumber === seasonNumOrId);

  // If still nothing and value looks like a small season number, allow it directly.
  if (!season && seasonNumOrId >= 0 && seasonNumOrId < 1000) {
    season = seasons.find((s) => s.seasonNumber === seasonNumOrId);
  }
  if (!season) return null;

  const episodes = await fetchSeasonEpisodes(season.seasonNumber);
  const episode =
    episodes.find((e) => e.id === episodeNumOrId) ??
    episodes.find((e) => e.episodeNumber === episodeNumOrId);

  if (!episode) {
    // Fall back: treat param as episode number when in a sane range.
    if (episodeNumOrId >= 1 && episodeNumOrId < 1000) {
      return { season: season.seasonNumber, episode: episodeNumOrId };
    }
    return null;
  }

  return { season: season.seasonNumber, episode: episode.episodeNumber };
}
