"use server";

import { logEvent } from "@/lib/analytics/log-event";

export async function trackShareClick() {
  await logEvent("dna_share_clicked");
}
