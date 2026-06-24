import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const hasRealUsername = !/^user_[0-9a-f]{8}$/.test(profile.username);
  if (hasRealUsername) redirect("/library");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <OnboardingForm
        suggestedFromEmail={user.email ?? null}
        currentDisplayName={profile.display_name}
      />
    </main>
  );
}
