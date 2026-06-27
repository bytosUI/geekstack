"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/analytics/log-event";
import type { MovieStatus } from "@/types/database";

export async function updateStatus(movieId: number, status: MovieStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("library_entries")
    .update({ status })
    .eq("user_id", user.id)
    .eq("movie_id", movieId);

  if (error) return { error: error.message };
  revalidatePath(`/movie/${movieId}`);
  revalidatePath("/library");
  return { ok: true };
}

export async function updateRating(movieId: number, rating: number | null) {
  if (rating !== null && (rating < 1 || rating > 10)) {
    return { error: "La note doit être entre 1 et 10" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("library_entries")
    .update({ rating })
    .eq("user_id", user.id)
    .eq("movie_id", movieId);

  if (error) return { error: error.message };

  // Toute modif de note peut changer l'ADN (vue user_genre_dna filtre rating >= 7)
  await logEvent("dna_regenerated", { movie_id: movieId, new_rating: rating });

  revalidatePath(`/movie/${movieId}`);
  revalidatePath("/library");
  revalidatePath("/");
  return { ok: true };
}

export async function removeFromLibrary(movieId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("library_entries")
    .delete()
    .eq("user_id", user.id)
    .eq("movie_id", movieId);

  if (error) return { error: error.message };
  revalidatePath("/library");
  revalidatePath("/");
  redirect("/library");
}
