import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "./nav";
import { SessionTracker } from "./session-tracker";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const hasRealUsername = !/^user_[0-9a-f]{8}$/.test(profile.username);
  if (!hasRealUsername) redirect("/onboarding");

  return (
    <div className="flex flex-col min-h-screen">
      <AppNav profile={profile} />
      <SessionTracker />
      <div className="flex-1 container mx-auto max-w-5xl p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}
