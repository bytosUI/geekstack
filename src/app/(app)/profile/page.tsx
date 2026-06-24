import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, Star, Trophy } from "lucide-react";
import { DnaCard } from "./dna-card";
import type { GenreDnaRow, LibraryEntry } from "@/types/database";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: entries }, { data: dna }] = await Promise.all([
    supabase.from("profiles").select("username, display_name, avatar_url").eq("id", user.id).single(),
    supabase
      .from("library_entries")
      .select("status, rating, movie:movies(genres)")
      .eq("user_id", user.id)
      .returns<(Pick<LibraryEntry, "status" | "rating"> & { movie: { genres: string[] } })[]>(),
    supabase
      .from("user_genre_dna")
      .select("*")
      .eq("user_id", user.id)
      .order("percentage", { ascending: false })
      .returns<GenreDnaRow[]>(),
  ]);

  const watched = entries?.filter((e) => e.status === "vu") ?? [];
  const ratedCount = entries?.filter((e) => e.rating !== null).length ?? 0;
  const avgRating =
    ratedCount > 0
      ? (
          (entries ?? []).reduce((sum, e) => sum + (e.rating ?? 0), 0) / ratedCount
        ).toFixed(1)
      : null;

  const genreCounts = new Map<string, number>();
  for (const e of watched) {
    for (const g of e.movie.genres) {
      genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    }
  }
  const topGenre = [...genreCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const displayName = profile?.display_name || profile?.username || "—";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{displayName}</h1>
        {profile && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Film className="size-5" />} label="Films vus" value={watched.length} />
        <StatCard icon={<Star className="size-5" />} label="Note moyenne" value={avgRating ?? "—"} suffix={avgRating ? "/10" : undefined} />
        <StatCard icon={<Trophy className="size-5" />} label="Genre préféré" value={topGenre ?? "—"} />
      </div>

      <DnaCard dna={dna ?? []} displayName={displayName} username={profile?.username ?? ""} />
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
  value: string | number;
  suffix?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2 font-medium">
          {icon} {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {suffix && <span className="text-sm text-muted-foreground font-normal">{suffix}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
