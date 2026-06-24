const TMDB_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export interface TmdbSearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  overview: string;
}

export interface TmdbMovieDetails extends TmdbSearchResult {
  genres: { id: number; name: string }[];
  runtime: number | null;
}

async function tmdbFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env.TMDB_API_KEY;
  if (!token) throw new Error("TMDB_API_KEY manquant");

  const res = await fetch(`${TMDB_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw new Error(`TMDB ${path} → ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function searchMovies(query: string): Promise<TmdbSearchResult[]> {
  if (!query.trim()) return [];
  const data = await tmdbFetch<{ results: TmdbSearchResult[] }>(
    `/search/movie?query=${encodeURIComponent(query)}&language=fr-FR&include_adult=false`,
  );
  return data.results;
}

export async function getMovieDetails(id: number): Promise<TmdbMovieDetails> {
  return tmdbFetch<TmdbMovieDetails>(`/movie/${id}?language=fr-FR`);
}

export function posterUrl(path: string | null, size: "w185" | "w342" | "w500" = "w342") {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

export function releaseYear(release_date: string | null) {
  return release_date ? Number(release_date.slice(0, 4)) : null;
}
