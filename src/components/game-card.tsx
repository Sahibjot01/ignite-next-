"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Heart } from "lucide-react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
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
    <motion.div
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full"
    >
      <Link href={`/game/${game.id}`} className="block h-full">
        <Card className="relative overflow-hidden border-zinc-800 bg-zinc-950 text-white h-full flex flex-col group shadow-lg hover:shadow-2xl transition-all duration-300">
          {/* Wishlist Icon Overlay */}
          <div className="absolute right-3 top-3 z-10">
            {isSignedIn ? (
              <Button
                variant="secondary"
                size="icon"
                disabled={isMutating}
                onClick={handleWishlistToggle}
                className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-md border border-zinc-800 text-white hover:bg-[#ff7676] hover:text-white transition-colors duration-200"
              >
                <Heart
                  className={`h-4.5 w-4.5 transition-transform active:scale-125 ${
                    isWishlisted ? "fill-[#ff7676] text-[#ff7676]" : "text-white"
                  }`}
                />
              </Button>
            ) : (
              <SignInButton mode="modal" forceRedirectUrl={`/`}>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-md border border-zinc-800 text-white hover:bg-[#ff7676] hover:text-white transition-colors duration-200"
                >
                  <Heart className="h-4.5 w-4.5 text-white" />
                </Button>
              </SignInButton>
            )}
          </div>

          {/* Game Image */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900 shrink-0">
            <Image
              src={resizedImage}
              alt={game.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              unoptimized={resizedImage.endsWith(".svg")}
            />
          </div>

          {/* Game Details */}
          <CardContent className="p-5 flex flex-col flex-1 justify-between">
            <div>
              <h3 className="text-lg font-bold line-clamp-2 leading-snug group-hover:text-[#ff7676] transition-colors duration-200">
                {game.name}
              </h3>
              <p className="mt-1.5 text-xs text-zinc-400">
                Release Date: {game.released || "N/A"}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-zinc-900 pt-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="font-semibold text-zinc-200">
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
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
