"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { setUsername } from "./actions";

function suggestUsername(email: string | null) {
  if (!email) return "";
  return email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24);
}

export function OnboardingForm({
  suggestedFromEmail,
  currentDisplayName,
}: {
  suggestedFromEmail: string | null;
  currentDisplayName: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await setUsername(formData);
      if (result?.error) setError(result.error);
      // En cas de succès, la server action redirige vers /library
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Choisis ton username</CardTitle>
        <CardDescription>
          C&apos;est ton identifiant public, utilisé pour ton profil. Tu pourras le changer plus tard.
        </CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">@</span>
              <Input
                id="username"
                name="username"
                defaultValue={suggestUsername(suggestedFromEmail)}
                placeholder="thibaut_pouyet"
                autoComplete="off"
                autoFocus
                required
                minLength={3}
                maxLength={24}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              3-24 caractères, lettres, chiffres et underscore uniquement.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="display_name">Nom affiché (optionnel)</Label>
            <Input
              id="display_name"
              name="display_name"
              defaultValue={currentDisplayName ?? ""}
              placeholder="Thibaut"
              maxLength={48}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending} className="w-full">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Continuer
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
