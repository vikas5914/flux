'use client';

import { useQuery } from '@tanstack/react-query';
import { tmdbKeys } from '../lib/query-keys';
import { mapTVToContent } from '../data/content';
import { getTVSeasonDetails, type TMDBTVShow } from '../lib/tmdb';

export function useSeasonQuery(
  tvShow: TMDBTVShow | null | undefined,
  tmdbId: number,
  seasonNumber: number,
) {
  return useQuery({
    queryKey: tmdbKeys.tvSeason(tmdbId, seasonNumber),
    queryFn: async () => {
      const season = await getTVSeasonDetails(tmdbId, seasonNumber).catch(() => null);
      return mapTVToContent(tvShow!, season?.episodes);
    },
    enabled: !!tvShow && tmdbId > 0 && seasonNumber > 0,
  });
}
