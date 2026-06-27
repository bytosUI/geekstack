"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Confirme une note "toujours d'accord" en bumpant updated_at à maintenant.
 * Effet : l'anniversaire ne re-déclenchera pas avant 1 an supplémentaire.
 */
export async function confirmAnniversary(movieId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("library_entries")
    .update({ updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("movie_id", movieId);

  if (error) return { error: error.message };
  revalidatePath("/");
  return { ok: true };
}
