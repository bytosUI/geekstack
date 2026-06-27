"use server";

import { createClient } from "@/lib/supabase/server";
import type { EventType } from "@/types/database";

export async function logEvent(
  type: EventType,
  payload: Record<string, unknown> = {},
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("events")
    .insert({ user_id: user.id, type, payload });

  if (error) console.warn("[analytics] failed to log event", type, error.message);
}

export async function trackShareClick() {
  await logEvent("dna_share_clicked");
}
