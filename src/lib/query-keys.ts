export const tmdbKeys = {
  all: ["tmdb"] as const,
  trending: () => [...tmdbKeys.all, "trending"] as const,
  trendingAll: (page = 1) => [...tmdbKeys.trending(), "all", page] as const,
  trendingMovies: (page = 1) => [...tmdbKeys.trending(), "movies", page] as const,
  trendingTV: (page = 1) => [...tmdbKeys.trending(), "tv", page] as const,
  search: () => [...tmdbKeys.all, "search"] as const,
  searchMulti: (query: string) => [...tmdbKeys.search(), query] as const,
  details: () => [...tmdbKeys.all, "details"] as const,
  contentDetails: (id: string) => [...tmdbKeys.details(), "content", id] as const,
  movieDetails: (id: number) => [...tmdbKeys.details(), "movie", id] as const,
  tvDetails: (id: number) => [...tmdbKeys.details(), "tv", id] as const,
  tvSeason: (tvId: number, season: number) =>
    [...tmdbKeys.details(), "tv", tvId, "season", season] as const,
};
