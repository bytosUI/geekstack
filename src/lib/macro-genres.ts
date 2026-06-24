import type { GenreDnaRow } from "@/types/database";

/**
 * Macro-genres : taxonomie thématique trans-média.
 * Un film "Science-Fiction" et un jeu "RPG fantasy" partagent un univers commun.
 */
export const MACRO_GENRES = [
  "Sci-Fi",
  "Fantasy",
  "Action",
  "Drame",
  "Horror",
  "Thriller",
  "Romance",
  "Comédie",
  "Documentaire",
  "Mystère",
] as const;

export type MacroGenre = (typeof MACRO_GENRES)[number];

/** Mapping TMDB (films, en FR) → macro-genres. */
const TMDB_TO_MACRO: Record<string, MacroGenre> = {
  "Science-Fiction": "Sci-Fi",
  Fantastique: "Fantasy",
  Action: "Action",
  Aventure: "Action",
  Guerre: "Action",
  Western: "Action",
  Drame: "Drame",
  Histoire: "Drame",
  Horreur: "Horror",
  Thriller: "Thriller",
  Crime: "Thriller",
  Mystère: "Mystère",
  Romance: "Romance",
  Comédie: "Comédie",
  Familial: "Comédie",
  Musique: "Comédie",
  Animation: "Fantasy",
  Documentaire: "Documentaire",
};

export function toMacroGenre(genre: string): MacroGenre | null {
  return TMDB_TO_MACRO[genre] ?? null;
}

/** Aggrège une liste de DNA rows (avec genres TMDB ou autres) en macro-genres normalisés. */
export function aggregateMacroDna(
  dna: { genre: string; percentage: number }[],
): { macro: MacroGenre; percentage: number }[] {
  const acc = new Map<MacroGenre, number>();
  for (const row of dna) {
    const macro = toMacroGenre(row.genre);
    if (!macro) continue;
    acc.set(macro, (acc.get(macro) ?? 0) + row.percentage);
  }
  const total = [...acc.values()].reduce((s, v) => s + v, 0) || 1;
  return [...acc.entries()]
    .map(([macro, percentage]) => ({
      macro,
      percentage: Math.round((percentage / total) * 1000) / 10,
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

/** Combine plusieurs sources média avec poids = % du temps passé sur ce média. */
export function combineCrossMedia(
  sources: { weight: number; dna: { macro: MacroGenre; percentage: number }[] }[],
): { macro: MacroGenre; percentage: number }[] {
  const acc = new Map<MacroGenre, number>();
  const totalWeight = sources.reduce((s, x) => s + x.weight, 0) || 1;
  for (const src of sources) {
    const w = src.weight / totalWeight;
    for (const r of src.dna) {
      acc.set(r.macro, (acc.get(r.macro) ?? 0) + r.percentage * w);
    }
  }
  const total = [...acc.values()].reduce((s, v) => s + v, 0) || 1;
  return [...acc.entries()]
    .map(([macro, percentage]) => ({
      macro,
      percentage: Math.round((percentage / total) * 1000) / 10,
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

/* ──────────────────────────────────────────────
   Macro-personas — 8 archétypes cross-média
   Chacun est défini par 2-3 macro-genres signature.
────────────────────────────────────────────── */
interface MacroPersona {
  label: string;
  tagline: string;
  signature: MacroGenre[];
}

const PERSONAS: MacroPersona[] = [
  { label: "IMAGINAIRE",   tagline: "tu rêves d'autres mondes",          signature: ["Sci-Fi", "Fantasy"] },
  { label: "RÉALISTE",     tagline: "tu cherches le vrai dans la fiction", signature: ["Drame", "Documentaire"] },
  { label: "AVENTURIER",   tagline: "tu veux de l'évasion et du grand spectacle", signature: ["Action", "Fantasy"] },
  { label: "SENSORIEL",    tagline: "tu aimes que ça te remue",          signature: ["Horror", "Thriller"] },
  { label: "INTELLECTUEL", tagline: "tu poursuis le sens et les énigmes", signature: ["Mystère", "Drame", "Documentaire"] },
  { label: "MÉLANCOLIQUE", tagline: "tu cherches les émotions douces",   signature: ["Drame", "Romance"] },
  { label: "FESTIF",       tagline: "tu veux que ça respire la joie",    signature: ["Comédie", "Romance"] },
  { label: "ÉCLECTIQUE",   tagline: "tu refuses de te ranger dans une case", signature: [] },
];

export function derivePersona(crossDna: { macro: MacroGenre; percentage: number }[]): MacroPersona {
  if (crossDna.length === 0) return PERSONAS[PERSONAS.length - 1];

  const pctByMacro = new Map(crossDna.map((r) => [r.macro, r.percentage]));
  const top = crossDna[0];

  // ÉCLECTIQUE : aucun macro-genre ne dépasse 22%
  if (top.percentage < 22 && crossDna.filter((r) => r.percentage >= 8).length >= 5) {
    return PERSONAS[PERSONAS.length - 1];
  }

  // Sinon : meilleure correspondance par somme des signatures
  let best: MacroPersona = PERSONAS[0];
  let bestScore = -1;
  for (const p of PERSONAS) {
    if (p.signature.length === 0) continue;
    const score = p.signature.reduce((s, g) => s + (pctByMacro.get(g) ?? 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

/** Conserve la rétro-compat avec les rows DNA existants (films). */
export function dnaToMacroAggregated(dna: GenreDnaRow[]): { macro: MacroGenre; percentage: number }[] {
  return aggregateMacroDna(dna);
}
