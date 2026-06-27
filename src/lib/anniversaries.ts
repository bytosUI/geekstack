/**
 * Anniversaires de notes : on cherche un film noté il y a ~1 an, ~5 ans ou ~6 mois
 * pour proposer à l'utilisateur de re-noter. C'est un moment d'introspection,
 * pas une notification compulsive.
 *
 * Heuristique : `library_entries.updated_at` sert d'approximation de la date de notation.
 * (À terme on pourra ajouter une colonne `rated_at` dédiée si besoin de précision.)
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type AnniversaryWindow = "1y" | "5y" | "6m";

interface WindowSpec {
  key: AnniversaryWindow;
  label: string;
  midDays: number;
  toleranceDays: number;
}

const WINDOWS: WindowSpec[] = [
  { key: "5y", label: "Il y a 5 ans", midDays: 365 * 5, toleranceDays: 14 },
  { key: "1y", label: "Il y a 1 an",  midDays: 365,     toleranceDays: 10 },
  { key: "6m", label: "Il y a 6 mois", midDays: 182,    toleranceDays: 7  },
];

export interface Anniversary {
  movieId: number;
  title: string;
  posterPath: string | null;
  rating: number;
  windowKey: AnniversaryWindow;
  windowLabel: string;
  ratedAt: string;
}

interface Row {
  movie_id: number;
  rating: number | null;
  updated_at: string;
  movie: { title: string; poster_path: string | null } | null;
}

export async function detectAnniversary(
  supabase: SupabaseClient,
  userId: string,
): Promise<Anniversary | null> {
  const { data } = await supabase
    .from("library_entries")
    .select("movie_id, rating, updated_at, movie:movies(title, poster_path)")
    .eq("user_id", userId)
    .not("rating", "is", null)
    .returns<Row[]>();

  if (!data || data.length === 0) return null;

  const now = Date.now();
  // Pour chaque fenêtre (priorité 5y > 1y > 6m), on cherche le meilleur candidat
  for (const w of WINDOWS) {
    const candidates: { row: Row; days: number }[] = [];
    for (const row of data) {
      if (!row.movie || row.rating === null) continue;
      const ratedAt = new Date(row.updated_at).getTime();
      const days = (now - ratedAt) / (1000 * 60 * 60 * 24);
      if (Math.abs(days - w.midDays) <= w.toleranceDays) {
        candidates.push({ row, days });
      }
    }
    if (candidates.length === 0) continue;

    // On garde le mieux noté ; en cas d'égalité, le plus proche pile-poil de la fenêtre
    candidates.sort((a, b) => {
      const ratingDiff = (b.row.rating ?? 0) - (a.row.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return Math.abs(a.days - w.midDays) - Math.abs(b.days - w.midDays);
    });
    const best = candidates[0];
    return {
      movieId: best.row.movie_id,
      title: best.row.movie!.title,
      posterPath: best.row.movie!.poster_path,
      rating: best.row.rating!,
      windowKey: w.key,
      windowLabel: w.label,
      ratedAt: best.row.updated_at,
    };
  }

  return null;
}
