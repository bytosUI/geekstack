"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/;

export async function setUsername(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!USERNAME_REGEX.test(username)) {
    return { error: "Le username doit faire 3 à 24 caractères (lettres, chiffres, underscore)." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Session expirée, reconnecte-toi." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName || null,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ce username est déjà pris, choisis-en un autre." };
    }
    return { error: error.message };
  }

  redirect("/library");
}
