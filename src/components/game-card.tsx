"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Heart } from "lucide-react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Game, imageResizeURL } from "@/lib/rawg";
import { useWishlistToggle } from "@/hooks/use-wishlist-toggle";

interface GameCardProps {
  game: Game;
  isWishlisted: boolean;
}

export default function GameCard({
  game,
  isWishlisted: initialWishlist,
}: GameCardProps) {
  const { isSignedIn } = useUser();
  const { isMutating, isWishlisted, toggle } = useWishlistToggle(
    game.id,
    game.name,
    game.background_image,
    initialWishlist,
  );
  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) return; // Handled by Clerk SignInButton for guests
    toggle();
  };

  const resizedImage =
    imageResizeURL(game.background_image, 640) || "/icons/gamepad.svg";

  return (
    <Link href={`/game/${game.id}`} className="block h-full reveal">
      <article className="card-hover clip-notch-md relative flex h-full flex-col overflow-hidden border border-hairline bg-surface">
        {/* Wishlist Icon Overlay */}
        <div className="absolute right-3 top-3 z-10">
          {isSignedIn ? (
            <Button
              variant="secondary"
              size="icon"
              disabled={isMutating}
              onClick={handleWishlistToggle}
              className="h-9 w-9 rounded-full bg-void/60 backdrop-blur-md border border-hairline-strong text-ink hover:bg-coral hover:text-void transition-colors duration-200"
            >
              <Heart
                className={`h-4.5 w-4.5 transition-transform active:scale-125 ${
                  isWishlisted ? "fill-coral text-coral" : "text-ink"
                }`}
              />
            </Button>
          ) : (
            <SignInButton mode="modal" forceRedirectUrl={`/`}>
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 rounded-full bg-void/60 backdrop-blur-md border border-hairline-strong text-ink hover:bg-coral hover:text-void transition-colors duration-200"
              >
                <Heart className="h-4.5 w-4.5 text-ink" />
              </Button>
            </SignInButton>
          )}
        </div>

        {/* Game Image */}
        <div className="card-hover-art art-scanline relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-surface-2">
          <Image
            src={resizedImage}
            alt={game.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            unoptimized={resizedImage.endsWith(".svg")}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />
          {game.metacritic && (
            <div
              className={`absolute left-3 top-3 rounded px-1.5 py-0.5 text-xs font-bold backdrop-blur-md ${
                game.metacritic >= 75
                  ? "bg-green-950/80 text-green-400 border border-green-800"
                  : game.metacritic >= 50
                    ? "bg-amber-950/80 text-amber-400 border border-amber-800"
                    : "bg-red-950/80 text-red-400 border border-red-800"
              }`}
            >
              {game.metacritic}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="card-hover-title font-display text-base font-medium leading-snug text-ink line-clamp-2 transition-colors duration-200">
              {game.name}
            </h3>
          </div>
        </div>

        {/* Game Details */}
        <div className="flex items-center justify-between border-t border-hairline px-4 py-2.5 text-sm">
          <span className="text-xs text-ink-faint">
            {game.released || "N/A"}
          </span>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="font-semibold text-ink-dim">
              {game.rating ? game.rating.toFixed(1) : "N/A"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
