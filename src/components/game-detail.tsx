"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Heart, ExternalLink, Sparkles, Check, Plus, Loader2 } from "lucide-react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { motion, type Variants } from "motion/react";
import { Game, GameScreenshot, imageResizeURL } from "@/lib/rawg";
import { CheapSharkGameInfo, getDealRedirectUrl } from "@/lib/cheapshark";
import { toggleWishlist, PriceAlert } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PriceChart, { type Snapshot } from "./price-chart";
import PriceAlertForm from "./price-alert-form";
import { toast } from "sonner";

interface GameDetailProps {
  game: Game;
  screenshots: GameScreenshot[];
  initialWishlistStatus: boolean;
  dealsInfo: CheapSharkGameInfo | null;
  snapshots: Snapshot[];
  initialPriceAlert: PriceAlert | null;
}

export default function GameDetail({
  game,
  screenshots,
  initialWishlistStatus,
  dealsInfo,
  snapshots,
  initialPriceAlert,
}: GameDetailProps) {
  const { isSignedIn } = useUser();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlistStatus);
  const [isMutating, setIsMutating] = useState(false);

  const handleWishlistToggle = async () => {
    if (!isSignedIn) return; // Handled by Clerk SignInButton for guests

    setIsMutating(true);
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

  const getPlatformIcon = (platformName: string) => {
    const name = platformName.toLowerCase();
    if (name.includes("playstation")) return "/icons/playstation.svg";
    if (name.includes("xbox")) return "/icons/xbox.svg";
    if (name.includes("pc") || name.includes("steam")) return "/icons/steam.svg";
    if (name.includes("nintendo") || name.includes("switch")) return "/icons/nintendo.svg";
    if (name.includes("ios") || name.includes("apple") || name.includes("mac")) return "/icons/apple.svg";
    return "/icons/gamepad.svg";
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const roundedRating = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4.5 w-4.5 ${
            i <= roundedRating ? "text-amber-400 fill-amber-400" : "text-zinc-700"
          }`}
        />
      );
    }
    return stars;
  };

  // Motion Reveal Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-8 lg:grid-cols-3"
    >
      {/* 🔹 Left Column: Game details, Description, Screenshots */}
      <div className="lg:col-span-2 space-y-8">
        {/* Title, rating, platforms */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {game.metacritic && (
              <Badge className="bg-emerald-950 border-emerald-800 text-emerald-400 font-bold px-2 py-0.5 text-sm">
                Metacritic: {game.metacritic}
              </Badge>
            )}
            {game.released && (
              <Badge variant="outline" className="border-zinc-800 text-zinc-400">
                Released: {game.released}
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl leading-tight text-white">
            {game.name}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-zinc-900 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-400">Rating:</span>
              <div className="flex items-center">{renderStars(game.rating)}</div>
              <span className="text-xs font-semibold text-zinc-500 pl-1">
                ({game.ratings_count} votes)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-400">Platforms:</span>
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-full">
                {game.platforms?.slice(0, 5).map((data) => (
                  <div key={data.platform.id} className="relative h-4.5 w-4.5 text-zinc-400" title={data.platform.name}>
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
        <motion.div variants={itemVariants} className="space-y-3">
          <h3 className="text-xl font-bold border-l-4 border-[#ff7676] pl-3 text-white">
            About
          </h3>
          <p className="text-zinc-300 leading-relaxed text-sm whitespace-pre-line max-w-none">
            {game.description_raw || "No description available for this game."}
          </p>
        </motion.div>

        {/* Screenshots Gallery */}
        {screenshots && screenshots.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-xl font-bold border-l-4 border-[#ff7676] pl-3 text-white">
              Screenshots
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {screenshots.map((screen) => (
                <div
                  key={screen.id}
                  className="relative aspect-[16/10] overflow-hidden rounded-xl bg-zinc-900 border border-zinc-900 shadow-md group hover:border-zinc-800 transition-colors"
                >
                  <Image
                    src={imageResizeURL(screen.image, 1280)}
                    alt="game screenshot"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-102 transition-transform duration-300 ease-out"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* 🔹 Right Column: Shopping and Alerts (Sticky sidebar) */}
      <div className="space-y-6 lg:h-fit lg:sticky lg:top-24">
        {/* Main Cover Image */}
        <motion.div
          variants={itemVariants}
          className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-900 shadow-xl"
        >
          <Image
            src={imageResizeURL(game.background_image, 1280) || "/icons/gamepad.svg"}
            alt={game.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover"
          />
        </motion.div>

        {/* Wishlist Button */}
        <motion.div variants={itemVariants}>
          {isSignedIn ? (
            <Button
              disabled={isMutating}
              onClick={handleWishlistToggle}
              className={`w-full h-12 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg transition-all duration-300 ${
                isWishlisted
                  ? "bg-zinc-900 border border-zinc-800 text-[#ff7676] hover:bg-zinc-850"
                  : "bg-[#ff7676] text-white hover:bg-[#ff5858]"
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
              <Button className="w-full h-12 rounded-full font-bold bg-[#ff7676] text-white hover:bg-[#ff5858] flex items-center justify-center gap-2 shadow-lg">
                <Heart className="h-5 w-5" />
                Sign In to Save
              </Button>
            </SignInButton>
          )}
        </motion.div>

        {/* CheapShark Store Deals */}
        <motion.div variants={itemVariants} className="space-y-4">
          <Card className="border-zinc-900 bg-zinc-950 text-white shadow-xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold">Best PC Store Deals</h3>
              </div>
              
              {!dealsInfo || dealsInfo.deals.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-4">
                  No active store deals found.
                </p>
              ) : (
                <div className="space-y-3.5">
                  {dealsInfo.deals.slice(0, 5).map((deal) => (
                    <a
                      key={deal.dealID}
                      href={getDealRedirectUrl(deal.dealID)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border border-zinc-900 hover:border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/70 transition-all duration-200 group"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-zinc-300 group-hover:text-white">
                          {deal.storeName}
                        </p>
                        {deal.isOnSale && (
                          <Badge className="bg-red-950/50 hover:bg-red-950/50 border border-red-900/50 text-[#ff7676] text-[10px] font-bold py-0 px-1.5 h-4.5 rounded">
                            {deal.savings}% OFF
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-400">
                            ${deal.price.toFixed(2)}
                          </p>
                          {deal.isOnSale && (
                            <p className="text-[10px] text-zinc-500 line-through">
                              ${deal.normalPrice.toFixed(2)}
                            </p>
                          )}
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-350 transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Price Alerts Card */}
        {dealsInfo && dealsInfo.deals.length > 0 && (
          <motion.div variants={itemVariants}>
            <PriceAlertForm
              gameId={game.id}
              currentPrice={dealsInfo.deals[0].price}
              initialAlert={initialPriceAlert}
            />
          </motion.div>
        )}

        {/* Price History Chart */}
        <motion.div variants={itemVariants}>
          <PriceChart
            snapshots={snapshots}
            cheapsharkMatched={!!dealsInfo}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
