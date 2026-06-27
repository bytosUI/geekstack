"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { posterUrl } from "@/lib/tmdb";
import { confirmAnniversary } from "./anniversary-actions";
import type { Anniversary } from "@/lib/anniversaries";

export function AnniversaryCard({ anniversary }: { anniversary: Anniversary }) {
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const res = await confirmAnniversary(anniversary.movieId);
      if (res?.error) {
        toast.error("Impossible de sauvegarder", { description: res.error });
        return;
      }
      toast.success("Note confirmée", {
        description: `${anniversary.title} reste à ${anniversary.rating}/10`,
      });
    });
  }

  return (
    <Card className="border-2">
      <CardContent className="flex gap-4 py-5">
        <Link
          href={`/movie/${anniversary.movieId}`}
          className="relative w-16 h-24 rounded-md bg-muted overflow-hidden shrink-0 self-start"
        >
          {anniversary.posterPath && (
            <Image
              src={posterUrl(anniversary.posterPath)!}
              alt={anniversary.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          )}
        </Link>
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              {anniversary.windowLabel}
            </p>
            <p className="text-base font-medium leading-tight">
              Tu notais{" "}
              <Link href={`/movie/${anniversary.movieId}`} className="hover:underline">
                {anniversary.title}
              </Link>{" "}
              <span className="inline-flex items-center gap-0.5 text-primary font-bold ml-1">
                <Star className="size-3.5 fill-current" />
                {anniversary.rating}/10
              </span>
            </p>
            <p className="text-sm text-muted-foreground">Toujours d&apos;accord ?</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            <Button
              size="sm"
              variant="default"
              onClick={handleConfirm}
              disabled={pending}
            >
              {pending && <Loader2 className="size-3.5 animate-spin" />}
              Toujours d&apos;accord
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/movie/${anniversary.movieId}`}>Re-noter</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
