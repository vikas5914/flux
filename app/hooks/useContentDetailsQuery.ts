"use client";

import { useQuery } from "@tanstack/react-query";
import { tmdbKeys } from "../lib/query-keys";
import { parseContentId, mapMovieToContent, mapTVToContent } from "../data/content";
import { getMovieDetails, getTVDetails, getTVSeasonDetails } from "../lib/tmdb";

export function useContentDetailsQuery(id: string) {
  const parsed = parseContentId(id);

  return useQuery({
    queryKey: tmdbKeys.contentDetails(id),
    queryFn: async () => {
      if (!parsed) throw new Error("Invalid content ID");

      if (parsed.type === "movie") {
        const movie = await getMovieDetails(parsed.tmdbId);
        return {
          content: mapMovieToContent(movie),
          tvShow: null,
          initialSeason: null as number | null,
        };
      }

      const tv = await getTVDetails(parsed.tmdbId);
      const firstSeason = tv.seasons?.find((s) => s.season_number > 0)?.season_number ?? 1;
      const season = await getTVSeasonDetails(parsed.tmdbId, firstSeason).catch(() => null);

      return {
        content: mapTVToContent(tv, season?.episodes),
        tvShow: tv,
        initialSeason: firstSeason,
      };
    },
    enabled: !!parsed,
  });
}
