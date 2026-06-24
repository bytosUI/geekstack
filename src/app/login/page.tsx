import { Suspense } from "react";
import { LoginCard } from "./login-card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Chargement…</div>}>
        <LoginCard />
      </Suspense>
    </main>
  );
}
