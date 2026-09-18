import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CatalogChangeCardProps {
  name: string;
  imageUrl: string | null;
  conceptUrl: string;
  changeType: "added" | "removed";
  detectedAt: string;
}

// Deliberately its own small component rather than reusing
// EssentialGameCard with extra props — that card's badge/CTA copy ("Free
// This Month" / "Claim on PS Store") and streaming-support row don't fit
// this dataset (a removed game has no streaming flag to show), and
// stretching one card to cover both would need more conditional branches
// than just having two simple cards.
export default function CatalogChangeCard({
  name,
  imageUrl,
  conceptUrl,
  changeType,
  detectedAt,
}: CatalogChangeCardProps) {
  const isAdded = changeType === "added";

  return (
    <a
      href={conceptUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full reveal"
    >
      <article
        className={`card-hover clip-notch-md relative flex h-full flex-col overflow-hidden border border-hairline bg-surface ${
          isAdded ? "" : "opacity-70"
        }`}
      >
        <div
          className={`absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-void/70 backdrop-blur-md border px-3 py-1 ${
            isAdded ? "border-coral/40" : "border-hairline-strong"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isAdded ? "bg-coral animate-ignite-pulse" : "bg-ink-faint"}`}
          />
          <span
            className={`font-display text-[10px] font-bold uppercase tracking-wider ${
              isAdded ? "text-coral-ink" : "text-ink-faint"
            }`}
          >
            {isAdded ? "New in Extra/Premium" : "Left Extra/Premium"}
          </span>
        </div>

        <div className="card-hover-art art-scanline relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-surface-2">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/85 via-transparent to-transparent" />
        </div>

        <div className="flex flex-1 flex-col justify-between p-5">
          <h3 className="card-hover-title font-display text-lg font-medium leading-snug text-ink line-clamp-2 transition-colors duration-200">
            {name}
          </h3>

          <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-xs">
            <span className="text-ink-faint">
              {formatDistanceToNow(new Date(detectedAt), { addSuffix: true })}
            </span>
            <span className="flex items-center gap-1 font-semibold text-coral">
              View on PS Store
              <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </div>
      </article>
    </a>
  );
}
