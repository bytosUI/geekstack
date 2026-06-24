export type MovieStatus = "a_voir" | "vu" | "abandonne";

export type EventType =
  | "movie_added"
  | "session_return"
  | "dna_share_clicked"
  | "dna_regenerated";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Movie {
  id: number;
  title: string;
  release_year: number | null;
  poster_path: string | null;
  genres: string[];
  synopsis: string | null;
  cached_at: string;
}

export interface LibraryEntry {
  id: string;
  user_id: string;
  movie_id: number;
  status: MovieStatus;
  rating: number | null;
  added_at: string;
  updated_at: string;
}

export interface LibraryEntryWithMovie extends LibraryEntry {
  movie: Movie;
}

export interface GenreDnaRow {
  user_id: string;
  genre: string;
  genre_count: number;
  percentage: number;
}

export interface EventRow {
  id: number;
  user_id: string | null;
  type: EventType;
  payload: Record<string, unknown>;
  occurred_at: string;
}
