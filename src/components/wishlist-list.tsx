"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleWishlist } from "@/lib/actions";
import { imageResizeURL } from "@/lib/rawg";
import { toast } from "sonner";

interface WishlistWithDealsItem {
  id: string;
  user_id: string;
  game_id: number;
  game_name: string;
  game_image: string;
  added_at: string;
  cheapestPrice: number | null;
  isOnSale: boolean;
  savings: number | null;
}

interface WishlistListProps {
  initialItems: WishlistWithDealsItem[];
}

export default function WishlistList({ initialItems }: WishlistListProps) {
  const [items, setItems] = useState<WishlistWithDealsItem[]>(initialItems);

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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/20 py-16 text-center px-4">
        <div className="rounded-full bg-zinc-900 p-4 border border-zinc-800 mb-4 text-[#ff7676]">
          <Trash2 className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-zinc-300">Your wishlist is empty</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          Browse popular, upcoming, or new games and add them to your wishlist to track price deals and set alerts.
        </p>
        <Link href="/" className="mt-6">
          <Button className="bg-[#ff7676] hover:bg-[#ff5858] text-white rounded-full font-bold px-6">
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
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              <Card className="relative overflow-hidden border-zinc-800 bg-zinc-950 text-white h-full flex flex-col group shadow-lg hover:shadow-2xl">
                {/* Remove from wishlist button */}
                <div className="absolute right-3 top-3 z-10">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemove(item.game_id, item.game_name)}
                    className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-md border border-zinc-800 text-zinc-400 hover:bg-red-650 hover:text-white hover:border-red-800 transition-colors"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </Button>
                </div>

                <Link href={`/game/${item.game_id}`} className="block flex flex-col flex-1 h-full">
                  {/* Game Cover Image */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900 shrink-0">
                    <Image
                      src={resizedImage}
                      alt={item.game_name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                      unoptimized={resizedImage.endsWith(".svg")}
                    />
                  </div>

                  {/* Card Content */}
                  <CardContent className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="text-base font-bold line-clamp-2 leading-snug group-hover:text-[#ff7676] transition-colors">
                        {item.game_name}
                      </h3>
                      <p className="mt-1 text-[10px] text-zinc-500">
                        Added: {new Date(item.added_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-zinc-900 pt-3">
                      <div>
                        {item.cheapestPrice !== null ? (
                          <div className="space-y-0.5">
                            <p className="text-xs text-zinc-400">Cheapest Price</p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-emerald-400">
                                ${item.cheapestPrice.toFixed(2)}
                              </span>
                              {item.isOnSale && item.savings && (
                                <Badge className="bg-red-950/40 hover:bg-red-950/40 border border-red-900/30 text-[#ff7676] text-[9px] font-bold py-0 px-1 rounded h-4">
                                  -{item.savings}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-xs text-zinc-400">Pricing</p>
                            <span className="text-xs text-zinc-500 font-semibold italic">
                              Unavailable
                            </span>
                          </div>
                        )}
                      </div>

                      <span className="text-xs font-semibold text-zinc-400 group-hover:text-[#ff7676] flex items-center gap-1.5 transition-colors">
                        Details
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
