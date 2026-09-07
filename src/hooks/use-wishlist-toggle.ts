import { toggleWishlist } from "@/lib/actions";
import { useState } from "react";
import { toast } from "sonner";

export function useWishlistToggle(
  gameId: number,
  gameName: string,
  gameImage: string,
  initial: boolean,
) {
  const [isWishlisted, setIsWishlisted] = useState(initial);
  const [isMutating, setIsMutating] = useState(false);

  const toggle = async () => {
    setIsMutating(true);
    setIsWishlisted((prev) => !prev);
    try {
      const res = await toggleWishlist(gameId, gameName, gameImage);
      if (res.success) {
        toast.success(
          res.added
            ? `Added ${gameName} to wishlist!`
            : `Removed ${gameName} from wishlist.`,
        );
      } else {
        setIsWishlisted((prev) => !prev);
        toast.error(res.error || "Failed to update wishlist");
      }
    } catch {
      setIsWishlisted((prev) => !prev);
      toast.error("An error occurred");
    } finally {
      setIsMutating(false);
    }
  };

  return { isWishlisted, isMutating, toggle };
}
