"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMovieDetails, releaseYear } from "@/lib/tmdb";
import { logEvent } from "@/lib/analytics/log-event";

export async function addToLibrary(tmdbMovieId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  // 1. Récupère et upsert dans le cache movies
  let movieRow;
  try {
    const details = await getMovieDetails(tmdbMovieId);
    movieRow = {
      id: details.id,
      title: details.title,
      release_year: releaseYear(details.release_date),
      poster_path: details.poster_path,
      genres: details.genres.map((g) => g.name),
      synopsis: details.overview,
      cached_at: new Date().toISOString(),
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Récupération TMDB échouée" };
  }

  const { error: movieErr } = await supabase.from("movies").upsert(movieRow);
  if (movieErr) return { error: movieErr.message };

  // 2. Crée l'entrée bibliothèque (statut par défaut "à voir")
  const { error: entryErr } = await supabase.from("library_entries").insert({
    user_id: user.id,
    movie_id: tmdbMovieId,
    status: "a_voir",
  });

  if (entryErr) {
    if (entryErr.code === "23505") return { error: "Ce film est déjà dans ta bibliothèque." };
    return { error: entryErr.message };
  }

  await logEvent("movie_added", { movie_id: tmdbMovieId, title: movieRow.title });

  revalidatePath("/library");
  return { ok: true, title: movieRow.title };
}
