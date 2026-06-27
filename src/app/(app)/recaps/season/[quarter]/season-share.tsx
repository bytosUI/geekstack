"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { trackShareClick } from "@/lib/analytics/log-event";
import { seasonName, type SeasonalRecap } from "@/lib/seasonal-recaps";

export function SeasonShare({
  username,
  recap,
  accent,
}: {
  username: string;
  recap: SeasonalRecap;
  accent: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleShare() {
    startTransition(async () => {
      void trackShareClick();
      try {
        const blob = await renderSeasonToPng(username, recap, accent);
        const file = new File([blob], `saison-${recap.quarter}-${username}.png`, {
          type: "image/png",
        });
        if (
          typeof navigator !== "undefined" &&
          navigator.canShare?.({ files: [file] })
        ) {
          await navigator.share({ files: [file], title: `Ma ${recap.label}` });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `saison-${recap.quarter}-${username}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("Carte téléchargée");
        }
      } catch (err) {
        toast.error("Export échoué", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <Button
      size="lg"
      onClick={handleShare}
      disabled={pending}
      style={{ backgroundColor: accent }}
      className="w-full md:w-auto md:self-end text-white hover:opacity-90"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
      Partager ma saison
    </Button>
  );
}

async function renderSeasonToPng(
  username: string,
  recap: SeasonalRecap,
  accent: string,
): Promise<Blob> {
  // Format Story Insta : 1080×1920
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non supporté");

  // BG sombre uni
  ctx.fillStyle = "#0F0F11";
  ctx.fillRect(0, 0, W, H);

  // Bande verticale d'accent à gauche
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 40, H);

  // En-tête
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "600 32px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("RECAP SAISONNIER", 100, 120);

  // Saison — énorme
  ctx.fillStyle = accent;
  ctx.font = "900 220px system-ui, -apple-system, sans-serif";
  ctx.fillText(seasonName(recap.season).toUpperCase(), 100, 180);

  // Année
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 80px system-ui, -apple-system, sans-serif";
  const year = recap.label.split(" ")[1] ?? "";
  ctx.fillText(year, 100, 420);

  // Username
  ctx.fillStyle = accent;
  ctx.font = "500 40px system-ui, -apple-system, sans-serif";
  ctx.fillText(`@${username}`, 100, 540);

  // Persona
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "500 28px system-ui, -apple-system, sans-serif";
  ctx.fillText("TU ÉTAIS UN.E", 100, 700);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 88px system-ui, -apple-system, sans-serif";
  ctx.fillText(recap.persona.label, 100, 745);
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "italic 30px system-ui, -apple-system, sans-serif";
  wrapText(ctx, `« ${recap.persona.tagline} »`, 100, 870, W - 200, 38);

  // Stats compactes
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 96px system-ui, -apple-system, sans-serif";
  ctx.fillText(String(recap.count), 100, 1010);
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "500 26px system-ui, -apple-system, sans-serif";
  ctx.fillText("FILMS", 100, 1115);

  if (recap.avgRating !== null) {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 96px system-ui, -apple-system, sans-serif";
    ctx.fillText(`${recap.avgRating}`, 380, 1010);
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "500 26px system-ui, -apple-system, sans-serif";
    ctx.fillText("NOTE MOYENNE", 380, 1115);
  }

  // Genres
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "500 26px system-ui, -apple-system, sans-serif";
  ctx.fillText("TES GENRES", 100, 1220);

  const startY = 1280;
  const rowH = 90;
  const barH = 14;
  const barX = 100;
  const barW = W - 200;
  recap.topMacro.slice(0, 4).forEach((row, i) => {
    const y = startY + i * rowH;
    ctx.fillStyle = "#F9FAFB";
    ctx.font = "600 32px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(row.macro as string, barX, y);
    ctx.fillStyle = "#9CA3AF";
    ctx.textAlign = "right";
    ctx.fillText(`${row.percentage}%`, barX + barW, y);
    ctx.textAlign = "left";

    ctx.fillStyle = "#3D3D42";
    ctx.beginPath();
    roundRect(ctx, barX, y + 45, barW, barH, 7);
    ctx.fill();

    ctx.fillStyle = accent;
    ctx.beginPath();
    roundRect(ctx, barX, y + 45, (barW * row.percentage) / 100, barH, 7);
    ctx.fill();
  });

  // Coup de cœur si dispo
  if (recap.topFilm) {
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "500 26px system-ui, -apple-system, sans-serif";
    ctx.fillText("COUP DE CŒUR", 100, 1660);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 44px system-ui, -apple-system, sans-serif";
    wrapText(ctx, recap.topFilm.title, 100, 1700, W - 200, 50);
  }

  // Footer
  ctx.fillStyle = "#6B7280";
  ctx.font = "500 24px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("geekstack.vercel.app", W / 2, H - 80);

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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, curY);
      line = words[i] + " ";
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line.trim(), x, curY);
}
