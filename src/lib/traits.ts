/**
 * Traits identitaires : marqueurs descriptifs dérivés de la bibliothèque.
 * Pas de grind, pas de récompense — juste des affirmations qui enrichissent
 * le portrait. Un trait est "débloqué" dès que ses conditions sont remplies.
 */

export interface Trait {
  id: string;
  emoji: string;
  label: string;
  description: string;
}

interface TraitMovie {
  release_year: number | null;
  genres: string[];
}

export interface TraitInput {
  /** Entrées avec note ≥ 7 — celles qui contribuent à l'ADN. */
  ratedHigh: { rating: number; movie: TraitMovie }[];
  /** Toutes les entrées notées (1-10) — pour la sévérité moyenne. */
  allRated: { rating: number }[];
  /** Comptes par genre TMDB brut, sur les ratedHigh. */
  genreCounts: Map<string, number>;
}

const RARE_GENRES = ["Documentaire", "Western", "Musique", "Histoire", "Guerre"];

const RAW: (Trait & { match: (input: TraitInput) => boolean })[] = [
  {
    id: "trans_generationnel",
    emoji: "🕰️",
    label: "Trans-générationnel",
    description: "Tu as noté au moins un film de chaque décennie depuis 1960.",
    match: ({ ratedHigh }) => {
      const decades = new Set<number>();
      for (const e of ratedHigh) {
        if (e.movie.release_year)
          decades.add(Math.floor(e.movie.release_year / 10) * 10);
      }
      return [1960, 1970, 1980, 1990, 2000, 2010, 2020].every((d) => decades.has(d));
    },
  },
  {
    id: "loyal_au_passe",
    emoji: "🗝️",
    label: "Loyal au passé",
    description: "Plus de 40 % de tes notes portent sur des films d'avant 2000.",
    match: ({ ratedHigh }) => {
      if (ratedHigh.length < 5) return false;
      const old = ratedHigh.filter(
        (e) => e.movie.release_year && e.movie.release_year < 2000,
      ).length;
      return old / ratedHigh.length >= 0.4;
    },
  },
  {
    id: "precoce",
    emoji: "🌅",
    label: "Précoce",
    description: "Plus de 50 % de tes notes portent sur des films des 5 dernières années.",
    match: ({ ratedHigh }) => {
      if (ratedHigh.length < 5) return false;
      const now = new Date().getFullYear();
      const recent = ratedHigh.filter(
        (e) => e.movie.release_year && now - e.movie.release_year <= 5,
      ).length;
      return recent / ratedHigh.length >= 0.5;
    },
  },
  {
    id: "curieux",
    emoji: "🧭",
    label: "Curieux",
    description: "Tes notes ≥ 7 couvrent au moins 8 genres différents.",
    match: ({ genreCounts }) => genreCounts.size >= 8,
  },
  {
    id: "critique_severe",
    emoji: "🎯",
    label: "Critique sévère",
    description: "Ta note moyenne est sous 6,5/10 — tes 10 sont rares et précieux.",
    match: ({ allRated }) => {
      if (allRated.length < 10) return false;
      const avg = allRated.reduce((s, e) => s + e.rating, 0) / allRated.length;
      return avg < 6.5;
    },
  },
  {
    id: "niche",
    emoji: "💎",
    label: "Niche",
    description:
      "Tu as noté ≥ 7 dans au moins 2 genres rares (documentaire, western, musique, histoire, guerre).",
    match: ({ genreCounts }) => {
      const rare = RARE_GENRES.filter((g) => (genreCounts.get(g) ?? 0) >= 1);
      return rare.length >= 2;
    },
  },
  {
    id: "hardcore",
    emoji: "🌋",
    label: "Hardcore",
    description: "Au moins 25 % de tes notes ≥ 7 sont des films d'horreur.",
    match: ({ genreCounts, ratedHigh }) => {
      if (ratedHigh.length < 5) return false;
      const horror = genreCounts.get("Horreur") ?? 0;
      return horror / ratedHigh.length >= 0.25;
    },
  },
  {
    id: "esthete",
    emoji: "🎭",
    label: "Esthète",
    description: "Plus de 40 % de tes notes ≥ 7 sont des drames.",
    match: ({ genreCounts, ratedHigh }) => {
      if (ratedHigh.length < 5) return false;
      const drama = genreCounts.get("Drame") ?? 0;
      return drama / ratedHigh.length >= 0.4;
    },
  },
];

export function computeTraits(input: TraitInput): Trait[] {
  return RAW.filter((t) => t.match(input)).map(({ id, emoji, label, description }) => ({
    id,
    emoji,
    label,
    description,
  }));
}

/** Helper : prépare les structures attendues par computeTraits depuis les rows Supabase. */
export function buildTraitInput(
  entries: { rating: number | null; movie: TraitMovie | null }[],
): TraitInput {
  const allRated = entries
    .filter((e): e is { rating: number; movie: TraitMovie | null } => e.rating !== null)
    .map((e) => ({ rating: e.rating }));

  const ratedHigh = entries
    .filter(
      (e): e is { rating: number; movie: TraitMovie } =>
        e.rating !== null && e.rating >= 7 && e.movie !== null,
    )
    .map((e) => ({ rating: e.rating, movie: e.movie }));

  const genreCounts = new Map<string, number>();
  for (const e of ratedHigh) {
    for (const g of e.movie.genres) {
      genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    }
  }

  return { ratedHigh, allRated, genreCounts };
}
