import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import Navbar from "@/components/navbar";
import WishlistList from "@/components/wishlist-list";
import SectionHead from "@/components/section-head";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserWishlist } from "@/lib/actions";
import { getPsStoreEditionsByName } from "@/lib/ps-store";

import { createSupabaseAdminClient } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

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

        <Suspense fallback={<WishlistSkeleton />}>
          <WishlistContent />
        </Suspense>
      </main>
    </div>
  );
}

async function WishlistContent() {
  // Fetch the user's wishlist
  const wishlist = await getUserWishlist();
  const supabase = createSupabaseAdminClient();

  // For each wishlisted game, resolve its live PS Store price and its
  // tracked price history in parallel. The wishlist is a small, bounded
  // list (unlike the home page grid), so a search + price call per item
  // here is fine — it's the same "worth it because it's bounded" call
  // already made for the detail page. Still a real per-item PS Store
  // network round trip though, which is why this is worth streaming
  // behind a skeleton rather than blocking the whole page on it.
  const wishlistWithPricing = await Promise.all(
    wishlist.map(async (item) => {
      const [editions, snapshotsResult] = await Promise.all([
        getPsStoreEditionsByName(item.game_name),
        supabase
          .from("price_snapshots")
          .select("*")
          .eq("game_id", item.game_id)
          .order("recorded_at", { ascending: true }),
      ]);

      return {
        ...item,
        editions,
        snapshots: snapshotsResult.data || [],
      };
    }),
  );

  return <WishlistList initialItems={wishlistWithPricing} />;
}

function WishlistCardSkeleton() {
  return (
    <div className="clip-notch-md relative flex h-full flex-col overflow-hidden border border-hairline bg-surface">
      <Skeleton className="aspect-[16/10] w-full rounded-none bg-surface-2" />
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-4/5 bg-surface-2" />
          <Skeleton className="h-3 w-2/5 bg-surface-2" />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
          <Skeleton className="h-4 w-16 bg-surface-2" />
          <Skeleton className="h-4 w-10 bg-surface-2" />
        </div>
      </div>
    </div>
  );
}

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <WishlistCardSkeleton key={i} />
      ))}
    </div>
  );
}
