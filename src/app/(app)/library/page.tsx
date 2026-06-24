import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { posterUrl } from "@/lib/tmdb";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LibraryControls } from "./library-controls";
import { Star } from "lucide-react";
import type { LibraryEntry, Movie, MovieStatus } from "@/types/database";

interface JoinedEntry extends LibraryEntry {
  movie: Movie;
}

type StatusFilter = MovieStatus | "all";
type SortKey = "added" | "rating";

const STATUS_LABEL: Record<MovieStatus, string> = {
  a_voir: "À voir",
  vu: "Vu",
  abandonne: "Abandonné",
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const statusFilter: StatusFilter =
    params.status === "a_voir" || params.status === "vu" || params.status === "abandonne"
      ? params.status
      : "all";
  const sortKey: SortKey = params.sort === "rating" ? "rating" : "added";

  const supabase = await createClient();
  let query = supabase
    .from("library_entries")
    .select("*, movie:movies(*)");

  if (statusFilter !== "all") query = query.eq("status", statusFilter);

  if (sortKey === "rating") {
    query = query.order("rating", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("added_at", { ascending: false });
  }

  const { data, error } = await query.returns<JoinedEntry[]>();
  if (error) {
    return <p className="text-destructive">Erreur de chargement : {error.message}</p>;
  }

  const entries = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Ma bibliothèque</h1>
          <p className="text-sm text-muted-foreground">
            {entries.length} film{entries.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/search">+ Ajouter un film</Link>
        </Button>
      </div>

      <LibraryControls status={statusFilter} sort={sortKey} />

      {entries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-4">
            {statusFilter === "all"
              ? "Ta bibliothèque est vide."
              : `Aucun film "${STATUS_LABEL[statusFilter as MovieStatus]}".`}
          </p>
          <Button asChild variant="outline">
            <Link href="/search">Cherche ton premier film</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/movie/${entry.movie_id}`}
              className="block group"
            >
              <Card className="overflow-hidden flex flex-col gap-0 p-0 transition group-hover:ring-2 group-hover:ring-primary/40">
                <div className="relative aspect-[2/3] bg-muted">
                  {entry.movie.poster_path ? (
                    <Image
                      src={posterUrl(entry.movie.poster_path)!}
                      alt={entry.movie.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                      Pas d&apos;affiche
                    </div>
                  )}
                  <Badge
                    className="absolute top-2 left-2"
                    variant={entry.status === "vu" ? "default" : "secondary"}
                  >
                    {STATUS_LABEL[entry.status]}
                  </Badge>
                  {entry.rating !== null && (
                    <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur rounded-md px-2 py-0.5 text-xs flex items-center gap-1 font-medium">
                      <Star className="size-3 fill-current" />
                      {entry.rating}
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="font-medium text-sm line-clamp-2" title={entry.movie.title}>
                    {entry.movie.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.movie.release_year ?? "—"}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
