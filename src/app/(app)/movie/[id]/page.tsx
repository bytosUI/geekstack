import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { posterUrl } from "@/lib/tmdb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MovieActions } from "./movie-actions";
import type { LibraryEntry, Movie } from "@/types/database";

interface JoinedEntry extends LibraryEntry {
  movie: Movie;
}

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movieId = Number(id);
  if (!Number.isFinite(movieId)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: entry } = await supabase
    .from("library_entries")
    .select("*, movie:movies(*)")
    .eq("user_id", user.id)
    .eq("movie_id", movieId)
    .single<JoinedEntry>();

  if (!entry) notFound();

  const poster = posterUrl(entry.movie.poster_path, "w500");

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="self-start">
        <Link href="/library">
          <ArrowLeft className="size-4" /> Retour à la bibliothèque
        </Link>
      </Button>

      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        <div className="relative aspect-[2/3] bg-muted rounded-lg overflow-hidden">
          {poster ? (
            <Image
              src={poster}
              alt={entry.movie.title}
              fill
              sizes="(max-width: 768px) 100vw, 200px"
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
              Pas d&apos;affiche
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-3xl font-bold">{entry.movie.title}</h1>
            <p className="text-muted-foreground">
              {entry.movie.release_year ?? "Année inconnue"}
            </p>
          </div>

          {entry.movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entry.movie.genres.map((g) => (
                <Badge key={g} variant="secondary">{g}</Badge>
              ))}
            </div>
          )}

          {entry.movie.synopsis && (
            <Card>
              <CardContent className="pt-4 text-sm leading-relaxed">
                {entry.movie.synopsis}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <MovieActions
        movieId={movieId}
        currentStatus={entry.status}
        currentRating={entry.rating}
      />
    </div>
  );
}
