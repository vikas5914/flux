'use client';

import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { ContinueWatching } from './components/ContinueWatching';
import { TitleCard } from './components/TitleCard';
import { getTrendingAll } from './lib/tmdb';
import { mapSearchResultToContent, type Content } from './data/content';
import { useSearch } from './hooks/useSearch';

export default function HomePage() {
  const { query, setQuery, results, isLoading: isSearchLoading } = useSearch();
  const [trending, setTrending] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const trendingData = await getTrendingAll();

        setTrending(
          trendingData.results
            .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
            .slice(0, 12)
            .map(mapSearchResultToContent)
        );
      } catch (err) {
        console.error('Failed to fetch TMDB data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      
      <main className="pt-14">
        <section className="min-h-[40vh] flex flex-col items-center justify-center px-6 py-24">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white text-center mb-4">
            Watch something
          </h1>
          <p className="text-lg text-[#a1a1aa] text-center mb-12 max-w-md">
            Search for movies and series to start watching instantly.
          </p>
          
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            isLoading={isSearchLoading}
          />
        </section>

        <div className="max-w-6xl mx-auto px-6 pb-32">
          {hasQuery ? (
            <>
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-6 bg-[#f6821f]" />
                  <h2 className="font-mono text-xs uppercase tracking-widest text-[#f6821f]">
                    Search Results
                  </h2>
                  {!isSearchLoading && results.length > 0 && (
                    <span className="text-xs text-[#71717a]">
                      {results.length} found
                    </span>
                  )}
                </div>

                {isSearchLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-[#f6821f] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : results.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {results.map((content) => (
                      <TitleCard key={content.id} content={content} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-[#a1a1aa] text-sm">No results found for &ldquo;{query}&rdquo;</p>
                    <p className="text-[#71717a] text-xs mt-1">Try a different search term</p>
                  </div>
                )}
              </section>
            </>
          ) : (
            <>
              <ContinueWatching />

              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-2 border-[#f6821f] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <section className="mt-16">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px w-6 bg-[#f6821f]" />
                    <h2 className="font-mono text-xs uppercase tracking-widest text-[#f6821f]">
                      Trending Now
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {trending.map((content) => (
                      <TitleCard key={content.id} content={content} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
