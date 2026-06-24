import { derivePersona, type MacroGenre } from "@/lib/macro-genres";
import type { MonthlyRecap, PersonaShift } from "@/lib/recaps";

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
