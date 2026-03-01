'use client';

import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchMulti } from '../lib/tmdb';
import { mapSearchResultToContent } from '../data/content';
import { tmdbKeys } from '../lib/query-keys';

function useDebouncedValue(value: string, delay = 300): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function useSearchQuery() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const trimmed = debouncedQuery.trim();

  const { data: results = [], isLoading, isFetching } = useQuery({
    queryKey: tmdbKeys.searchMulti(trimmed),
    queryFn: async () => {
      const data = await searchMulti(trimmed);
      return data.results
        .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
        .slice(0, 10)
        .map(mapSearchResultToContent);
    },
    enabled: trimmed.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  return {
    query,
    setQuery,
    results,
    isLoading: trimmed.length > 0 && (isLoading || isFetching),
  };
}
