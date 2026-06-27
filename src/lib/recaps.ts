import {
  aggregateMacroDna,
  combineCrossMedia,
  derivePersona,
  toMacroGenre,
  type MacroGenre,
} from "@/lib/macro-genres";
import {
  FAKE_ANIME_DNA,
  FAKE_GAMES_DNA,
  FAKE_MEDIA_WEIGHTS,
  FAKE_SERIES_DNA,
} from "@/app/(app)/fake-data";
import type { SupabaseClient } from "@supabase/supabase-js";

const SHIFT_WINDOW_DAYS = 30;
const SHIFT_MIN_FILMS = 3;
const RECAP_MIN_FILMS = 3;

interface RatedRow {
  rating: number | null;
  added_at: string;
  movie: { title: string; genres: string[]; poster_path: string | null };
}

/** Renvoie le mois précédent au format "YYYY-MM" (utile pour le recap dispo en début de mois courant). */
export function previousMonthPeriod(now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function periodRange(period: string): { start: Date; end: Date; label: string } {
  const [yStr, mStr] = period.split("-");
  const y = Number(yStr);
  const m = Number(mStr) - 1;
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 1);
  const label = start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return { start, end, label };
}

export function isValidPeriod(period: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
}

async function fetchRatedEntries(
  supabase: SupabaseClient,
  userId: string,
  start?: Date,
  end?: Date,
): Promise<RatedRow[]> {
  let q = supabase
    .from("library_entries")
    .select("rating, added_at, movie:movies(title, genres, poster_path)")
    .eq("user_id", userId)
    .gte("rating", 7);

  if (start) q = q.gte("added_at", start.toISOString());
  if (end) q = q.lt("added_at", end.toISOString());

  const { data } = await q;
  return (data ?? []) as unknown as RatedRow[];
}

function entriesToDna(entries: RatedRow[]): { genre: string; percentage: number }[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    for (const g of e.movie.genres) {
      counts.set(g, (counts.get(g) ?? 0) + 1);
    }
  }
  const total = [...counts.values()].reduce((s, v) => s + v, 0) || 1;
  return [...counts.entries()].map(([genre, count]) => ({
    genre,
    percentage: (count / total) * 100,
  }));
}

/* ──────────────────────────────────────────────
   1) Recap mensuel (films-only pour l'instant)
────────────────────────────────────────────── */
export interface MonthlyRecap {
  period: string;
  label: string;
  count: number;
  avgRating: number | null;
  topMacro: { macro: MacroGenre; percentage: number }[];
  persona: ReturnType<typeof derivePersona>;
  topFilm: { title: string; poster_path: string | null; rating: number } | null;
}

export async function computeMonthlyRecap(
  supabase: SupabaseClient,
  userId: string,
  period: string,
): Promise<MonthlyRecap | null> {
  if (!isValidPeriod(period)) return null;
  const { start, end, label } = periodRange(period);

  const entries = await fetchRatedEntries(supabase, userId, start, end);
  if (entries.length < RECAP_MIN_FILMS) return null;

  const dna = entriesToDna(entries);
  const macro = aggregateMacroDna(dna);
  const persona = derivePersona(macro);
  const avg =
    entries.reduce((s, e) => s + (e.rating ?? 0), 0) /
    Math.max(1, entries.filter((e) => e.rating !== null).length);

  const sortedByRating = [...entries]
    .filter((e) => e.rating !== null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const top = sortedByRating[0];

  return {
    period,
    label,
    count: entries.length,
    avgRating: avg ? Math.round(avg * 10) / 10 : null,
    topMacro: macro.slice(0, 4),
    persona,
    topFilm: top ? { title: top.movie.title, poster_path: top.movie.poster_path, rating: top.rating ?? 0 } : null,
  };
}

/* ──────────────────────────────────────────────
   2) Détection de bascule de persona
   Compare la fenêtre des 30 derniers jours vs all-time
────────────────────────────────────────────── */
export interface PersonaShift {
  hasShifted: boolean;
  previousLabel: string;
  currentLabel: string;
  windowCount: number;
}

export async function detectPersonaShift(
  supabase: SupabaseClient,
  userId: string,
): Promise<PersonaShift | null> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - SHIFT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [allTime, recent] = await Promise.all([
    fetchRatedEntries(supabase, userId),
    fetchRatedEntries(supabase, userId, windowStart, now),
  ]);
  if (recent.length < SHIFT_MIN_FILMS || allTime.length < SHIFT_MIN_FILMS) return null;

  const allMacro = aggregateMacroDna(entriesToDna(allTime));
  const recentMacro = aggregateMacroDna(entriesToDna(recent));

  // On enrichit avec les autres médias simulés (mêmes poids dans les 2 fenêtres pour isoler l'effet films)
  const combinedAll = combineCrossMedia([
    { weight: FAKE_MEDIA_WEIGHTS.films,  dna: allMacro },
    { weight: FAKE_MEDIA_WEIGHTS.games,  dna: FAKE_GAMES_DNA },
    { weight: FAKE_MEDIA_WEIGHTS.anime,  dna: FAKE_ANIME_DNA },
    { weight: FAKE_MEDIA_WEIGHTS.series, dna: FAKE_SERIES_DNA },
  ]);
  const combinedRecent = combineCrossMedia([
    { weight: FAKE_MEDIA_WEIGHTS.films,  dna: recentMacro },
    { weight: FAKE_MEDIA_WEIGHTS.games,  dna: FAKE_GAMES_DNA },
    { weight: FAKE_MEDIA_WEIGHTS.anime,  dna: FAKE_ANIME_DNA },
    { weight: FAKE_MEDIA_WEIGHTS.series, dna: FAKE_SERIES_DNA },
  ]);

  const previous = derivePersona(combinedAll);
  const current = derivePersona(combinedRecent);

  return {
    hasShifted: previous.label !== current.label,
    previousLabel: previous.label,
    currentLabel: current.label,
    windowCount: recent.length,
  };
}

/* ──────────────────────────────────────────────
   3) Helper : le recap du mois précédent est-il dispo ?
────────────────────────────────────────────── */
export async function getLatestAvailableMonthlyRecap(
  supabase: SupabaseClient,
  userId: string,
  now: Date = new Date(),
): Promise<MonthlyRecap | null> {
  // On regarde le mois précédent ; s'il est trop maigre, on tente celui d'avant.
  for (let offset = 1; offset <= 3; offset++) {
    const ref = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const period = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
    const recap = await computeMonthlyRecap(supabase, userId, period);
    if (recap) return recap;
  }
  return null;
}

// Avoid unused-import warning at build for previousMonthPeriod when not used directly.
void previousMonthPeriod;
