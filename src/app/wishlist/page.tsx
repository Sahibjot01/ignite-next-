import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Navbar from "@/components/navbar";
import WishlistList from "@/components/wishlist-list";
import SectionHead from "@/components/section-head";
import { getUserWishlist } from "@/lib/actions";
import { getPsStorePriceByName, type PsStoreProductPrice} from "@/lib/ps-store";

import { createSupabaseAdminClient } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch the user's wishlist
  const wishlist = await getUserWishlist();
  const supabase = createSupabaseAdminClient();

  // For each wishlisted game, resolve its live PS Store price and its
  // tracked price history in parallel. The wishlist is a small, bounded
  // list (unlike the home page grid), so a search + price call per item
  // here is fine — it's the same "worth it because it's bounded" call
  // already made for the detail page.
  const wishlistWithPricing = await Promise.all(
    wishlist.map(async (item) => {
      const [psPrice, snapshotsResult] = await Promise.all([
        getPsStorePriceByName(item.game_name),
        supabase
          .from("price_snapshots")
          .select("*")
          .eq("game_id", item.game_id)
          .order("recorded_at", { ascending: true }),
      ]);

      return {
        ...item,
        psPrice,
        snapshots: snapshotsResult.data || [],
      };
    })
  );

  return (
    <div className="flex flex-col min-h-screen bg-void text-ink">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 md:px-12">
        <div className="mb-10">
          <SectionHead
            eyebrow="Saved"
            title="Wishlist"
            sub="Track deals and configure price drop alert targets for your favorite games."
          />
        </div>

        <WishlistList initialItems={wishlistWithPricing} />
      </main>
    </div>
  );
}
