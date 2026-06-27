/**
 * État "calme" de la home : quand il n'y a ni shift, ni recap, ni anniversaire,
 * on affiche une citation contemplative liée à la persona pour donner du sens
 * à la visite. Change déterministiquement chaque semaine.
 */

const PROMPTS: Record<string, string[]> = {
  IMAGINAIRE: [
    "Un.e IMAGINAIRE cherche souvent le vertige métaphysique. Cette semaine, quel film t'a fait basculer ?",
    "Les meilleurs mondes sont ceux qu'on n'a pas vu venir. Trouve-toi un classique de la Sci-Fi que tout le monde cite, mais que tu n'as jamais regardé.",
    "Un.e IMAGINAIRE oublie parfois la réalité. Tente un documentaire cette semaine, juste pour voir.",
  ],
  RÉALISTE: [
    "Un.e RÉALISTE traque l'authentique. Quel personnage t'a semblé le plus vrai cette année ?",
    "Le réel a aussi ses surprises. Tente un genre que tu boudes habituellement.",
    "Note un documentaire que tu as déjà vu mais jamais classé.",
  ],
  AVENTURIER: [
    "Un.e AVENTURIER ne reste pas en place. Quel voyage cinématographique t'a marqué récemment ?",
    "L'évasion la plus puissante est parfois la plus calme. Essaie un film lent et contemplatif.",
    "Refais-toi un grand spectacle que tu avais adoré ado.",
  ],
  SENSORIEL: [
    "Un.e SENSORIEL aime être remué.e. Quel film t'a fait le plus tressaillir cette année ?",
    "Le silence aussi peut être un choc. Tente un drame minimaliste.",
    "Note un film d'horreur que tu as vu mais jamais vraiment digéré.",
  ],
  INTELLECTUEL: [
    "Un.e INTELLECTUEL poursuit le sens. Quel film continue de te hanter par sa pensée ?",
    "Tente un film que tout le monde trouve obscur — tu y verras peut-être ce qu'ils n'ont pas vu.",
    "Re-regarde un film que tu jugeais trop intellectuel à 20 ans.",
  ],
  MÉLANCOLIQUE: [
    "Un.e MÉLANCOLIQUE cherche les émotions douces. Quel film t'a fait pleurer sans drame appuyé ?",
    "L'émotion sans pathos est rare. Cherche un film qui ne triche pas.",
    "Tente une comédie cette semaine — tu as le droit.",
  ],
  FESTIF: [
    "Un.e FESTIF veut que ça respire. Quelle comédie te fait toujours rire, même au 5ᵉ visionnage ?",
    "La joie a aussi sa profondeur. Tente une comédie qui aborde des sujets durs.",
    "Note ce drame que tu reportes depuis 6 mois — promis, ça va aller.",
  ],
  ÉSOTÉRIQUE: [
    "Un.e ÉSOTÉRIQUE explore l'envers du décor. Quel film t'a laissé.e avec plus de questions que de réponses ?",
    "Le surnaturel a ses classiques cachés. Cherche un giallo italien des années 70.",
    "Tente un film totalement terre-à-terre, juste pour faire reposer l'esprit.",
  ],
  COMBATTANT: [
    "Un.e COMBATTANT cherche l'arène. Quel arc narratif t'a tendu.e comme un arc cette année ?",
    "Le meilleur combat est parfois intérieur. Tente un drame psychologique.",
    "Re-regarde un film d'action que tu connais par cœur — observe ce que tu remarques maintenant.",
  ],
  SAVANT: [
    "Un.e SAVANT collectionne les vérités. Quel documentaire as-tu envie de partager mais sans savoir à qui ?",
    "L'apprentissage passe aussi par la fiction. Cherche un film qui t'a appris quelque chose sur l'Histoire.",
    "Note ces documentaires que tu as oubliés mais regardés religieusement.",
  ],
  ARCHITECTE: [
    "Un.e ARCHITECTE aime les récits qui se déplient. Quel film à structure non-linéaire t'a impressionné.e ?",
    "Un.e ARCHITECTE peut aussi aimer la simplicité. Tente un récit chronologique sans twist.",
    "Re-regarde un film à puzzle que tu n'avais qu'à moitié compris — tu verras des morceaux nouveaux.",
  ],
  ÉCLECTIQUE: [
    "Un.e ÉCLECTIQUE refuse les cases. C'est précisément ce qui rend ton ADN intéressant.",
    "Trouve un genre que tu n'as encore jamais noté ≥ 7. Une zone aveugle à explorer.",
    "Re-regarde un film qui ne t'avait pas plu il y a 5 ans. Ton goût a peut-être bougé.",
  ],
};

const FALLBACK = [
  "Note tes derniers films vus — ton ADN n'attend que ça pour se préciser.",
  "Cherche un film dont tu te souviens à peine mais qui t'avait marqué.",
];

/** Renvoie une citation déterministe (même semaine ISO + même persona = même citation). */
export function pickCalmPrompt(personaLabel: string, now: Date = new Date()): string {
  const list = PROMPTS[personaLabel] ?? FALLBACK;
  const week = isoWeek(now);
  return list[week % list.length];
}

function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
