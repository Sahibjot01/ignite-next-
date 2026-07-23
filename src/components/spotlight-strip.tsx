"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Game, imageResizeURL } from "@/lib/rawg";

const AUTO_ADVANCE_MS = 5000;
const EASE = [0.2, 0.7, 0.3, 1] as const;

interface SpotlightStripProps {
  games: Game[];
}

export default function SpotlightStrip({ games }: SpotlightStripProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion || games.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % games.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion, games.length]);

  if (games.length === 0) return null;

  const game = games[index];
  const resizedImage = imageResizeURL(game.background_image, 1280) || "/icons/gamepad.svg";

  return (
    <div
      className="clip-notch-lg relative overflow-hidden border border-hairline bg-surface"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={game.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative h-[260px] sm:h-[320px]"
        >
          <Image
            src={resizedImage}
            alt={game.name}
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized={resizedImage.endsWith(".svg")}
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-void/70 via-transparent to-transparent" />

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 sm:p-8">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-coral">
              Spotlight
            </p>
            <Link href={`/game/${game.id}`} className="group w-fit">
              <h3 className="font-display text-2xl font-medium text-ink transition-colors duration-200 group-hover:text-coral sm:text-4xl">
                {game.name}
              </h3>
            </Link>
            <div className="flex items-center gap-4 text-sm text-ink-dim">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {game.rating ? game.rating.toFixed(1) : "N/A"}
              </span>
              <span>{game.released || "TBA"}</span>
            </div>
            <Link
              href={`/game/${game.id}`}
              className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-bold text-void transition-colors duration-200 hover:bg-coral-ink"
            >
              View details
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {games.length > 1 && (
        <div className="absolute right-5 top-5 flex gap-1.5 sm:right-6 sm:top-6">
          {games.map((g, i) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to spotlight slide ${i + 1}: ${g.name}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-coral" : "w-1.5 bg-ink-faint/60 hover:bg-ink-dim"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
