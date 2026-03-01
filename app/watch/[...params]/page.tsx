'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Header } from '../../components/Header';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { useWatchContentQuery } from '../../hooks/useWatchContentQuery';
import { parseContentId } from '../../data/content';

// --- Provider system ---

interface Provider {
  id: string;
  name: string;
  buildUrl: (tmdbId: number, type: 'movie' | 'tv', season?: string, episode?: string) => string;
}

const PROVIDERS: Provider[] = [
  {
    id: 'vidlink',
    name: 'VidLink',
    buildUrl: (tmdbId, type, season, episode) => {
      if (type === 'movie') {
        return `https://vidlink.pro/movie/${tmdbId}?autoplay=1&muted=0&quality=highest`;
      }
      return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?autoplay=1&muted=0&quality=highest`;
    },
  },
  {
    id: 'vidfast',
    name: 'VidFast',
    buildUrl: (tmdbId, type, season, episode) => {
      if (type === 'movie') {
        return `https://vidfast.pro/movie/${tmdbId}?autoplay=1&muted=0&quality=highest`;
      }
      return `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}?autoplay=1&muted=0&quality=highest`;
    },
  },
  {
    id: '111movies',
    name: '111Movies',
    buildUrl: (tmdbId, type, season, episode) => {
      if (type === 'movie') {
        return `https://111movies.net/movie/${tmdbId}?autoplay=1&muted=0&quality=highest`;
      }
      return `https://111movies.net/tv/${tmdbId}/${season}/${episode}?autoplay=1&muted=0&quality=highest`;
    },
  },
  {
    id: 'videasy',
    name: 'Videasy',
    buildUrl: (tmdbId, type, season, episode) => {
      if (type === 'movie') {
        return `https://player.videasy.net/movie/${tmdbId}?autoplay=1&muted=0&quality=highest`;
      }
      return `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}?autoplay=1&muted=0&quality=highest`;
    },
  },
];

const DEFAULT_PROVIDER = PROVIDERS[0].id;

// --- Page ---

export default function WatchPage() {
  const params = useParams<{ params: string[] }>();
  const segments = params.params;
  const router = useRouter();
  const { updateProgress } = useWatchHistory();
  const [activeProvider, setActiveProvider] = useState(DEFAULT_PROVIDER);

  // Parse route segments
  const firstParam = segments?.[0];
  const parsed = firstParam ? parseContentId(firstParam) : null;
  const season = segments?.length >= 3 ? segments[1] : undefined;
  const episode = segments?.length >= 3 ? segments[2] : undefined;
  const isValid = parsed && (parsed.type === 'movie' || (parsed.type === 'tv' && season && episode));

  // Build iframe URL from active provider
  const provider = PROVIDERS.find((p) => p.id === activeProvider) ?? PROVIDERS[0];
  const iframeUrl = isValid
    ? provider.buildUrl(parsed!.tmdbId, parsed!.type, season, episode)
    : null;

  // Fetch content metadata via TanStack Query
  const { data: content } = useWatchContentQuery(isValid ? firstParam : undefined);

  // Track watch progress once content is loaded
  useEffect(() => {
    if (!content) return;
    const episodeId = season && episode ? `s${season}e${episode}` : undefined;
    updateProgress(content, 0, episodeId);
  }, [content?.id]);

  // Redirect if invalid route
  useEffect(() => {
    if (!isValid) router.push('/');
  }, [isValid, router]);

  if (!isValid || !iframeUrl) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />

      <main className="pt-14">
        {/* Top bar */}
        <div className="bg-[#111111] border-b border-[#1f1f1f]">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>

              {content && (
                <div className="flex items-center gap-2">
                  <span className="text-[#2a2a2a]">|</span>
                  <h1 className="text-sm font-medium text-white truncate">
                    {content.title}
                  </h1>
                  {season && episode && (
                    <span className="text-xs text-[#71717a]">
                      S{season} E{episode}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Provider selector */}
            <div className="flex items-center gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProvider(p.id)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    activeProvider === p.id
                      ? 'bg-[#151515] border border-[#f6821f] text-[#f6821f]'
                      : 'bg-[#151515] border border-[#2a2a2a] text-[#a1a1aa] hover:border-[#3a3a3a] hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Iframe container */}
        <div className="w-full" style={{ height: 'calc(100vh - 112px)' }}>
          <iframe
            key={activeProvider}
            src={iframeUrl}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="origin"
          />
        </div>
      </main>
    </div>
  );
}
