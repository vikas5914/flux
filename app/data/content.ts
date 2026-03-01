import {
  type TMDBMovie,
  type TMDBTVShow,
  type TMDBSearchResult,
  type TMDBEpisode,
  type TMDBSeason,
  posterUrl,
  backdropUrl,
  stillUrl,
  formatRuntime,
  extractYear,
} from '../lib/tmdb';

export interface Content {
  id: string;
  title: string;
  type: 'movie' | 'series';
  year: number;
  rating: number;
  duration?: string;
  genres: string[];
  synopsis: string;
  poster: string;
  backdrop: string;
  cast: { name: string; role: string }[];
  episodes?: { id: string; title: string; duration: string; synopsis: string; thumbnail: string }[];
  seasons?: { seasonNumber: number; name: string; episodeCount: number }[];
  numberOfSeasons?: number;
}

// --- Mappers from TMDB types to our Content type ---

export function mapMovieToContent(movie: TMDBMovie): Content {
  return {
    id: `movie-${movie.id}`,
    title: movie.title,
    type: 'movie',
    year: extractYear(movie.release_date),
    rating: Math.round(movie.vote_average * 10) / 10,
    duration: formatRuntime(movie.runtime),
    genres: movie.genres?.map((g) => g.name) ?? [],
    synopsis: movie.overview || '',
    poster: posterUrl(movie.poster_path),
    backdrop: backdropUrl(movie.backdrop_path),
    cast: (movie.credits?.cast ?? []).slice(0, 8).map((c) => ({
      name: c.name,
      role: c.character,
    })),
  };
}

export function mapTVToContent(tv: TMDBTVShow, episodes?: TMDBEpisode[]): Content {
  const runTime = tv.episode_run_time?.[0];
  return {
    id: `tv-${tv.id}`,
    title: tv.name,
    type: 'series',
    year: extractYear(tv.first_air_date),
    rating: Math.round(tv.vote_average * 10) / 10,
    duration: runTime ? formatRuntime(runTime) : undefined,
    genres: tv.genres?.map((g) => g.name) ?? [],
    synopsis: tv.overview || '',
    poster: posterUrl(tv.poster_path),
    backdrop: backdropUrl(tv.backdrop_path),
    cast: (tv.credits?.cast ?? []).slice(0, 8).map((c) => ({
      name: c.name,
      role: c.character,
    })),
    episodes: episodes?.map((ep) => ({
      id: `s${ep.season_number}e${ep.episode_number}`,
      title: ep.name,
      duration: formatRuntime(ep.runtime),
      synopsis: ep.overview || '',
      thumbnail: stillUrl(ep.still_path),
    })),
    numberOfSeasons: tv.number_of_seasons,
    seasons: tv.seasons
      ?.filter((s) => s.season_number > 0)
      .map((s) => ({
        seasonNumber: s.season_number,
        name: s.name,
        episodeCount: s.episode_count,
      })),
  };
}

export function mapSearchResultToContent(result: TMDBSearchResult): Content {
  const isMovie = result.media_type === 'movie';
  return {
    id: isMovie ? `movie-${result.id}` : `tv-${result.id}`,
    title: (isMovie ? result.title : result.name) ?? 'Unknown',
    type: isMovie ? 'movie' : 'series',
    year: extractYear(isMovie ? result.release_date : result.first_air_date),
    rating: Math.round((result.vote_average ?? 0) * 10) / 10,
    genres: [],
    synopsis: result.overview ?? '',
    poster: posterUrl(result.poster_path),
    backdrop: backdropUrl(result.backdrop_path ?? null),
    cast: [],
  };
}

// --- ID helpers ---

export function parseContentId(id: string): { type: 'movie' | 'tv'; tmdbId: number } | null {
  const match = id.match(/^(movie|tv)-(\d+)$/);
  if (!match) return null;
  return { type: match[1] as 'movie' | 'tv', tmdbId: parseInt(match[2], 10) };
}
