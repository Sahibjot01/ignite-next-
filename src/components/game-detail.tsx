"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Star,
  Heart,
  Sparkles,
  Check,
  Plus,
  Loader2,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { motion, type Variants } from "motion/react";
import { Game, GameScreenshot, imageResizeURL } from "@/lib/rawg";
import { type PsStoreEdition } from "@/lib/ps-store";
import { PriceAlert } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import PriceAlertForm from "./price-alert-form";
import { useWishlistToggle } from "@/hooks/use-wishlist-toggle";

const EASE = [0.2, 0.7, 0.3, 1] as const;

interface GameDetailProps {
  game: Game;
  screenshots: GameScreenshot[];
  initialWishlistStatus: boolean;
  editions: PsStoreEdition[];
  initialPriceAlert: PriceAlert | null;
}
const getPlatformIcon = (platformName: string) => {
  const name = platformName.toLowerCase();
  return name.includes("playstation")
    ? "/icons/playstation.svg"
    : "/icons/gamepad.svg";
};

export default function GameDetail({
  game,
  screenshots,
  initialWishlistStatus,
  editions,
  initialPriceAlert,
}: GameDetailProps) {
  const { isSignedIn } = useUser();
  const [editionIndex, setEditionIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxOpen = lightboxIndex !== null;
  const screenshotCount = screenshots?.length ?? 0;

  useEffect(() => {
    if (!lightboxOpen || screenshotCount === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i === null ? i : (i + 1) % screenshotCount));
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((i) =>
          i === null ? i : (i - 1 + screenshotCount) % screenshotCount,
        );
      }
    };
    // Capture phase on purpose: a real key press while the dialog has focus
    // never bubbles up to window (the dialog stops it), so a bubble-phase
    // listener only ever worked for synthetic events dispatched on window.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [lightboxOpen, screenshotCount]);
  const psPrice = editions[editionIndex]?.price ?? null;
  // Alerts always track Standard (editions[0]) regardless of what's being
  // viewed here — per-edition alert tracking needs its own schema decision.
  const standardPrice = editions[0]?.price ?? null;
  const { isMutating, isWishlisted, toggle } = useWishlistToggle(
    game.id,
    game.name,
    game.background_image,
    initialWishlistStatus,
  );
  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) return; // Handled by Clerk SignInButton for guests
    toggle();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const roundedRating = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4.5 w-4.5 ${
            i <= roundedRating
              ? "text-amber-400 fill-amber-400"
              : "text-ink-faint"
          }`}
        />,
      );
    }
    return stars;
  };

  // Motion reveal variants — shared ignite ease for a consistent motion signature
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-8 lg:grid-cols-3"
    >
      {/* Left column: title, description, screenshots */}
      <div className="lg:col-span-2 space-y-8">
        {/* Title, rating, platforms */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {game.metacritic && (
              <div
                className={`rounded border px-2 py-0.5 text-xs font-bold ${
                  game.metacritic >= 75
                    ? "border-green-800 bg-green-950/80 text-green-400"
                    : game.metacritic >= 50
                      ? "border-amber-800 bg-amber-950/80 text-amber-400"
                      : "border-red-800 bg-red-950/80 text-red-400"
                }`}
              >
                Metacritic {game.metacritic}
              </div>
            )}
            {game.released && (
              <div className="rounded-full border border-hairline bg-surface-2 px-3 py-1 text-xs font-semibold text-ink-dim">
                Released: {game.released}
              </div>
            )}
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
            {game.name}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-hairline py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink-dim">Rating:</span>
              <div className="flex items-center">
                {renderStars(game.rating)}
              </div>
              <span className="pl-1 text-xs font-semibold text-ink-faint">
                ({game.ratings_count} votes)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-ink-dim">
                Platforms:
              </span>
              <div className="flex items-center gap-2 rounded-full border border-hairline bg-surface-2 px-3 py-1.5">
                {game.platforms
                  ?.filter((data) =>
                    data.platform.name.toLowerCase().includes("playstation"),
                  )
                  .slice(0, 5)
                  .map((data) => (
                    <div
                      key={data.platform.id}
                      className="relative h-4.5 w-4.5 text-ink-dim"
                      title={data.platform.name}
                    >
                      <Image
                        src={getPlatformIcon(data.platform.name)}
                        alt={data.platform.name}
                        fill
                        className="object-contain filter invert opacity-80"
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div variants={itemVariants} className="space-y-4">
          <SectionLabel>About</SectionLabel>
          <p className="max-w-none whitespace-pre-line text-sm leading-relaxed text-ink-dim">
            {game.description_raw || "No description available for this game."}
          </p>
        </motion.div>

        {/* Screenshots Gallery */}
        {screenshots && screenshots.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-4">
            <SectionLabel>Screenshots</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {screenshots.map((screen, i) => (
                <button
                  type="button"
                  key={screen.id}
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`Enlarge screenshot ${i + 1} of ${screenshots.length}`}
                  className="card-hover clip-notch-md relative block aspect-[16/10] w-full cursor-zoom-in overflow-hidden border border-hairline bg-surface-2 focus-visible:outline-2 focus-visible:outline-coral"
                >
                  <div className="card-hover-art relative h-full w-full">
                    <Image
                      src={imageResizeURL(screen.image, 1280)}
                      alt={`${game.name} screenshot`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Right column: cover, wishlist CTA, deals, alerts, price chart (sticky) */}
      <div className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
        {/* Main Cover Image */}
        <motion.div
          variants={itemVariants}
          className="art-scanline clip-notch-lg relative aspect-[16/10] overflow-hidden border border-hairline bg-surface-2"
        >
          <Image
            src={
              imageResizeURL(game.background_image, 1280) ||
              "/icons/gamepad.svg"
            }
            alt={game.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-transparent" />
        </motion.div>

        {/* Wishlist Button */}
        <motion.div variants={itemVariants}>
          {isSignedIn ? (
            <Button
              disabled={isMutating}
              onClick={handleWishlistToggle}
              className={`flex h-12 w-full items-center justify-center gap-2 rounded-full font-bold transition-colors duration-200 ${
                isWishlisted
                  ? "border border-hairline-strong bg-surface-2 text-coral hover:bg-surface-3"
                  : "bg-coral text-void hover:bg-[#ff5858]"
              }`}
            >
              {isMutating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isWishlisted ? (
                <>
                  <Check className="h-5 w-5 stroke-[2.5]" />
                  Wishlisted
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 stroke-[2.5]" />
                  Add to Wishlist
                </>
              )}
            </Button>
          ) : (
            <SignInButton mode="modal" forceRedirectUrl={`/game/${game.id}`}>
              <Button className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-coral font-bold text-void hover:bg-[#ff5858]">
                <Heart className="h-5 w-5" />
                Sign In to Save
              </Button>
            </SignInButton>
          )}
        </motion.div>

        {/* PlayStation Store Price */}
        <motion.div variants={itemVariants}>
          <div className="clip-notch-sm border border-hairline bg-surface p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="font-display text-sm font-semibold text-ink">
                PlayStation Store Price
              </h3>
            </div>
            {editions.length > 1 && (
              <select
                value={editionIndex}
                onChange={(e) => setEditionIndex(Number(e.target.value))}
                className="mb-4 w-full rounded border border-hairline-strong bg-surface-2 px-2 py-1.5 text-xs font-semibold text-ink-dim"
              >
                {editions.map((edition, i) => (
                  <option key={edition.skuId} value={i}>
                    {edition.name}
                  </option>
                ))}
              </select>
            )}
            {!psPrice?.purchasePrice && !psPrice?.subscriptionPrice && (
              <p className="py-4 text-center text-xs text-ink-faint">
                Not available on the PlayStation Store.
              </p>
            )}
            {psPrice?.subscriptionPrice && (
              <div className="flex items-start gap-3 rounded-lg border border-hairline bg-surface-2/40 p-3">
                <Gamepad2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-coral" />
                <div>
                  <p className="text-sm font-bold text-coral">
                    Included with PS Plus
                  </p>
                  {psPrice.subscriptionPrice.displayUpsellText && (
                    <p className="mt-1 text-xs text-ink-faint">
                      {psPrice.subscriptionPrice.displayUpsellText}
                    </p>
                  )}
                </div>
              </div>
            )}{" "}
            {psPrice?.purchasePrice && (
              <div className="flex items-center justify-between rounded-lg border border-hairline bg-surface-2/40 p-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-ink-dim">
                    PlayStation Store
                  </p>
                  {psPrice.purchasePrice.discountedValue <
                    psPrice.purchasePrice.basePriceValue && (
                    <span className="inline-block rounded bg-coral-soft px-1.5 py-0.5 text-[10px] font-bold text-coral">
                      {psPrice.purchasePrice.savingTag || "On Sale"}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-sm font-black text-emerald-400">
                    {psPrice.purchasePrice.discountedPrice}
                  </p>
                  {psPrice.purchasePrice.discountedValue <
                    psPrice.purchasePrice.basePriceValue && (
                    <p className="text-[10px] text-ink-faint line-through">
                      {psPrice.purchasePrice.basePrice}
                    </p>
                  )}
                </div>
              </div>
            )}
            {psPrice?.conceptUrl && (
              <a
                href={psPrice.conceptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-hairline-strong bg-surface-2 text-xs font-bold text-ink-dim transition-colors duration-200 hover:border-coral hover:bg-coral hover:text-void"
              >
                <Image
                  src="/icons/playstation.svg"
                  alt=""
                  width={14}
                  height={14}
                  className="opacity-80 invert"
                />
                View on PlayStation Store
              </a>
            )}
          </div>
        </motion.div>

        {/* Price Alerts Card — only meaningful for a real purchasable price.
            Always tracks Standard (standardPrice), regardless of which
            edition is currently selected above. */}
        {standardPrice?.purchasePrice &&
          standardPrice.purchasePrice.discountedValue > 0 && (
            <motion.div variants={itemVariants}>
              {editionIndex !== 0 && (
                <p className="mb-2 text-xs text-ink-faint">
                  Price alerts track the Standard Edition, not the edition
                  currently selected above.
                </p>
              )}
              <PriceAlertForm
                gameId={game.id}
                currentPrice={standardPrice.purchasePrice.discountedValue / 100}
                initialAlert={initialPriceAlert}
              />
            </motion.div>
          )}
      </div>

      <Dialog
        open={lightboxOpen}
        onOpenChange={(open) => {
          if (!open) setLightboxIndex(null);
        }}
      >
        {lightboxIndex !== null && screenshots[lightboxIndex] && (
          <DialogContent
            overlayClassName="bg-black/85"
            className="w-[95vw] max-w-[95vw] gap-3 border border-hairline bg-void p-3 sm:max-w-6xl"
          >
            <DialogTitle className="sr-only">
              {`${game.name} screenshot ${lightboxIndex + 1} of ${screenshotCount}`}
            </DialogTitle>
            <div className="relative aspect-video w-full">
              <Image
                src={screenshots[lightboxIndex].image}
                alt={`${game.name} screenshot ${lightboxIndex + 1}`}
                fill
                sizes="95vw"
                className="object-contain"
                priority
              />
              {screenshotCount > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex(
                        (lightboxIndex - 1 + screenshotCount) % screenshotCount,
                      )
                    }
                    aria-label="Previous screenshot"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-void/70 p-2 text-ink transition-colors hover:bg-void"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((lightboxIndex + 1) % screenshotCount)
                    }
                    aria-label="Next screenshot"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-void/70 p-2 text-ink transition-colors hover:bg-void"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            <p className="text-center text-xs text-ink-faint">
              {lightboxIndex + 1} / {screenshotCount}
            </p>
          </DialogContent>
        )}
      </Dialog>
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-hairline pb-3 font-display text-xs font-semibold uppercase tracking-[0.2em] text-coral">
      {children}
    </h3>
  );
}
