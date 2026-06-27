"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { trackShareClick } from "@/lib/analytics/log-event";
import type { MacroGenre } from "@/lib/macro-genres";

const COLORS = ["#092DE6", "#FF5B60", "#FF7A00", "#1F2937", "#4D6BFF", "#D93A3F"];

export function CrossMediaShare({
  username,
  personaLabel,
  dna,
}: {
  username: string;
  personaLabel: string;
  dna: { macro: MacroGenre; percentage: number }[];
}) {
  const [pending, startTransition] = useTransition();

  function handleShare() {
    startTransition(async () => {
      void trackShareClick();
      try {
        const blob = await renderUniverseToPng(username, personaLabel, dna);
        const file = new File([blob], `univers-${username}.png`, { type: "image/png" });
        if (
          typeof navigator !== "undefined" &&
          navigator.canShare?.({ files: [file] })
        ) {
          await navigator.share({ files: [file], title: `Mon univers — @${username}` });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `univers-${username}.png`;
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
      className="w-full md:w-auto md:self-end mt-2"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
      Partager mon univers
    </Button>
  );
}

async function renderUniverseToPng(
  username: string,
  personaLabel: string,
  rows: { macro: MacroGenre; percentage: number }[],
): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non supporté");

  ctx.fillStyle = "#F9FAFB";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#092DE6";
  ctx.fillRect(0, 0, 32, H);

  ctx.fillStyle = "#9CA3AF";
  ctx.font = "600 28px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("MON UNIVERS", 100, 100);

  ctx.fillStyle = "#0F0F11";
  ctx.font = "700 84px system-ui, -apple-system, sans-serif";
  ctx.fillText(personaLabel.toUpperCase(), 100, 160);

  ctx.fillStyle = "#092DE6";
  ctx.font = "500 36px system-ui, -apple-system, sans-serif";
  ctx.fillText(`@${username}`, 100, 270);

  const startY = 400;
  const rowH = 110;
  const barH = 16;
  const barX = 100;
  const barW = W - 200;

  rows.slice(0, 6).forEach((row, i) => {
    const y = startY + i * rowH;
    ctx.fillStyle = "#0F0F11";
    ctx.font = "600 32px system-ui, -apple-system, sans-serif";
    ctx.fillText(row.macro, barX, y);
    ctx.fillStyle = "#6B7280";
    ctx.textAlign = "right";
    ctx.fillText(`${row.percentage}%`, barX + barW, y);
    ctx.textAlign = "left";

    ctx.fillStyle = "#E5E7EB";
    ctx.beginPath();
    roundRect(ctx, barX, y + 50, barW, barH, 8);
    ctx.fill();

    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.beginPath();
    roundRect(ctx, barX, y + 50, (barW * row.percentage) / 100, barH, 8);
    ctx.fill();
  });

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
