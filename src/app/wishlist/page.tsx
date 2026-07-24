import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Navbar from "@/components/navbar";
import WishlistList from "@/components/wishlist-list";
import SectionHead from "@/components/section-head";
import { getUserWishlist } from "@/lib/actions";
import { getDealsByGameTitle } from "@/lib/cheapshark";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch the user's wishlist
  const wishlist = await getUserWishlist();

  // Load active price deals for each wishlisted game in parallel on the server
  const wishlistWithDeals = await Promise.all(
    wishlist.map(async (item) => {
      try {
        const deals = await getDealsByGameTitle(item.game_name);
        return {
          ...item,
          cheapestPrice: deals ? deals.cheapestPrice : null,
          isOnSale: deals && deals.deals.length > 0 ? deals.deals[0].isOnSale : false,
          savings: deals && deals.deals.length > 0 ? deals.deals[0].savings : null,
        };
      } catch (error) {
        console.error(`Error loading deals for ${item.game_name}:`, error);
        return {
          ...item,
          cheapestPrice: null,
          isOnSale: false,
          savings: null,
        };
      }
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

        <WishlistList initialItems={wishlistWithDeals} />
      </main>
    </div>
  );
}
