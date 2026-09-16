import Image from "next/image";
import { type ReactNode } from "react";

interface GameTradingCardProps {
  title: string;
  cover: string;
  badge?: string;
  subText?: string;
  metaIcon: ReactNode;
  metaText: string;
  accent?: "coral" | "platinum";
}

const ACCENT_RING = {
  coral: "shadow-[0_0_0_1px_rgba(255,118,118,0.25)]",
  platinum: "shadow-[0_0_0_1px_rgba(147,171,209,0.25)]",
};

// One shared "trading card" look used everywhere on the Vault page —
// recently-played and the recommendation preview both render through this,
// so the page reads as one collection instead of two different card styles.
export default function GameTradingCard({
  title,
  cover,
  badge,
  subText,
  metaIcon,
  metaText,
  accent = "coral",
}: GameTradingCardProps) {
  return (
    <article
      className={`card-hover clip-notch-md relative flex h-full w-56 shrink-0 snap-start flex-col overflow-hidden border border-hairline bg-surface ${ACCENT_RING[accent]}`}
    >
      <div className="card-hover-art art-scanline relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-surface-2">
        <Image
          src={cover}
          alt={title}
          fill
          sizes="224px"
          className="object-cover"
          unoptimized={cover.endsWith(".svg")}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-void/30 to-transparent" />
        {badge && (
          <span
            className={`absolute right-2.5 top-2.5 rounded px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-md ${
              accent === "coral"
                ? "bg-coral-soft text-coral-ink"
                : "bg-platinum-soft text-platinum-ink"
            }`}
          >
            {badge}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="card-hover-title font-display text-sm font-semibold leading-snug text-ink line-clamp-2 transition-colors duration-200">
            {title}
          </h3>
        </div>
      </div>

      <div className="border-t border-hairline px-3 py-2.5">
        {subText && (
          <p className="mb-1 truncate text-[10px] text-ink-faint">{subText}</p>
        )}
        <div className="flex items-center gap-1.5 text-xs">
          <span className={accent === "coral" ? "text-coral" : "text-platinum"}>
            {metaIcon}
          </span>
          <span className="truncate font-semibold text-ink-dim">
            {metaText}
          </span>
        </div>
      </div>
    </article>
  );
}
