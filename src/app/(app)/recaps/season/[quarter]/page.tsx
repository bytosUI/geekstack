import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  computeSeasonalRecap,
  isValidQuarter,
  seasonAccent,
  seasonName,
} from "@/lib/seasonal-recaps";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Film, Star, Sparkles, Calendar } from "lucide-react";
import { posterUrl } from "@/lib/tmdb";
import { SeasonShare } from "./season-share";
import type { MacroGenre } from "@/lib/macro-genres";

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

export default async function SeasonRecapPage({
  params,
  searchParams,
}: {
  params: Promise<{ quarter: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const [{ quarter }, { demo }] = await Promise.all([params, searchParams]);
  const isDemo = demo === "1";
  if (!isValidQuarter(quarter)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  let recap;
  if (isDemo) {
    const { DEMO_SEASONAL } = await import("@/lib/demo-data");
    recap = DEMO_SEASONAL;
  } else {
    recap = await computeSeasonalRecap(supabase, user.id, quarter);
  }
  if (!recap) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const accent = seasonAccent(recap.season);

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="self-start">
        <Link href={isDemo ? "/?demo=1" : "/"}>
          <ArrowLeft className="size-4" /> Retour
        </Link>
      </Button>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Badge style={{ backgroundColor: accent, color: "#fff" }}>
            <Sparkles className="size-3" /> Recap saisonnier
          </Badge>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold capitalize" style={{ color: accent }}>
          {seasonName(recap.season)}
        </h1>
        <p className="text-2xl text-muted-foreground">
          {recap.label.split(" ")[1]}
        </p>
        <p className="text-base">
          Tu étais un.e <span style={{ color: accent }} className="font-bold">{recap.persona.label}</span>
        </p>
        <p className="text-sm text-muted-foreground italic">« {recap.persona.tagline} »</p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <StatCard icon={<Film className="size-4" />} label="Films notés" value={String(recap.count)} />
        <StatCard
          icon={<Star className="size-4" />}
          label="Note moyenne"
          value={recap.avgRating !== null ? `${recap.avgRating}` : "—"}
          suffix={recap.avgRating !== null ? "/10" : undefined}
        />
        <StatCard icon={<Sparkles className="size-4" />} label="Genres" value={String(recap.topMacro.length)} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
          Tes genres de la saison
        </h2>
        <Card className="border-2">
          <CardContent className="flex flex-col gap-4 py-5">
            {recap.topMacro.map((row) => (
              <div key={row.macro} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{row.macro}</span>
                  <span className="text-muted-foreground tabular-nums">{row.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${row.percentage}%`,
                      backgroundColor: MACRO_COLORS[row.macro],
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {recap.topFilm && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
            Coup de cœur de la saison
          </h2>
          <Card>
            <CardContent className="flex gap-4 py-4">
              <div className="relative w-20 aspect-[2/3] rounded-md bg-muted overflow-hidden shrink-0">
                {recap.topFilm.poster_path && (
                  <Image
                    src={posterUrl(recap.topFilm.poster_path)!}
                    alt={recap.topFilm.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col gap-1 justify-center">
                <p className="font-bold text-lg">{recap.topFilm.title}</p>
                <Badge className="self-start">
                  <Star className="size-3" /> {recap.topFilm.rating}/10
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {recap.oldestDiscovery && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
            Voyage dans le temps
          </h2>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Calendar className="size-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm">
                  Plus ancienne découverte : <span className="font-bold">{recap.oldestDiscovery.title}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {recap.oldestDiscovery.release_year} · noté {recap.oldestDiscovery.rating}/10
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <SeasonShare username={profile?.username ?? ""} recap={recap} accent={accent} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-4">
        <div className="text-muted-foreground">{icon}</div>
        <div className="text-2xl font-bold tabular-nums">
          {value}
          {suffix && <span className="text-sm text-muted-foreground font-normal">{suffix}</span>}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
