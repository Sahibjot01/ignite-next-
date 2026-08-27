import Image from "next/image";
import { ExternalLink, Radio } from "lucide-react";
import { RawGame } from "@/lib/ps-plus";
import { format } from "date-fns";

interface EssentialGameCardProps {
  game: RawGame;
}

export default function EssentialGameCard({ game }: EssentialGameCardProps) {
  return (
    <a
      href={game.conceptUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full reveal"
    >
      <article className="card-hover clip-notch-md relative flex h-full flex-col overflow-hidden border border-hairline bg-surface">
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-void/70 backdrop-blur-md border border-coral/40 px-3 py-1 animate-ignite-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-coral" />
          <span className="font-display text-[10px] font-bold uppercase tracking-wider text-coral-ink">
            Free This Month
          </span>
        </div>

        <div className="card-hover-art art-scanline relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-surface-2">
          <Image
            src={game.imageUrl}
            alt={game.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/85 via-transparent to-transparent" />
        </div>

        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <h3 className="card-hover-title font-display text-lg font-medium leading-snug text-ink line-clamp-2 transition-colors duration-200">
              {game.name}
            </h3>
            <p className="mt-1.5 text-xs text-ink-faint">
              {game.releaseDate
                ? `Released ${format(new Date(game.releaseDate), "MMM d, yyyy")}`
                : "N/A"}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-xs">
            {game.streamingSupported ? (
              <span className="flex items-center gap-1.5 text-ink-dim">
                <Radio className="h-3.5 w-3.5 text-platinum" />
                Cloud streaming
              </span>
            ) : (
              <span />
            )}
            <span className="flex items-center gap-1 font-semibold text-coral">
              Claim on PS Store
              <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </div>
      </article>
    </a>
  );
}
