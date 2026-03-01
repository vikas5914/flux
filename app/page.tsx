'use client';

import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { ContinueWatching } from './components/ContinueWatching';
import { TitleCard } from './components/TitleCard';
import { getTrendingMovies, getTrendingTV, getTrendingAll } from './lib/tmdb';
import { mapSearchResultToContent, type Content } from './data/content';
import { posterUrl, extractYear } from './lib/tmdb';

export default function HomePage() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [trending, setTrending] = useState<Content[]>([]);
  const [movies, setMovies] = useState<Content[]>([]);
  const [series, setSeries] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [trendingData, moviesData, tvData] = await Promise.all([
          getTrendingAll(),
          getTrendingMovies(),
          getTrendingTV(),
        ]);

        setTrending(
          trendingData.results
            .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
            .slice(0, 6)
            .map(mapSearchResultToContent)
        );

        setMovies(
          moviesData.results.slice(0, 6).map((m) => ({
            id: `movie-${m.id}`,
            title: m.title,
            type: 'movie' as const,
            year: extractYear(m.release_date),
            rating: Math.round(m.vote_average * 10) / 10,
            genres: [],
            synopsis: m.overview || '',
            poster: posterUrl(m.poster_path),
            backdrop: '',
            cast: [],
          }))
        );

        setSeries(
          tvData.results.slice(0, 6).map((t) => ({
            id: `tv-${t.id}`,
            title: t.name,
            type: 'series' as const,
            year: extractYear(t.first_air_date),
            rating: Math.round(t.vote_average * 10) / 10,
            genres: [],
            synopsis: t.overview || '',
            poster: posterUrl(t.poster_path),
            backdrop: '',
            cast: [],
          }))
        );
      } catch (err) {
        console.error('Failed to fetch TMDB data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      
      <main className="pt-14">
        <section className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-32">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white text-center mb-4">
            Watch something
          </h1>
          <p className="text-lg text-[#a1a1aa] text-center mb-12 max-w-md">
            Search for movies and series to start watching instantly.
          </p>
          
          <SearchBar onSearchFocus={setIsSearchFocused} />
        </section>

        {!isSearchFocused && (
          <div className="max-w-6xl mx-auto px-6 pb-32">
            <ContinueWatching />

            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#f6821f] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
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

                <section className="mt-16">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px w-6 bg-[#f6821f]" />
                    <h2 className="font-mono text-xs uppercase tracking-widest text-[#f6821f]">
                      Popular Movies
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {movies.map((content) => (
                      <TitleCard key={content.id} content={content} />
                    ))}
                  </div>
                </section>

                <section className="mt-16">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px w-6 bg-[#f6821f]" />
                    <h2 className="font-mono text-xs uppercase tracking-widest text-[#f6821f]">
                      Popular Series
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {series.map((content) => (
                      <TitleCard key={content.id} content={content} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
