import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Header } from "../components/Header";
import { useWatchHistory } from "../hooks/useWatchHistory";
import { useWatchContentQuery } from "../hooks/useWatchContentQuery";
import { parseContentId } from "../data/content";

// --- Provider system ---

interface Provider {
  id: string;
  name: string;
  buildUrl: (tmdbId: number, type: "movie" | "tv", season?: string, episode?: string) => string;
}

const PROVIDERS: Provider[] = [
  {
    id: "vidlink",
    name: "VidLink",
    buildUrl: (tmdbId, type, season, episode) => {
      if (type === "movie") {
        return `https://vidlink.pro/movie/${tmdbId}?primaryColor=f6821f&title=false&poster=true&autoplay=true&nextbutton=false&muted=0&quality=highest`;
      }
      return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=f6821f&title=false&poster=true&autoplay=true&nextbutton=false&muted=0&quality=highest`;
    },
  },
  {
    id: "vidfast",
    name: "VidFast",
    buildUrl: (tmdbId, type, season, episode) => {
      if (type === "movie") {
        return `https://vidfast.pro/movie/${tmdbId}?autoPlay=true&title=false&poster=true&theme=f6821f&nextButton=false&autoNext=false&muted=0&quality=highest`;
      }
      return `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}?autoPlay=true&title=false&poster=true&theme=f6821f&nextButton=false&autoNext=false&muted=0&quality=highest`;
    },
  },
  {
    id: "111movies",
    name: "111Movies",
    buildUrl: (tmdbId, type, season, episode) => {
      if (type === "movie") {
        return `https://111movies.net/movie/${tmdbId}?autoplay=1&muted=0&quality=highest`;
      }
      return `https://111movies.net/tv/${tmdbId}/${season}/${episode}?autoplay=1&muted=0&quality=highest`;
    },
  },
  {
    id: "videasy",
    name: "Videasy",
    buildUrl: (tmdbId, type, season, episode) => {
      if (type === "movie") {
        return `https://player.videasy.net/movie/${tmdbId}?nextEpisode=false&autoplayNextEpisode=false&episodeSelector=false&overlay=true&color=f6821f&muted=0&quality=highest`;
      }
      return `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}?nextEpisode=false&autoplayNextEpisode=false&episodeSelector=false&overlay=true&color=f6821f&muted=0&quality=highest`;
    },
  },
];

const DEFAULT_PROVIDER = PROVIDERS[0].id;

// --- Page ---

export default function WatchPage() {
  const { contentId, season, episode } = useParams<{
    contentId: string;
    season?: string;
    episode?: string;
  }>();
  const navigate = useNavigate();
  const { addToHistory, getEntry } = useWatchHistory();

  const historyEntry = contentId ? getEntry(contentId) : null;
  const [activeProvider, setActiveProvider] = useState(() => {
    const stored = historyEntry?.provider;
    return stored && PROVIDERS.some((p) => p.id === stored) ? stored : DEFAULT_PROVIDER;
  });

  useEffect(() => {
    const stored = historyEntry?.provider;
    if (stored && PROVIDERS.some((p) => p.id === stored)) setActiveProvider(stored);
  }, [historyEntry?.provider]);

  const switchProvider = (id: string) => {
    setActiveProvider(id);
    if (contentId) addToHistory(contentId, { season, episode, provider: id });
  };

  // Parse route params
  const parsed = contentId ? parseContentId(contentId) : null;
  const isValid =
    parsed && (parsed.type === "movie" || (parsed.type === "tv" && season && episode));

  // Build iframe URL from active provider
  const provider = PROVIDERS.find((p) => p.id === activeProvider) ?? PROVIDERS[0];
  const iframeUrl = isValid
    ? provider.buildUrl(parsed!.tmdbId, parsed!.type, season, episode)
    : null;

  // Fetch content metadata via TanStack Query
  const { data: content } = useWatchContentQuery(isValid ? contentId : undefined);

  // Save to watch history when content is loaded
  useEffect(() => {
    if (content?.id) addToHistory(content.id, { season, episode });
  }, [content?.id, season, episode, addToHistory]);

  // Redirect if invalid route
  useEffect(() => {
    if (!isValid) navigate("/");
  }, [isValid, navigate]);

  if (!isValid || !iframeUrl) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header
        title={content?.title}
        subtitle={season && episode ? `S${season} E${episode}` : undefined}
      />

      <main className="pt-14">
        {/* Top bar */}
        <div className="bg-[#111111] border-b border-[#1f1f1f]">
          <div className="max-w-6xl mx-auto px-6 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-4">
            {/* Left: Back button */}
            <button
              onClick={() => navigate(`/title/${contentId}`)}
              className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>

            {/* Center: Provider selector */}
            <div className="flex items-center justify-center gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => switchProvider(p.id)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      activeProvider === p.id
                        ? "bg-[#151515] border border-[#f6821f] text-[#f6821f]"
                        : "bg-[#151515] border border-[#2a2a2a] text-[#a1a1aa] hover:border-[#3a3a3a] hover:text-white"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

            {/* Right: Next Episode button */}
            {season && episode && (
              <button
                onClick={() =>
                  navigate(`/watch/${contentId}/${season}/${Number(episode) + 1}`)
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#151515] border border-[#2a2a2a] text-[#a1a1aa] hover:border-[#f6821f] hover:text-[#f6821f] transition-colors"
              >
                <span>Next Episode</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Empty spacer when no next episode button */}
            {!(season && episode) && <div />}
          </div>
        </div>

        {/* Iframe container */}
        <div className="w-full" style={{ height: "calc(100vh - 112px)" }}>
          <iframe
            key={activeProvider}
            src={iframeUrl}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen"
            referrerPolicy="origin"
          />
        </div>
      </main>
    </div>
  );
}
