import { derivePersona, type MacroGenre } from "@/lib/macro-genres";
import type { MonthlyRecap, PersonaShift } from "@/lib/recaps";
import type { Trait } from "@/lib/traits";

const DEMO_TOP_MACRO: { macro: MacroGenre; percentage: number }[] = [
  { macro: "Sci-Fi",  percentage: 36 },
  { macro: "Fantasy", percentage: 24 },
  { macro: "Drame",   percentage: 22 },
  { macro: "Thriller", percentage: 18 },
];

const DEMO_PERSONA = derivePersona(DEMO_TOP_MACRO);

export const DEMO_PERIOD = "2026-09";

export const DEMO_RECAP: MonthlyRecap = {
  period: DEMO_PERIOD,
  label: "septembre 2026",
  count: 8,
  avgRating: 8.1,
  topMacro: DEMO_TOP_MACRO,
  persona: DEMO_PERSONA,
  topFilm: {
    title: "Dune: Part Two",
    poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    rating: 9,
  },
};

export const DEMO_SHIFT: PersonaShift = {
  hasShifted: true,
  previousLabel: "RÉALISTE",
  currentLabel: "IMAGINAIRE",
  windowCount: 6,
};

export const DEMO_TRAITS: Trait[] = [
  {
    id: "trans_generationnel",
    emoji: "🕰️",
    label: "Trans-générationnel",
    description: "Tu as noté au moins un film de chaque décennie depuis 1960.",
  },
  {
    id: "critique_severe",
    emoji: "🎯",
    label: "Critique sévère",
    description: "Ta note moyenne est sous 6,5/10 — tes 10 sont rares et précieux.",
  },
  {
    id: "curieux",
    emoji: "🧭",
    label: "Curieux",
    description: "Tes notes ≥ 7 couvrent au moins 8 genres différents.",
  },
];
