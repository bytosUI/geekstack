import { NextResponse, type NextRequest } from "next/server";
import { searchMovies } from "@/lib/tmdb";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  if (query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchMovies(query);
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
