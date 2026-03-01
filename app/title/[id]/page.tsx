'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Play, Clock, Star, ChevronDown } from 'lucide-react';
import { Header } from '../../components/Header';
import { Spinner } from '../../components/Spinner';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { useContentDetailsQuery } from '../../hooks/useContentDetailsQuery';
import { useSeasonQuery } from '../../hooks/useSeasonQuery';
import { parseContentId } from '../../data/content';

export default function DetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { updateProgress } = useWatchHistory();
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null);
  const [userSelectedSeason, setUserSelectedSeason] = useState<number | null>(null);

  const parsed = parseContentId(id);
  const { data: details, isLoading, isError } = useContentDetailsQuery(id);

  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  // Derive season: user selection takes priority, otherwise use initial from query
  const seasonToFetch = userSelectedSeason ?? details?.initialSeason ?? 1;
  const { data: seasonContent, isFetching: isSeasonLoading } = useSeasonQuery(
    details?.tvShow,
    parsed?.tmdbId ?? 0,
    seasonToFetch,
  );

  // Use season-specific content for TV, otherwise the initial details content
  const content = details?.tvShow && seasonContent ? seasonContent : details?.content ?? null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !content) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-[#a1a1aa]">Content not found</p>
      </div>
    );
  }

  const handleSeasonChange = (seasonNumber: number) => {
    if (seasonNumber === userSelectedSeason) return;
    setUserSelectedSeason(seasonNumber);
  };

  const handlePlay = (episodeId?: string) => {
    updateProgress(content, 0, episodeId);
    if (episodeId) {
      // Parse season and episode from format "s{season}e{episode}"
      const match = episodeId.match(/^s(\d+)e(\d+)$/);
      if (match) {
        router.push(`/watch/${content.id}/${match[1]}/${match[2]}`);
        return;
      }
    }
    // Movie or fallback
    router.push(`/watch/${content.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      
      <main className="pt-14">
        <div className="relative h-[50vh] min-h-[400px]">
          <Image
            src={content.backdrop}
            alt={content.title}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
          
          <button
            onClick={() => router.back()}
            className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
        </div>

        <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="shrink-0 hidden md:block">
              <Image
                src={content.poster}
                alt={content.title}
                width={192}
                height={288}
                className="w-48 h-72 object-cover rounded"
                unoptimized
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] uppercase tracking-wider text-[#f6821f] bg-[#151515] border border-[#2a2a2a] px-1.5 py-0.5 rounded">
                  {content.type}
                </span>
                <span className="text-xs text-[#a1a1aa]">{content.year}</span>
                {content.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-[#f6821f] fill-[#f6821f]" />
                    <span className="text-xs text-[#a1a1aa]">{content.rating}</span>
                  </div>
                )}
              </div>

              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">
                {content.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                {content.duration && (
                  <div className="flex items-center gap-1.5 text-[#a1a1aa]">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{content.duration}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {content.genres.map((genre) => (
                    <span
                      key={genre}
                      className="text-xs text-[#a1a1aa] bg-[#111111] border border-[#1f1f1f] px-2 py-1 rounded"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-[#a1a1aa] text-base leading-relaxed mb-8 max-w-2xl">
                {content.synopsis}
              </p>

              <button
                onClick={() => handlePlay(content.type === 'series' ? (content.episodes?.[0]?.id) : undefined)}
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded text-sm font-medium hover:bg-[#e5e5e5] transition-colors"
              >
                <Play className="w-4 h-4 fill-black" />
                {content.type === 'series' ? 'Play First Episode' : 'Play Now'}
              </button>
            </div>
          </div>

          {content.cast.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-6 bg-[#f6821f]" />
                <h2 className="font-mono text-xs uppercase tracking-widest text-[#f6821f]">
                  Cast
                </h2>
              </div>
              <div className="flex flex-wrap gap-6">
                {content.cast.map((member) => (
                  <div key={member.name}>
                    <p className="text-sm font-medium text-white">{member.name}</p>
                    <p className="text-xs text-[#71717a] mt-0.5">{member.role}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {content.type === 'series' && content.episodes && content.episodes.length > 0 && (
            <section className="mt-12 pb-32">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-px w-6 bg-[#f6821f]" />
                  <h2 className="font-mono text-xs uppercase tracking-widest text-[#f6821f]">
                    Episodes
                  </h2>
                </div>

                {content.seasons && content.seasons.length > 1 && (
                  <div className="relative">
                    <select
                      value={seasonToFetch}
                      onChange={(e) => handleSeasonChange(Number(e.target.value))}
                      disabled={isSeasonLoading}
                      className="appearance-none bg-[#151515] border border-[#2a2a2a] text-white text-sm rounded px-3 py-1.5 pr-8 cursor-pointer hover:border-[#3a3a3a] transition-colors focus:outline-none focus:border-[#f6821f] disabled:opacity-50"
                    >
                      {content.seasons.map((s) => (
                        <option key={s.seasonNumber} value={s.seasonNumber}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717a] pointer-events-none" />
                  </div>
                )}
              </div>
              
              {isSeasonLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#f6821f] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {content.episodes.map((episode, index) => (
                    <button
                      key={episode.id}
                      onClick={() => {
                        setSelectedEpisode(episode.id);
                        handlePlay(episode.id);
                      }}
                      className={`w-full flex items-center gap-4 p-4 text-left transition-colors rounded ${
                        selectedEpisode === episode.id
                          ? 'bg-[#151515] border border-[#2a2a2a]'
                          : 'bg-[#0f0f0f] border border-[#1f1f1f] hover:bg-[#151515] hover:border-[#2a2a2a]'
                      }`}
                    >
                      <div className="shrink-0 w-8 text-center">
                        <span className="text-sm text-[#71717a]">{index + 1}</span>
                      </div>
                      <div className="shrink-0 relative w-32 h-18 overflow-hidden rounded">
                        <Image
                          src={episode.thumbnail}
                          alt={episode.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{episode.title}</p>
                        <p className="text-xs text-[#71717a] mt-1 line-clamp-2">{episode.synopsis}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-[#71717a]">{episode.duration}</span>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
