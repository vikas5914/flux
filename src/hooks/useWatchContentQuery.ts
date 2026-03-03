import { useQuery } from "@tanstack/react-query";
import { tmdbKeys } from "../lib/query-keys";
import { parseContentId, mapMovieToContent, mapTVToContent } from "../data/content";
import { getMovieDetails, getTVDetails } from "../lib/tmdb";

export function useWatchContentQuery(contentId: string | undefined) {
  const parsed = contentId ? parseContentId(contentId) : null;

  return useQuery({
    queryKey:
      parsed?.type === "movie"
        ? tmdbKeys.movieDetails(parsed.tmdbId)
        : tmdbKeys.tvDetails(parsed?.tmdbId ?? 0),
    queryFn: async () => {
      if (!parsed) throw new Error("Invalid content ID");

      if (parsed.type === "movie") {
        const movie = await getMovieDetails(parsed.tmdbId);
        return mapMovieToContent(movie);
      }

      const tv = await getTVDetails(parsed.tmdbId);
      return mapTVToContent(tv);
    },
    enabled: !!parsed,
  });
}
