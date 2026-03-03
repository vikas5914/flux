import { useQueries } from "@tanstack/react-query";
import { TitleCard } from "./TitleCard";
import { useWatchHistory } from "../hooks/useWatchHistory";
import { tmdbKeys } from "../lib/query-keys";
import { parseContentId, mapMovieToContent, mapTVToContent } from "../data/content";
import { getMovieDetails, getTVDetails } from "../lib/tmdb";

export function ContinueWatching() {
  const { ids, getEntry } = useWatchHistory();

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

      <div className="flex gap-3 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4">
        {items.map((content) => {
          const isMovie = content.type === "movie";
          let watchUrl: string;
          if (isMovie) {
            watchUrl = `/watch/${content.id}`;
          } else {
            const last = getEntry(content.id);
            watchUrl = last
              ? `/watch/${content.id}/${last.season}/${last.episode}`
              : `/title/${content.id}`;
          }
          return (
            <div key={content.id} className="w-36 shrink-0 sm:w-auto sm:shrink">
              <TitleCard content={content} linkTo={watchUrl} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
