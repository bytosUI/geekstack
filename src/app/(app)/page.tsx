import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  aggregateMacroDna,
  combineCrossMedia,
  derivePersona,
  type MacroGenre,
} from "@/lib/macro-genres";
import {
  FAKE_ANIME_DNA,
  FAKE_GAMES_DNA,
  FAKE_MEDIA_WEIGHTS,
  FAKE_SERIES_DNA,
} from "./fake-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Film, Gamepad2, Sparkles, Tv, Zap, CalendarDays } from "lucide-react";
import { CrossMediaShare } from "./cross-media-share";
import {
  detectPersonaShift,
  getLatestAvailableMonthlyRecap,
} from "@/lib/recaps";
import { detectAnniversary, type Anniversary } from "@/lib/anniversaries";
import { pickCalmPrompt } from "@/lib/calm-state";
import { buildTraitInput, computeTraits, type Trait } from "@/lib/traits";
import { AnniversaryCard } from "./anniversary-card";
import type { GenreDnaRow } from "@/types/database";

const MACRO_COLORS: Record<MacroGenre, string> = {
  "Sci-Fi":       "#092DE6",
  Fantasy:        "#FF5B60",
  Action:         "#FF7A00",
  Drame:          "#1F2937",
  Horror:         "#3D3D42",
  Thriller:       "#D93A3F",
  Romance:        "#FFB3B6",
  Comédie:        "#FFD166",
  Documentaire:   "#00C96B",
  Mystère:        "#4D6BFF",
};

export default async function HomeV3({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  const isDemo = demo === "1";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    { data: profile },
    { data: filmsRaw },
    { data: entriesForTraits },
    realShift,
    realRecap,
    realAnniversary,
  ] = await Promise.all([
    supabase.from("profiles").select("username, display_name").eq("id", user.id).single(),
    supabase
      .from("user_genre_dna")
      .select("*")
      .eq("user_id", user.id)
      .returns<GenreDnaRow[]>(),
    supabase
      .from("library_entries")
      .select("rating, movie:movies(release_year, genres)")
      .eq("user_id", user.id)
      .returns<{ rating: number | null; movie: { release_year: number | null; genres: string[] } | null }[]>(),
    isDemo ? Promise.resolve(null) : detectPersonaShift(supabase, user.id),
    isDemo ? Promise.resolve(null) : getLatestAvailableMonthlyRecap(supabase, user.id),
    isDemo ? Promise.resolve(null) : detectAnniversary(supabase, user.id),
  ]);

  const demoModule = isDemo ? await import("@/lib/demo-data") : null;
  const shift = isDemo ? demoModule!.DEMO_SHIFT : realShift;
  const recap = isDemo ? demoModule!.DEMO_RECAP : realRecap;
  const anniversary: Anniversary | null = isDemo ? demoModule!.DEMO_ANNIVERSARY : realAnniversary;
  const traits: Trait[] = isDemo
    ? demoModule!.DEMO_TRAITS
    : computeTraits(buildTraitInput(entriesForTraits ?? []));

  const filmsMacro = aggregateMacroDna(filmsRaw ?? []);

  // Pondérations de média : si l'utilisateur n'a pas de films notés, on garde des poids fake
  // pour que la preview reste lisible.
  const weights = FAKE_MEDIA_WEIGHTS;

  const crossDna = combineCrossMedia([
    { weight: weights.films,  dna: filmsMacro },
    { weight: weights.games,  dna: FAKE_GAMES_DNA },
    { weight: weights.anime,  dna: FAKE_ANIME_DNA },
    { weight: weights.series, dna: FAKE_SERIES_DNA },
  ]);

  const persona = derivePersona(crossDna);
  const topThree = crossDna.slice(0, 3);
  const greeting = getGreeting(profile?.display_name || profile?.username || "");
  const totalWeight =
    weights.films + weights.games + weights.anime + weights.series || 1;

  return (
    <div className="flex flex-col gap-8">
      {isDemo && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-4 py-3 flex-wrap">
            <span className="text-sm">
              <Badge variant="default" className="mr-2">démo</Badge>
              Mode démo — bascule + recap + traits forcés (pour testeurs)
            </span>
          </CardContent>
        </Card>
      )}

      {/* Persona shift — cadeau de rétention */}
      {shift?.hasShifted && (
        <Card className="border-2 border-primary bg-primary/5">
          <CardContent className="flex items-start gap-4 py-5">
            <div className="rounded-full bg-primary/15 p-2.5 shrink-0">
              <Zap className="size-5 text-primary" />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p className="text-xs uppercase tracking-wider text-primary font-medium">
                Quelque chose s&apos;est passé
              </p>
              <p className="text-lg font-medium leading-tight">
                Ton ADN a basculé de{" "}
                <span className="line-through text-muted-foreground decoration-2">
                  {shift.previousLabel}
                </span>{" "}
                vers <span className="text-primary font-bold">{shift.currentLabel}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Basé sur tes {shift.windowCount} dernières notations.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anniversaire de note */}
      {anniversary && <AnniversaryCard anniversary={anniversary} />}

      {/* État calme — citation contemplative quand rien d'autre n'a "tilté" */}
      {!shift?.hasShifted && !recap && !anniversary && (
        <Card className="border-dashed bg-muted/40">
          <CardContent className="py-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
              💭 Pensée de la semaine
            </p>
            <p className="text-base leading-relaxed">
              {pickCalmPrompt(persona.label)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recap mensuel disponible */}
      {recap && (
        <Link
          href={`/recaps/${recap.period}${isDemo ? "?demo=1" : ""}`}
          className="block group"
          prefetch={false}
        >
          <Card className="transition group-hover:border-primary">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="rounded-full bg-muted p-2.5 shrink-0">
                <CalendarDays className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Ton recap est prêt
                </p>
                <p className="text-base font-medium leading-tight capitalize">
                  {recap.label} — {recap.count} films, persona {recap.persona.label}
                </p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* HERO */}
      <section className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">{greeting}.</p>
        <h1 className="font-heading text-3xl md:text-4xl">Tu es un.e</h1>
        <div className="flex flex-col gap-1">
          <p className="font-heading text-5xl md:text-7xl font-bold leading-tight text-primary">
            {persona.label}
          </p>
          <p className="text-base md:text-lg text-muted-foreground">
            {topThree.map((r) => r.macro).join(" · ")}
          </p>
          {traits.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {traits.map((t) => (
                <span
                  key={t.id}
                  title={t.description}
                  className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-medium"
                >
                  <span aria-hidden>{t.emoji}</span>
                  {t.label}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground italic mt-1">
            « {persona.tagline} »
          </p>
        </div>
      </section>

      {/* Ton univers — répartition par média */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
          Ton univers
        </h2>
        <div className="grid grid-cols-4 gap-2">
          <MediaTile
            icon={<Film className="size-5" />}
            label="Films"
            percentage={Math.round((weights.films / totalWeight) * 100)}
            real
          />
          <MediaTile
            icon={<Gamepad2 className="size-5" />}
            label="Jeux"
            percentage={Math.round((weights.games / totalWeight) * 100)}
          />
          <MediaTile
            icon={<Sparkles className="size-5" />}
            label="Anime"
            percentage={Math.round((weights.anime / totalWeight) * 100)}
          />
          <MediaTile
            icon={<Tv className="size-5" />}
            label="Séries"
            percentage={Math.round((weights.series / totalWeight) * 100)}
          />
        </div>
      </section>

      {/* Top macro-genres cross-média */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
          Top genres — tous médias confondus
        </h2>
        <Card className="border-2">
          <CardContent className="flex flex-col gap-4 py-6">
            {crossDna.slice(0, 6).map((row) => (
              <div key={row.macro} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm md:text-base">
                  <span className="font-medium">{row.macro}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {row.percentage}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${row.percentage}%`,
                      backgroundColor: MACRO_COLORS[row.macro],
                    }}
                  />
                </div>
              </div>
            ))}

            <CrossMediaShare
              username={profile?.username ?? ""}
              personaLabel={persona.label}
              dna={crossDna.slice(0, 6)}
            />
          </CardContent>
        </Card>
      </section>

      {/* Traits identitaires — détaillés */}
      {traits.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
            Tes traits identitaires
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {traits.map((t) => (
              <Card key={t.id}>
                <CardContent className="flex items-start gap-3 py-4">
                  <span aria-hidden className="text-2xl leading-none mt-0.5">{t.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{t.label}</p>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                      {t.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Tracking subtil */}
      <section className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground italic">
          Note : seuls les films sont actuellement branchés. Jeux, anime et séries arriveront dans les prochaines itérations (IGDB, AniList, TMDB Séries).
        </p>
        <Link
          href="/library"
          className="text-sm text-primary hover:underline flex items-center gap-1 self-start"
        >
          Voir ma bibliothèque films <ArrowRight className="size-3.5" />
        </Link>
      </section>
    </div>
  );
}

function MediaTile({
  icon,
  label,
  percentage,
  real = false,
}: {
  icon: React.ReactNode;
  label: string;
  percentage: number;
  real?: boolean;
}) {
  return (
    <Card className={real ? "" : "opacity-70 border-dashed"}>
      <CardContent className="flex flex-col items-center gap-1 py-4">
        <div className="text-muted-foreground">{icon}</div>
        <div className="text-xl font-bold tabular-nums">{percentage}%</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {!real && <Badge variant="secondary" className="text-[10px] mt-1">simulé</Badge>}
      </CardContent>
    </Card>
  );
}

function getGreeting(name: string) {
  const hour = new Date().getHours();
  const prefix =
    hour < 6 ? "Bonne nuit" :
    hour < 12 ? "Bonjour" :
    hour < 18 ? "Bel après-midi" :
    "Bonsoir";
  return `${prefix} ${name}`.trim();
}
