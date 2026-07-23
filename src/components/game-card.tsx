"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Heart } from "lucide-react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Game, imageResizeURL } from "@/lib/rawg";
import { toggleWishlist } from "@/lib/actions";
import { toast } from "sonner";

interface GameCardProps {
  game: Game;
  isWishlisted: boolean;
}

export default function GameCard({ game, isWishlisted: initialWishlist }: GameCardProps) {
  const { isSignedIn } = useUser();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlist);
  const [isMutating, setIsMutating] = useState(false);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) return; // Managed by SignInButton wrapper for guests

    setIsMutating(true);
    // Optimistic UI update
    setIsWishlisted(!isWishlisted);

    try {
      const res = await toggleWishlist(game.id, game.name, game.background_image);
      if (res.success) {
        toast.success(
          res.added
            ? `Added ${game.name} to wishlist!`
            : `Removed ${game.name} from wishlist.`
        );
      } else {
        // Revert on failure
        setIsWishlisted(isWishlisted);
        toast.error(res.error || "Failed to update wishlist");
      }
    } catch {
      setIsWishlisted(isWishlisted);
      toast.error("An error occurred");
    } finally {
      setIsMutating(false);
    }
  };

  const resizedImage = imageResizeURL(game.background_image, 640) || "/icons/gamepad.svg";

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
        <div className="card-hover-art art-scanline relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-surface-2">
          <Image
            src={resizedImage}
            alt={game.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            unoptimized={resizedImage.endsWith(".svg")}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/85 via-transparent to-transparent" />
        </div>

        {/* Game Details */}
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <h3 className="card-hover-title font-display text-lg font-medium leading-snug text-ink line-clamp-2 transition-colors duration-200">
              {game.name}
            </h3>
            <p className="mt-1.5 text-xs text-ink-faint">
              Release Date: {game.released || "N/A"}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-ink-dim">
                {game.rating ? game.rating.toFixed(1) : "N/A"}
              </span>
            </div>
            {game.metacritic && (
              <div
                className={`rounded px-1.5 py-0.5 text-xs font-bold ${
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
          </div>
        </div>
      </article>
    </Link>
  );
}
