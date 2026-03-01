'use client';

import { useQuery } from '@tanstack/react-query';
import { getTrendingAll } from '../lib/tmdb';
import { mapSearchResultToContent } from '../data/content';
import { tmdbKeys } from '../lib/query-keys';

export function useTrendingQuery() {
  return useQuery({
    queryKey: tmdbKeys.trendingAll(),
    queryFn: async () => {
      const data = await getTrendingAll();
      return data.results
        .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
        .slice(0, 12)
        .map(mapSearchResultToContent);
    },
    staleTime: 10 * 60 * 1000,
  });
}
