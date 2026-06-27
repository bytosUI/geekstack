/**
 * Données simulées pour les 3 médias pas encore branchés.
 * Servent à visualiser /v3 avant intégration IGDB / AniList / TMDB séries.
 */
import type { MacroGenre } from "@/lib/macro-genres";

export const FAKE_GAMES_DNA: { macro: MacroGenre; percentage: number }[] = [
  { macro: "Fantasy",  percentage: 38 },
  { macro: "Sci-Fi",   percentage: 24 },
  { macro: "Action",   percentage: 22 },
  { macro: "Mystère",  percentage: 10 },
  { macro: "Horror",   percentage: 6  },
];

export const FAKE_ANIME_DNA: { macro: MacroGenre; percentage: number }[] = [
  { macro: "Fantasy",   percentage: 42 },
  { macro: "Action",    percentage: 28 },
  { macro: "Sci-Fi",    percentage: 18 },
  { macro: "Drame",     percentage: 12 },
];

export const FAKE_SERIES_DNA: { macro: MacroGenre; percentage: number }[] = [
  { macro: "Drame",    percentage: 36 },
  { macro: "Thriller", percentage: 28 },
  { macro: "Mystère",  percentage: 18 },
  { macro: "Comédie",  percentage: 12 },
  { macro: "Sci-Fi",   percentage: 6  },
];

/** Poids = part du temps culturel sur ce média (somme libre, sera normalisée). */
export const FAKE_MEDIA_WEIGHTS = {
  films:  58,
  games:  24,
  anime:  12,
  series: 6,
};
