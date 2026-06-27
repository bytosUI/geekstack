/**
 * Recap saisonnier (trimestriel). Format collector — Story Insta.
 * Q1 = Hiver, Q2 = Printemps, Q3 = Été, Q4 = Automne.
 */
import {
  aggregateMacroDna,
  derivePersona,
  type MacroGenre,
} from "@/lib/macro-genres";
import type { SupabaseClient } from "@supabase/supabase-js";

const SEASON_MIN_FILMS = 5;

export type Season = "hiver" | "printemps" | "ete" | "automne";

export interface SeasonalRecap {
  quarter: string;        // "2026-Q2"
  season: Season;
  label: string;          // "Printemps 2026"
  count: number;
  avgRating: number | null;
  topMacro: { macro: MacroGenre; percentage: number }[];
  persona: ReturnType<typeof derivePersona>;
  topFilm: { title: string; poster_path: string | null; rating: number } | null;
  oldestDiscovery: { title: string; release_year: number; rating: number } | null;
}

interface RatedRow {
  rating: number | null;
  added_at: string;
  movie: { title: string; genres: string[]; poster_path: string | null; release_year: number | null };
}

export function quarterRange(quarter: string): { start: Date; end: Date; season: Season; label: string } | null {
  const m = quarter.match(/^(\d{4})-Q([1-4])$/);
  if (!m) return null;
  const year = Number(m[1]);
  const q = Number(m[2]);
  const startMonth = (q - 1) * 3; // 0, 3, 6, 9
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 1);
  const season: Season = q === 1 ? "hiver" : q === 2 ? "printemps" : q === 3 ? "ete" : "automne";
  const label = `${seasonName(season)} ${year}`;
  return { start, end, season, label };
}

export function seasonName(s: Season): string {
  return s === "hiver" ? "Hiver" : s === "printemps" ? "Printemps" : s === "ete" ? "Été" : "Automne";
}

export function isValidQuarter(q: string): boolean {
  return /^\d{4}-Q[1-4]$/.test(q);
}

/** Trimestre précédent (i.e. le dernier complet). */
export function previousQuarter(now: Date = new Date()): string {
  const m = now.getMonth();
  const currentQ = Math.floor(m / 3) + 1; // 1..4
  let y = now.getFullYear();
  let q = currentQ - 1;
  if (q < 1) { q = 4; y -= 1; }
  return `${y}-Q${q}`;
}

export async function computeSeasonalRecap(
  supabase: SupabaseClient,
  userId: string,
  quarter: string,
): Promise<SeasonalRecap | null> {
  const range = quarterRange(quarter);
  if (!range) return null;

  const { data } = await supabase
    .from("library_entries")
    .select("rating, added_at, movie:movies(title, genres, poster_path, release_year)")
    .eq("user_id", userId)
    .gte("rating", 7)
    .gte("added_at", range.start.toISOString())
    .lt("added_at", range.end.toISOString())
    .returns<RatedRow[]>();

  const entries = data ?? [];
  if (entries.length < SEASON_MIN_FILMS) return null;

  // DNA
  const genreCounts = new Map<string, number>();
  for (const e of entries) {
    for (const g of e.movie.genres) {
      genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    }
  }
  const total = [...genreCounts.values()].reduce((s, v) => s + v, 0) || 1;
  const dna = [...genreCounts.entries()].map(([genre, count]) => ({
    genre,
    percentage: (count / total) * 100,
  }));
  const macro = aggregateMacroDna(dna);

  // Stats
  const ratings = entries.filter((e) => e.rating !== null).map((e) => e.rating!);
  const avg = ratings.length > 0
    ? Math.round((ratings.reduce((s, v) => s + v, 0) / ratings.length) * 10) / 10
    : null;

  // Top film (highest rating)
  const sortedByRating = [...entries].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const topFilm = sortedByRating[0];

  // Plus vieille découverte (release_year le plus petit)
  const withYear = entries.filter((e) => e.movie.release_year !== null);
  const oldest = withYear.sort(
    (a, b) => (a.movie.release_year ?? 9999) - (b.movie.release_year ?? 9999),
  )[0];

  return {
    quarter,
    season: range.season,
    label: range.label,
    count: entries.length,
    avgRating: avg,
    topMacro: macro.slice(0, 6),
    persona: derivePersona(macro),
    topFilm: topFilm
      ? { title: topFilm.movie.title, poster_path: topFilm.movie.poster_path, rating: topFilm.rating ?? 0 }
      : null,
    oldestDiscovery: oldest && oldest.movie.release_year
      ? { title: oldest.movie.title, release_year: oldest.movie.release_year, rating: oldest.rating ?? 0 }
      : null,
  };
}

export async function getLatestAvailableSeasonalRecap(
  supabase: SupabaseClient,
  userId: string,
  now: Date = new Date(),
): Promise<SeasonalRecap | null> {
  // On regarde le trimestre précédent ; s'il est trop maigre, on tente le suivant en arrière
  let q = previousQuarter(now);
  for (let i = 0; i < 4; i++) {
    const recap = await computeSeasonalRecap(supabase, userId, q);
    if (recap) return recap;
    // Recule encore d'un trimestre
    const m = q.match(/^(\d{4})-Q([1-4])$/);
    if (!m) break;
    let y = Number(m[1]);
    let n = Number(m[2]) - 1;
    if (n < 1) { n = 4; y -= 1; }
    q = `${y}-Q${n}`;
  }
  return null;
}

/** Couleur d'accent par saison — alignée sur les tokens bytosUI. */
export function seasonAccent(season: Season): string {
  switch (season) {
    case "hiver":     return "#092DE6"; // primary blue
    case "printemps": return "#00C96B"; // success green
    case "ete":       return "#FF7A00"; // warning orange
    case "automne":   return "#FF5B60"; // tertiary red
  }
}
