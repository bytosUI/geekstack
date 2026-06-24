"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "a_voir", label: "À voir" },
  { value: "vu", label: "Vu" },
  { value: "abandonne", label: "Abandonné" },
] as const;

const SORT_OPTIONS = [
  { value: "added", label: "Récents" },
  { value: "rating", label: "Mieux notés" },
] as const;

export function LibraryControls({ status, sort }: { status: string; sort: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: "status" | "sort", value: string) {
    const next = new URLSearchParams(params.toString());
    if (key === "status" && value === "all") next.delete("status");
    else if (key === "sort" && value === "added") next.delete("sort");
    else next.set(key, value);
    const queryString = next.toString();
    router.push(`/library${queryString ? `?${queryString}` : ""}`);
  }

  return (
    <div className="flex flex-wrap gap-3 items-center justify-between border rounded-lg p-2">
      <div className="flex gap-1 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            size="sm"
            variant={status === opt.value ? "default" : "ghost"}
            onClick={() => update("status", opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      <div className="flex gap-1">
        {SORT_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            size="sm"
            variant={sort === opt.value ? "secondary" : "ghost"}
            onClick={() => update("sort", opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
