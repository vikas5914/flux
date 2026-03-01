"use client";

import { useQueries } from "@tanstack/react-query";
import { TitleCard } from "./TitleCard";
import { useWatchHistory } from "../hooks/useWatchHistory";
import { tmdbKeys } from "../lib/query-keys";
import { parseContentId, mapMovieToContent, mapTVToContent } from "../data/content";
import { getMovieDetails, getTVDetails } from "../lib/tmdb";

export function ContinueWatching() {
  const { ids } = useWatchHistory();

  const queries = useQueries({
    queries: ids
      .map((id) => ({ id, parsed: parseContentId(id) }))
      .filter(({ parsed }) => parsed !== null)
      .map(({ parsed }) => ({
        queryKey:
          parsed!.type === "movie"
            ? tmdbKeys.movieDetails(parsed!.tmdbId)
            : tmdbKeys.tvDetails(parsed!.tmdbId),
        queryFn: async () => {
          if (parsed!.type === "movie") {
            const movie = await getMovieDetails(parsed!.tmdbId);
            return mapMovieToContent(movie);
          }
          const tv = await getTVDetails(parsed!.tmdbId);
          return mapTVToContent(tv);
        },
        staleTime: 1000 * 60 * 30,
      })),
  });

  const items = queries.filter((q) => q.isSuccess && q.data).map((q) => q.data!);

  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px w-6 bg-[#f6821f]" />
        <h2 className="font-mono text-xs uppercase tracking-widest text-[#f6821f]">
          Continue Watching
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((content) => (
          <TitleCard key={content.id} content={content} />
        ))}
      </div>
    </section>
  );
}
