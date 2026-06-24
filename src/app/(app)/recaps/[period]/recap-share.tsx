"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { trackShareClick } from "../../profile/actions";
import type { MonthlyRecap } from "@/lib/recaps";
import type { MacroGenre } from "@/lib/macro-genres";

const COLORS = ["#092DE6", "#FF5B60", "#FF7A00", "#1F2937"];

export function RecapShare({
  username,
  recap,
}: {
  username: string;
  recap: MonthlyRecap;
}) {
  const [pending, startTransition] = useTransition();

  function handleShare() {
    startTransition(async () => {
      void trackShareClick();
      try {
        const blob = await renderRecapToPng(username, recap);
        const file = new File([blob], `recap-${recap.period}-${username}.png`, { type: "image/png" });
        if (
          typeof navigator !== "undefined" &&
          navigator.canShare?.({ files: [file] })
        ) {
          await navigator.share({ files: [file], title: `Mon recap ${recap.label}` });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `recap-${recap.period}-${username}.png`;
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
      className="w-full md:w-auto md:self-end"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
      Partager mon recap
    </Button>
  );
}

async function renderRecapToPng(username: string, recap: MonthlyRecap): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non supporté");

  // BG
  ctx.fillStyle = "#0F0F11";
  ctx.fillRect(0, 0, W, H);

  // Accent bar
  ctx.fillStyle = "#FF5B60";
  ctx.fillRect(0, 0, W, 24);

  // Header
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "600 28px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("MON RECAP", 100, 100);

  ctx.fillStyle = "#F9FAFB";
  ctx.font = "700 96px system-ui, -apple-system, sans-serif";
  const labelUC = recap.label.toUpperCase();
  ctx.fillText(labelUC, 100, 150);

  ctx.fillStyle = "#FF5B60";
  ctx.font = "500 36px system-ui, -apple-system, sans-serif";
  ctx.fillText(`@${username}`, 100, 280);

  // Stats grid
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 72px system-ui, -apple-system, sans-serif";
  ctx.fillText(String(recap.count), 100, 380);
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "500 22px system-ui, -apple-system, sans-serif";
  ctx.fillText("FILMS", 100, 460);

  if (recap.avgRating !== null) {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 72px system-ui, -apple-system, sans-serif";
    ctx.fillText(`${recap.avgRating}`, 400, 380);
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "500 22px system-ui, -apple-system, sans-serif";
    ctx.fillText("NOTE MOYENNE", 400, 460);
  }

  // Persona
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "500 24px system-ui, -apple-system, sans-serif";
  ctx.fillText("TU ÉTAIS UN.E", 100, 560);
  ctx.fillStyle = "#FF5B60";
  ctx.font = "700 64px system-ui, -apple-system, sans-serif";
  ctx.fillText(recap.persona.label, 100, 595);

  // Genres
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "500 22px system-ui, -apple-system, sans-serif";
  ctx.fillText("TES GENRES", 100, 750);

  const startY = 800;
  const rowH = 80;
  const barH = 12;
  const barX = 100;
  const barW = W - 200;
  recap.topMacro.slice(0, 4).forEach((row, i) => {
    const y = startY + i * rowH;
    ctx.fillStyle = "#F9FAFB";
    ctx.font = "600 28px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(row.macro as string, barX, y);
    ctx.fillStyle = "#9CA3AF";
    ctx.textAlign = "right";
    ctx.fillText(`${row.percentage}%`, barX + barW, y);
    ctx.textAlign = "left";

    ctx.fillStyle = "#3D3D42";
    ctx.beginPath();
    roundRect(ctx, barX, y + 40, barW, barH, 6);
    ctx.fill();

    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.beginPath();
    roundRect(ctx, barX, y + 40, (barW * row.percentage) / 100, barH, 6);
    ctx.fill();
  });

  // Footer
  ctx.fillStyle = "#6B7280";
  ctx.font = "500 22px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("geekstack.vercel.app", W / 2, H - 70);

  // Avoid unused tag of MacroGenre
  void ([] as MacroGenre[]);

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
