"use client";

import { useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { trackShareClick } from "./actions";
import type { GenreDnaRow } from "@/types/database";

const GENRE_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6",
  "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#a855f7",
];

export function DnaCard({
  dna,
  displayName,
  username,
}: {
  dna: GenreDnaRow[];
  displayName: string;
  username: string;
}) {
  const [pending, startTransition] = useTransition();
  const top = dna.slice(0, 8);

  function handleShare() {
    startTransition(async () => {
      void trackShareClick();
      try {
        const blob = await renderDnaToPng(displayName, username, top);
        const url = URL.createObjectURL(blob);

        // Tente le partage natif (mobile) sinon download
        const file = new File([blob], `adn-geek-${username}.png`, { type: "image/png" });
        if (
          typeof navigator !== "undefined" &&
          navigator.canShare?.({ files: [file] })
        ) {
          await navigator.share({ files: [file], title: "Mon ADN Geek" });
        } else {
          const a = document.createElement("a");
          a.href = url;
          a.download = `adn-geek-${username}.png`;
          a.click();
          toast.success("Carte téléchargée");
        }
        URL.revokeObjectURL(url);
      } catch (err) {
        toast.error("Export échoué", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  if (top.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ADN Geek</CardTitle>
          <CardDescription>
            Note au moins un film 7/10 ou plus pour révéler ton ADN Geek.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>ADN Geek</CardTitle>
          <CardDescription>
            Répartition par genre, films notés ≥ 7/10.
          </CardDescription>
        </div>
        <Button onClick={handleShare} disabled={pending} size="sm" variant="outline">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
          Partager
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {top.map((row, i) => (
          <div key={row.genre} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{row.genre}</span>
              <span className="text-muted-foreground">{row.percentage}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${row.percentage}%`,
                  backgroundColor: GENRE_COLORS[i % GENRE_COLORS.length],
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

async function renderDnaToPng(
  displayName: string,
  username: string,
  rows: GenreDnaRow[],
): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non supporté");

  // Background dégradé
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0f172a");
  bg.addColorStop(1, "#1e293b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("ADN GEEK", 80, 100);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "32px system-ui, -apple-system, sans-serif";
  ctx.fillText(`@${username}`, 80, 175);

  // Bars
  const startY = 320;
  const rowH = 110;
  const barH = 16;
  const barX = 80;
  const barW = W - 160;
  rows.forEach((row, i) => {
    const y = startY + i * rowH;
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
    ctx.fillText(row.genre, barX, y);
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "right";
    ctx.fillText(`${row.percentage}%`, barX + barW, y);
    ctx.textAlign = "left";

    ctx.fillStyle = "#334155";
    ctx.beginPath();
    roundRect(ctx, barX, y + 50, barW, barH, 8);
    ctx.fill();

    ctx.fillStyle = GENRE_COLORS[i % GENRE_COLORS.length];
    ctx.beginPath();
    roundRect(ctx, barX, y + 50, (barW * row.percentage) / 100, barH, 8);
    ctx.fill();
  });

  // Footer
  ctx.fillStyle = "#64748b";
  ctx.font = "24px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GeekStack — révèle ton ADN culturel", W / 2, H - 80);

  void displayName; // displayName réservé pour évolution future
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob a renvoyé null"))),
      "image/png",
    ),
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
}
