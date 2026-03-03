const TMDB_TOKEN = import.meta.env.VITE_TMDB_API_TOKEN;
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

// Image URL helpers
export function posterUrl(path: string | null, size = "w500"): string {
  if (!path)
    return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop";
  return `${IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null, size = "w1280"): string {
  if (!path)
    return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&h=1080&fit=crop";
  return `${IMAGE_BASE}/${size}${path}`;
}

export function stillUrl(path: string | null, size = "w300"): string {
  if (!path)
    return "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&h=225&fit=crop";
  return `${IMAGE_BASE}/${size}${path}`;
}

// Generic fetch helper
async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!TMDB_TOKEN) {
    throw new Error("Missing TMDB token. Set VITE_TMDB_API_TOKEN in .env");
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("language", "en-US");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TMDB_TOKEN}`,
    },
  });
  if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
  return res.json();
}

// --- Types ---

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  runtime?: number;
  media_type?: string;
  credits?: {
    cast: TMDBCastMember[];
    crew: TMDBCrewMember[];
  };
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time?: number[];
  media_type?: string;
  seasons?: TMDBSeason[];
  credits?: {
    cast: TMDBCastMember[];
    crew: TMDBCrewMember[];
  };
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBSeason {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episode_count: number;
  air_date: string;
  poster_path: string | null;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  still_path: string | null;
  vote_average: number;
  runtime: number | null;
}

export interface TMDBSeasonDetail {
  id: number;
  name: string;
  season_number: number;
  episodes: TMDBEpisode[];
}

interface TMDBPagedResponse<T> {
  page: number;
  total_pages: number;
  total_results: number;
  results: T[];
}

export interface TMDBSearchResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  overview?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  genre_ids?: number[];
  popularity: number;
}

// --- API Functions ---

export async function getTrendingMovies(page = 1): Promise<TMDBPagedResponse<TMDBMovie>> {
  return tmdbFetch("/trending/movie/week", { page: String(page) });
}

export async function getTrendingTV(page = 1): Promise<TMDBPagedResponse<TMDBTVShow>> {
  return tmdbFetch("/trending/tv/week", { page: String(page) });
}

export async function getTrendingAll(page = 1): Promise<TMDBPagedResponse<TMDBSearchResult>> {
  return tmdbFetch("/trending/all/week", { page: String(page) });
}

export async function searchMulti(
  query: string,
  page = 1,
): Promise<TMDBPagedResponse<TMDBSearchResult>> {
  return tmdbFetch("/search/multi", { query, page: String(page) });
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovie> {
  return tmdbFetch(`/movie/${movieId}`, { append_to_response: "credits" });
}

export async function getTVDetails(tvId: number): Promise<TMDBTVShow> {
  return tmdbFetch(`/tv/${tvId}`, { append_to_response: "credits" });
}

export async function getTVSeasonDetails(
  tvId: number,
  seasonNumber: number,
): Promise<TMDBSeasonDetail> {
  return tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
}

// --- Helper: format runtime ---
export function formatRuntime(minutes: number | undefined | null): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// --- Helper: extract year ---
export function extractYear(dateStr: string | undefined): number {
  if (!dateStr) return 0;
  return parseInt(dateStr.substring(0, 4), 10) || 0;
}
