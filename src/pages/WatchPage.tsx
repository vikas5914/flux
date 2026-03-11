import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Header } from "../components/Header";
import {
  useWatchHistory,
  type WatchHistoryEntry,
  type WatchHistoryUpdate,
} from "../hooks/useWatchHistory";
import { useWatchContentQuery } from "../hooks/useWatchContentQuery";
import { parseContentId } from "../data/content";

// --- Provider system ---

interface Provider {
  id: string;
  name: string;
  /** Origins that postMessage events can come from for this provider */
  origins: string[];
  buildUrl: (
    tmdbId: number,
    type: "movie" | "tv",
    season?: string,
    episode?: string,
    startAt?: number,
  ) => string;
}

const PROVIDERS: Provider[] = [
  {
    id: "vidlink",
    name: "VidLink",
    origins: ["https://vidlink.pro"],
    buildUrl: (tmdbId, type, season, episode, startAt) => {
      const base =
        type === "movie"
          ? `https://vidlink.pro/movie/${tmdbId}`
          : `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`;
      const params = new URLSearchParams({
        primaryColor: "f6821f",
        title: "false",
        poster: "true",
        autoplay: "false",
        nextbutton: "false",
        muted: "false",
        quality: "highest",
      });
      if (startAt && startAt > 0) params.set("startAt", String(Math.floor(startAt)));
      return `${base}?${params}`;
    },
  },
  {
    id: "vidfast",
    name: "VidFast",
    origins: [
      "https://vidfast.pro",
      "https://vidfast.in",
      "https://vidfast.io",
      "https://vidfast.me",
      "https://vidfast.net",
      "https://vidfast.pm",
      "https://vidfast.xyz",
    ],
    buildUrl: (tmdbId, type, season, episode, startAt) => {
      const base =
        type === "movie"
          ? `https://vidfast.pro/movie/${tmdbId}`
          : `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}`;
      const params = new URLSearchParams({
        autoPlay: "false",
        title: "false",
        poster: "true",
        theme: "f6821f",
        nextButton: "false",
        autoNext: "false",
        muted: "false",
        quality: "highest",
      });
      if (startAt && startAt > 0) params.set("startAt", String(Math.floor(startAt)));
      return `${base}?${params}`;
    },
  },
  {
    id: "111movies",
    name: "111Movies",
    origins: ["https://111movies.net"],
    buildUrl: (tmdbId, type, season, episode) => {
      if (type === "movie") {
        return `https://111movies.net/movie/${tmdbId}?autoplay=false&muted=false&quality=highest`;
      }
      return `https://111movies.net/tv/${tmdbId}/${season}/${episode}?autoplay=false&muted=false&quality=highest`;
    },
  },
  {
    id: "videasy",
    name: "Videasy",
    origins: ["https://player.videasy.net"],
    buildUrl: (tmdbId, type, season, episode, startAt) => {
      const base =
        type === "movie"
          ? `https://player.videasy.net/movie/${tmdbId}`
          : `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`;
      const params = new URLSearchParams({
        nextEpisode: "false",
        autoplayNextEpisode: "false",
        autoplay: "false",
        episodeSelector: "false",
        overlay: "true",
        color: "f6821f",
      });
      if (startAt && startAt > 0) params.set("progress", String(Math.floor(startAt)));
      return `${base}?${params}`;
    },
  },
];

const DEFAULT_PROVIDER = PROVIDERS[0].id;

/** Minimum seconds before we consider saving progress meaningful */
const MIN_SAVE_THRESHOLD = 5;
/** Debounce interval for saving progress (ms) */
const SAVE_DEBOUNCE_MS = 10_000;

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readProgressFromPayload(payload: Record<string, unknown>) {
  const watched =
    toFiniteNumber(payload.timestamp) ??
    toFiniteNumber(payload.currentTime) ??
    toFiniteNumber(payload.time) ??
    toFiniteNumber(payload.watched) ??
    toFiniteNumber(payload.position);
  const duration =
    toFiniteNumber(payload.duration) ??
    toFiniteNumber(payload.totalDuration) ??
    toFiniteNumber(payload.length);

  if (watched === null || duration === null) return null;
  return { watchedTime: watched, duration };
}

function resolveProviderId(providerId?: string) {
  return providerId && PROVIDERS.some((provider) => provider.id === providerId)
    ? providerId
    : DEFAULT_PROVIDER;
}

function getResumeTimeForEntry(
  entry: WatchHistoryEntry | null,
  type: "movie" | "tv",
  season?: string,
  episode?: string,
) {
  if (!entry?.watchedTime || entry.watchedTime <= 0) return undefined;
  if (type === "movie") return entry.watchedTime;
  return entry.season === season && entry.episode === episode ? entry.watchedTime : undefined;
}

// --- Page ---

function PlayerLoadingShell({ label }: { label: string }) {
  return (
    <main className="pt-14">
      <div className="relative w-full h-[calc(100vh-56px-52px)] sm:h-[calc(100vh-112px)]">
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/72 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full border border-[#2a2a2a] bg-[#111111]/95 px-4 py-2 text-sm text-[#d4d4d8]">
            <span className="w-4 h-4 rounded-full border border-[#f6821f] border-t-transparent animate-spin" />
            <span>{label}</span>
          </div>
        </div>
      </div>
    </main>
  );
}

interface WatchPlayerSessionProps {
  contentId: string;
  season?: string;
  episode?: string;
  nextEpisodeHref: string | null;
  type: "movie" | "tv";
  tmdbId: number;
  initialProvider: string;
  initialResumeAt?: number;
  latestHistoryEntry: WatchHistoryEntry | null;
  addToHistory: (contentId: string, opts?: WatchHistoryUpdate) => void;
}

function WatchPlayerSession({
  contentId,
  season,
  episode,
  nextEpisodeHref,
  type,
  tmdbId,
  initialProvider,
  initialResumeAt,
  latestHistoryEntry,
  addToHistory,
}: WatchPlayerSessionProps) {
  const [activeProvider, setActiveProvider] = useState(initialProvider);
  const [resumeAtForLoad, setResumeAtForLoad] = useState(initialResumeAt);
  const [loadedIframeKey, setLoadedIframeKey] = useState<string | null>(null);
  const iframeKey = `${contentId}-${activeProvider}-${season ?? ""}-${episode ?? ""}`;
  const isPlayerLoading = loadedIframeKey !== iframeKey;
  const detailsHref = `/title/${contentId}`;

  // --- Playback progress tracking ---
  const progressRef = useRef<{ watchedTime: number; duration: number }>({
    watchedTime: 0,
    duration: 0,
  });
  const lastSaveRef = useRef<number>(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const switchProvider = (id: string) => {
    if (id === activeProvider || isPlayerLoading) return;

    setResumeAtForLoad(getResumeTimeForEntry(latestHistoryEntry, type, season, episode));
    setActiveProvider(id);
    setLoadedIframeKey(null);
    addToHistory(contentId, { season, episode, provider: id });
  };

  // Build iframe URL from active provider, including startAt for resume
  const provider = PROVIDERS.find((item) => item.id === activeProvider) ?? PROVIDERS[0];
  const iframeUrl = provider.buildUrl(tmdbId, type, season, episode, resumeAtForLoad);

  // --- Save progress helper (debounced) ---
  const saveProgress = useCallback(
    (watchedTime: number, duration: number, options?: { force?: boolean }) => {
      if (!contentId) return;
      if (!options?.force && watchedTime < MIN_SAVE_THRESHOLD) return;

      // Don't save if we're at the very end (within 30s of the end = likely finished)
      const isFinished = duration > 0 && duration - watchedTime < 30;

      addToHistory(contentId, {
        season,
        episode,
        watchedTime: isFinished ? 0 : watchedTime,
        duration,
      });
      lastSaveRef.current = Date.now();
    },
    [contentId, season, episode, addToHistory],
  );

  // --- Listen for postMessage events from iframe providers ---
  // VidLink + VidFast: MEDIA_DATA + PLAYER_EVENT (object format)
  // Videasy: JSON string with { timestamp, duration, progress, ... }
  // 111Movies: no postMessage support
  useEffect(() => {
    const currentProvider = PROVIDERS.find((p) => p.id === activeProvider);
    if (!currentProvider) return;

    const handleMessage = (event: MessageEvent) => {
      // Validate origin against provider's allowed origins
      if (!currentProvider.origins.includes(event.origin)) return;

      const raw = event.data;
      if (!raw) return;

      // --- Videasy format: JSON string with { timestamp, duration, progress, ... } ---
      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            const progress = readProgressFromPayload(parsed as Record<string, unknown>);
            if (!progress) return;
            const watched = progress.watchedTime;
            const dur = progress.duration;
            progressRef.current = { watchedTime: watched, duration: dur };

            // Debounced save
            const now = Date.now();
            if (now - lastSaveRef.current >= SAVE_DEBOUNCE_MS) {
              saveProgress(watched, dur);
            } else if (!saveTimerRef.current) {
              saveTimerRef.current = setTimeout(
                () => {
                  saveTimerRef.current = null;
                  const { watchedTime, duration } = progressRef.current;
                  saveProgress(watchedTime, duration);
                },
                SAVE_DEBOUNCE_MS - (now - lastSaveRef.current),
              );
            }
          }
        } catch {
          // Not valid JSON, ignore
        }
        return;
      }

      // --- VidLink / VidFast format: object with { type, data } ---
      if (typeof raw !== "object") return;
      const data = raw;

      // Handle MEDIA_DATA event (VidLink + VidFast — contains full progress info)
      if (data.type === "MEDIA_DATA" && data.data) {
        const mediaData = data.data;
        // mediaData is keyed by TMDB ID, iterate to find progress
        const keys = Object.keys(mediaData);
        for (const key of keys) {
          const item = mediaData[key];
          if (item?.progress) {
            const watched = toFiniteNumber(item.progress.watched);
            const dur = toFiniteNumber(item.progress.duration);
            if (watched !== null && dur !== null) {
              progressRef.current = { watchedTime: watched, duration: dur };

              // Debounced save — only save every SAVE_DEBOUNCE_MS
              const now = Date.now();
              if (now - lastSaveRef.current >= SAVE_DEBOUNCE_MS) {
                saveProgress(watched, dur);
              } else if (!saveTimerRef.current) {
                saveTimerRef.current = setTimeout(
                  () => {
                    saveTimerRef.current = null;
                    const { watchedTime, duration } = progressRef.current;
                    saveProgress(watchedTime, duration);
                  },
                  SAVE_DEBOUNCE_MS - (now - lastSaveRef.current),
                );
              }
            }
          }
        }
      }

      // Handle PLAYER_EVENT (VidLink + VidFast — timeupdate, pause, seeked, ended)
      if (data.type === "PLAYER_EVENT" && data.data) {
        const { event: eventType, currentTime, duration: dur } = data.data;
        const watched = toFiniteNumber(currentTime);
        const duration = toFiniteNumber(dur);
        if (watched !== null && duration !== null) {
          progressRef.current = { watchedTime: watched, duration };

          // Save immediately on pause, seeked, or ended
          if (eventType === "pause" || eventType === "seeked" || eventType === "ended") {
            if (saveTimerRef.current) {
              clearTimeout(saveTimerRef.current);
              saveTimerRef.current = null;
            }
            saveProgress(eventType === "ended" ? 0 : watched, duration, {
              force: eventType === "ended",
            });
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      // Flush any pending save on unmount
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      const { watchedTime, duration } = progressRef.current;
      if (watchedTime >= MIN_SAVE_THRESHOLD) {
        saveProgress(watchedTime, duration);
      }
    };
  }, [activeProvider, saveProgress]);

  return (
    <main className="pt-14">
      {/* Top bar — hidden on mobile, visible on sm+ */}
      <div className="hidden sm:block bg-[#111111] border-b border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto px-6 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-4">
          <Link
            to={detailsHref}
            className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>

          <div className="flex items-center justify-center gap-2">
            {PROVIDERS.map((item) => (
              <button
                key={item.id}
                onClick={() => switchProvider(item.id)}
                disabled={isPlayerLoading || activeProvider === item.id}
                aria-busy={isPlayerLoading && activeProvider === item.id}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeProvider === item.id
                    ? "bg-[#151515] border border-[#f6821f] text-[#f6821f]"
                    : "bg-[#151515] border border-[#2a2a2a] text-[#a1a1aa] hover:border-[#3a3a3a] hover:text-white"
                } disabled:opacity-70 disabled:cursor-wait disabled:hover:border-[#2a2a2a] disabled:hover:text-[#a1a1aa]`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {isPlayerLoading && activeProvider === item.id ? (
                    <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                  ) : null}
                  <span>{item.name}</span>
                </span>
              </button>
            ))}
          </div>

          {nextEpisodeHref ? (
            <Link
              to={nextEpisodeHref}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#151515] border border-[#2a2a2a] text-[#a1a1aa] hover:border-[#f6821f] hover:text-[#f6821f] transition-colors"
            >
              <span>Next Episode</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* Iframe container — leave room for bottom bar on mobile, top bar on sm+ */}
      <div className="relative w-full h-[calc(100vh-56px-52px)] sm:h-[calc(100vh-112px)]">
        <iframe
          key={iframeKey}
          src={iframeUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen"
          referrerPolicy="origin"
          onLoad={() => setLoadedIframeKey(iframeKey)}
        />
        {isPlayerLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/72 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-full border border-[#2a2a2a] bg-[#111111]/95 px-4 py-2 text-sm text-[#d4d4d8]">
              <span className="w-4 h-4 rounded-full border border-[#f6821f] border-t-transparent animate-spin" />
              <span>Loading player...</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar — mobile only */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 sm:hidden bg-[#111111] border-t border-[#1f1f1f]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <Link
            to={detailsHref}
            className="flex items-center justify-center w-9 h-9 rounded bg-[#151515] border border-[#2a2a2a] text-[#a1a1aa] active:border-[#3a3a3a] active:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-1.5 flex-1 justify-center">
            {PROVIDERS.map((item) => (
              <button
                key={item.id}
                onClick={() => switchProvider(item.id)}
                disabled={isPlayerLoading || activeProvider === item.id}
                aria-busy={isPlayerLoading && activeProvider === item.id}
                className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeProvider === item.id
                    ? "bg-[#151515] border border-[#f6821f] text-[#f6821f]"
                    : "bg-[#151515] border border-[#2a2a2a] text-[#a1a1aa] active:border-[#3a3a3a] active:text-white"
                } disabled:opacity-70 disabled:cursor-wait`}
              >
                <span className="inline-flex items-center gap-1">
                  {isPlayerLoading && activeProvider === item.id ? (
                    <span className="w-2.5 h-2.5 rounded-full border border-current border-t-transparent animate-spin" />
                  ) : null}
                  <span>{item.name}</span>
                </span>
              </button>
            ))}
          </div>

          {nextEpisodeHref ? (
            <Link
              to={nextEpisodeHref}
              className="flex items-center justify-center w-9 h-9 rounded bg-[#151515] border border-[#2a2a2a] text-[#a1a1aa] active:border-[#f6821f] active:text-[#f6821f] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </div>
    </main>
  );
}

export default function WatchPage() {
  const { contentId, season, episode } = useParams<{
    contentId: string;
    season?: string;
    episode?: string;
  }>();
  const navigate = useNavigate();
  const { addToHistory, getEntry, isReady } = useWatchHistory();

  const parsed = contentId ? parseContentId(contentId) : null;
  const isValid =
    parsed && (parsed.type === "movie" || (parsed.type === "tv" && season && episode));
  const parsedType = parsed?.type;
  const parsedTmdbId = parsed?.tmdbId;
  const routeKey = `${contentId ?? ""}-${season ?? ""}-${episode ?? ""}`;
  const historyEntry = contentId ? getEntry(contentId) : null;
  const initialProvider = resolveProviderId(historyEntry?.provider);
  const initialResumeAt =
    parsedType && historyEntry
      ? getResumeTimeForEntry(historyEntry, parsedType, season, episode)
      : undefined;
  const { data: content } = useWatchContentQuery(isValid ? contentId : undefined);
  const currentSeasonNumber = toFiniteNumber(season);
  const currentEpisodeNumber = toFiniteNumber(episode);
  const currentSeason =
    currentSeasonNumber != null
      ? content?.seasons?.find((item) => item.seasonNumber === currentSeasonNumber)
      : undefined;
  const nextEpisodeHref =
    contentId &&
    currentSeasonNumber != null &&
    currentEpisodeNumber != null &&
    currentSeason &&
    currentEpisodeNumber < (currentSeason.episodeCount ?? 0)
      ? `/watch/${contentId}/${currentSeasonNumber}/${currentEpisodeNumber + 1}`
      : null;

  useEffect(() => {
    if (!isValid) navigate("/");
  }, [isValid, navigate]);

  useEffect(() => {
    if (content?.id) addToHistory(content.id, { season, episode });
  }, [content?.id, season, episode, addToHistory]);

  if (!isValid || !contentId || !parsedType || parsedTmdbId === undefined) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header
        title={content?.title}
        subtitle={season && episode ? `S${season} E${episode}` : undefined}
      />

      {isReady ? (
        <WatchPlayerSession
          key={routeKey}
          contentId={contentId}
          season={season}
          episode={episode}
          nextEpisodeHref={nextEpisodeHref}
          type={parsedType}
          tmdbId={parsedTmdbId}
          initialProvider={initialProvider}
          initialResumeAt={initialResumeAt}
          latestHistoryEntry={historyEntry}
          addToHistory={addToHistory}
        />
      ) : (
        <PlayerLoadingShell label="Preparing player..." />
      )}
    </div>
  );
}
