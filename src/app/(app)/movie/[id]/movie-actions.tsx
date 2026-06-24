"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { updateStatus, updateRating, removeFromLibrary } from "./actions";
import type { MovieStatus } from "@/types/database";

const STATUS_OPTIONS: { value: MovieStatus; label: string }[] = [
  { value: "a_voir", label: "À voir" },
  { value: "vu", label: "Vu" },
  { value: "abandonne", label: "Abandonné" },
];

export function MovieActions({
  movieId,
  currentStatus,
  currentRating,
}: {
  movieId: number;
  currentStatus: MovieStatus;
  currentRating: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);
  const [rating, setRating] = useState(currentRating);

  function handleStatus(newStatus: MovieStatus) {
    setStatus(newStatus);
    startTransition(async () => {
      const res = await updateStatus(movieId, newStatus);
      if (res?.error) {
        toast.error("Statut non sauvegardé", { description: res.error });
        setStatus(currentStatus);
      }
    });
  }

  function handleRating(newRating: number | null) {
    const previous = rating;
    setRating(newRating);
    startTransition(async () => {
      const res = await updateRating(movieId, newRating);
      if (res?.error) {
        toast.error("Note non sauvegardée", { description: res.error });
        setRating(previous);
      }
    });
  }

  function handleRemove() {
    if (!confirm("Retirer ce film de ta bibliothèque ?")) return;
    startTransition(async () => {
      const res = await removeFromLibrary(movieId);
      if (res?.error) toast.error("Suppression échouée", { description: res.error });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statut</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={status === opt.value ? "default" : "outline"}
              onClick={() => handleStatus(opt.value)}
              disabled={pending}
            >
              {opt.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="size-4" /> Ta note {rating !== null && <span className="text-primary">{rating}/10</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <Button
                key={n}
                size="sm"
                variant={rating === n ? "default" : "outline"}
                onClick={() => handleRating(n)}
                disabled={pending}
                className="size-9 p-0"
              >
                {n}
              </Button>
            ))}
            {rating !== null && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRating(null)}
                disabled={pending}
              >
                Effacer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        onClick={handleRemove}
        disabled={pending}
        className="self-end"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        Retirer de ma bibliothèque
      </Button>
    </div>
  );
}
