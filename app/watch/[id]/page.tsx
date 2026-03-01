'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useWatchHistory } from '../../hooks/useSearch';
import { VideoPlayer } from '../../components/VideoPlayer';
import { parseContentId, mapMovieToContent, mapTVToContent, type Content } from '../../data/content';
import { getMovieDetails, getTVDetails } from '../../lib/tmdb';

export default function PlayerPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const searchParams = useSearchParams();
  const episodeId = searchParams.get('episode');
  const router = useRouter();
  const { updateProgress } = useWatchHistory();
  const [content, setContent] = useState<Content | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      const parsed = parseContentId(id);
      if (!parsed) {
        router.push('/');
        return;
      }

      try {
        if (parsed.type === 'movie') {
          const movie = await getMovieDetails(parsed.tmdbId);
          setContent(mapMovieToContent(movie));
        } else {
          const tv = await getTVDetails(parsed.tmdbId);
          setContent(mapTVToContent(tv));
        }
      } catch {
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f6821f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!content || !isPlaying) {
    router.push(`/title/${id}`);
    return null;
  }

  const episode = content.episodes?.find((e) => e.id === episodeId);
  const subtitle = episode?.title;

  const handleProgress = (progress: number) => {
    updateProgress(content, progress, episodeId || undefined);
  };

  const handleClose = () => {
    setIsPlaying(false);
    router.push(`/title/${id}`);
  };

  return (
    <VideoPlayer
      title={content.title}
      subtitle={subtitle}
      onProgress={handleProgress}
      onClose={handleClose}
    />
  );
}
