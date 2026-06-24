"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Search as SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { posterUrl } from "@/lib/tmdb";
import { addToLibrary } from "./actions";
import type { TmdbSearchResult } from "@/lib/tmdb";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Recherche échouée");
        const data = await res.json();
        setResults(data.results ?? []);
      } catch (err) {
        toast.error("Erreur de recherche", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  function handleAdd(movie: TmdbSearchResult) {
    setAddingId(movie.id);
    startTransition(async () => {
      const res = await addToLibrary(movie.id);
      setAddingId(null);
      if (res.error) {
        toast.error("Ajout impossible", { description: res.error });
        return;
      }
      setAddedIds((prev) => new Set(prev).add(movie.id));
      toast.success(`Ajouté : ${res.title}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Rechercher un film</h1>
        <p className="text-sm text-muted-foreground">
          Tape au moins 2 caractères. Les résultats viennent de TMDB.
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Inception, Le Voyage de Chihiro..."
          className="pl-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {results.map((movie) => {
          const poster = posterUrl(movie.poster_path);
          const year = movie.release_date ? movie.release_date.slice(0, 4) : "—";
          const isAdded = addedIds.has(movie.id);
          const isAdding = addingId === movie.id && pending;
          return (
            <Card key={movie.id} className="overflow-hidden flex flex-col gap-0 p-0">
              <div className="relative aspect-[2/3] bg-muted">
                {poster ? (
                  <Image
                    src={poster}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                    Pas d&apos;affiche
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div className="flex-1">
                  <div className="font-medium text-sm line-clamp-2" title={movie.title}>
                    {movie.title}
                  </div>
                  <div className="text-xs text-muted-foreground">{year}</div>
                </div>
                <Button
                  size="sm"
                  variant={isAdded ? "secondary" : "default"}
                  onClick={() => handleAdd(movie)}
                  disabled={isAdding || isAdded}
                  className="w-full"
                >
                  {isAdding && <Loader2 className="size-3 animate-spin" />}
                  {isAdded ? "Ajouté ✓" : (
                    <>
                      <Plus className="size-3" />
                      Ajouter
                    </>
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">Aucun résultat.</p>
      )}
    </div>
  );
}
