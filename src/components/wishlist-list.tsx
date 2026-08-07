"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Trash2, ExternalLink, TrendingUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { toggleWishlist } from "@/lib/actions";
import { imageResizeURL } from "@/lib/rawg";
import { type PsStoreProductPrice } from "@/lib/ps-store";
import PriceChart, { type Snapshot } from "./price-chart";
import { toast } from "sonner";

const EASE = [0.2, 0.7, 0.3, 1] as const;

interface WishlistWithDealsItem {
  id: string;
  user_id: string;
  game_id: number;
  game_name: string;
  game_image: string;
  added_at: string;
  psPrice: PsStoreProductPrice | null;
  snapshots: Snapshot[];
}

interface WishlistListProps {
  initialItems: WishlistWithDealsItem[];
}

export default function WishlistList({ initialItems }: WishlistListProps) {
  const [items, setItems] = useState<WishlistWithDealsItem[]>(initialItems);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleHistory = (gameId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
  };

  const handleRemove = async (gameId: number, name: string) => {
    // Optimistically remove from state
    setItems((prev) => prev.filter((item) => item.game_id !== gameId));

    try {
      const res = await toggleWishlist(gameId, name, "");
      if (res.success && !res.added) {
        toast.success(`Removed ${name} from your wishlist.`);
      } else {
        // Revert on failure
        setItems(items);
        toast.error("Failed to remove item");
      }
    } catch {
      setItems(items);
      toast.error("An error occurred");
    }
  };

  if (items.length === 0) {
    return (
      <div className="clip-notch-lg flex flex-col items-center justify-center border border-dashed border-hairline-strong bg-surface/40 px-4 py-16 text-center">
        <div className="mb-4 rounded-full border border-hairline-strong bg-surface-2 p-4 text-coral">
          <Heart className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg font-medium text-ink">
          Your wishlist is empty
        </h3>
        <p className="mt-1 max-w-sm text-xs text-ink-faint">
          Browse popular, upcoming, or new games and add them to your wishlist to track price deals and set alerts.
        </p>
        <Link href="/" className="mt-6">
          <Button className="rounded-full bg-coral px-6 font-bold text-void hover:bg-[#ff5858]">
            Browse Games
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <AnimatePresence mode="popLayout">
        {items.map((item) => {
          const resizedImage = imageResizeURL(item.game_image, 640) || "/icons/gamepad.svg";

          return (
            <motion.div
              key={item.game_id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="h-full"
            >
              <article className="card-hover clip-notch-md relative flex h-full flex-col overflow-hidden border border-hairline bg-surface">
                {/* Remove from wishlist button */}
                <div className="absolute right-3 top-3 z-10">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleRemove(item.game_id, item.game_name)}
                    className="h-9 w-9 rounded-full border border-hairline-strong bg-void/60 text-ink-dim backdrop-blur-md transition-colors duration-200 hover:border-red-500 hover:bg-red-500/90 hover:text-white"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </Button>
                </div>

                <Link href={`/game/${item.game_id}`} className="flex h-full flex-1 flex-col">
                  {/* Game Cover Image */}
                  <div className="card-hover-art art-scanline relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-surface-2">
                    <Image
                      src={resizedImage}
                      alt={item.game_name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover"
                      unoptimized={resizedImage.endsWith(".svg")}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/85 via-transparent to-transparent" />
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <h3 className="card-hover-title font-display text-lg font-medium leading-snug text-ink line-clamp-2 transition-colors duration-200">
                        {item.game_name}
                      </h3>
                      <p className="mt-1.5 text-xs text-ink-faint">
                        Added: {new Date(item.added_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-sm">
                      <div className="space-y-1">
                        {!item.psPrice?.purchasePrice &&
                          !item.psPrice?.subscriptionPrice && (
                            <div className="space-y-0.5">
                              <p className="text-xs text-ink-faint">Pricing</p>
                              <span className="text-xs font-semibold italic text-ink-faint">
                                Unavailable
                              </span>
                            </div>
                          )}
                        {item.psPrice?.subscriptionPrice && (
                          <div className="space-y-0.5">
                            <p className="text-xs text-ink-faint">Pricing</p>
                            <span className="text-xs font-bold text-coral">
                              Included with PS Plus
                            </span>
                          </div>
                        )}
                        {item.psPrice?.purchasePrice && (
                          <div className="space-y-0.5">
                            <p className="text-xs text-ink-faint">PS Store Price</p>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-emerald-400">
                                {item.psPrice.purchasePrice.discountedPrice}
                              </span>
                              {item.psPrice.purchasePrice.discountedValue <
                                item.psPrice.purchasePrice.basePriceValue && (
                                <span className="rounded bg-coral-soft px-1 py-0.5 text-[9px] font-bold text-coral">
                                  {item.psPrice.purchasePrice.savingTag || "Sale"}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-dim">
                        Details
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Price History toggle — outside the Link so it doesn't navigate */}
                <div className="border-t border-hairline px-5 py-3">
                  <button
                    type="button"
                    onClick={() => toggleHistory(item.game_id)}
                    className="flex w-full items-center justify-between text-xs font-semibold text-ink-dim transition-colors hover:text-ink"
                  >
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Price History
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        expandedIds.has(item.game_id) ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedIds.has(item.game_id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3">
                          <PriceChart
                            snapshots={item.snapshots}
                            hasPriceData={!!item.psPrice}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </article>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
