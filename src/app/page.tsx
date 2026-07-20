import { Suspense } from "react";
import Navbar from "@/components/navbar";
import GameGrid from "@/components/game-grid";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPopularGames,
  getUpcomingGames,
  getNewGames,
  searchGames,
} from "@/lib/rawg";
import { getUserWishlist } from "@/lib/actions";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export const dynamic = "force-dynamic";

export default async function Home(props: PageProps) {
  const searchParams = await props.searchParams;
  const searchQuery = searchParams.search || "";

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 md:px-12">
        <Suspense fallback={<HomeSkeleton searchQuery={searchQuery} />}>
          <HomeContent searchQuery={searchQuery} />
        </Suspense>
      </main>
    </div>
  );
}

// Separate component to enable loading state via Suspense
async function HomeContent({ searchQuery }: { searchQuery: string }) {
  // Fetch wishlist game IDs to pass down for toggle states
  const wishlist = await getUserWishlist();
  const wishlistGameIds = new Set(wishlist.map((item) => item.game_id));

  if (searchQuery) {
    const searchResults = await searchGames(searchQuery);
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Search Results{" "}
            <span className="text-zinc-500">for &quot;{searchQuery}&quot;</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Found {searchResults.length} games matching your query.
          </p>
        </div>
        <GameGrid games={searchResults} wishlistGameIds={wishlistGameIds} />
      </div>
    );
  }

  // Fetch all categories in parallel
  const [popular, upcoming, newGames] = await Promise.all([
    getPopularGames(),
    getUpcomingGames(),
    getNewGames(),
  ]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Popular Games Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-l-4 border-[#ff7676] pl-4">
          <h2 className="text-2xl font-black tracking-wider uppercase md:text-3xl">
            Popular Games
          </h2>
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
            Highly Rated
          </span>
        </div>
        <GameGrid games={popular} wishlistGameIds={wishlistGameIds} />
      </section>

      {/* Upcoming Games Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-l-4 border-amber-500 pl-4">
          <h2 className="text-2xl font-black tracking-wider uppercase md:text-3xl">
            Upcoming Games
          </h2>
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
            Anticipated
          </span>
        </div>
        <GameGrid games={upcoming} wishlistGameIds={wishlistGameIds} />
      </section>

      {/* New Games Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-l-4 border-cyan-500 pl-4">
          <h2 className="text-2xl font-black tracking-wider uppercase md:text-3xl">
            New Games
          </h2>
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
            Recently Released
          </span>
        </div>
        <GameGrid games={newGames} wishlistGameIds={wishlistGameIds} />
      </section>
    </div>
  );
}

function HomeSkeleton({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="space-y-12">
      {searchQuery ? (
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-9 w-60 bg-zinc-900" />
            <Skeleton className="h-4 w-40 bg-zinc-900" />
          </div>
          <GridSkeleton count={9} />
        </div>
      ) : (
        <>
          {/* Popular Games Section Skeleton */}
          <section className="space-y-6">
            <Skeleton className="h-9 w-48 bg-zinc-900" />
            <GridSkeleton count={5} />
          </section>

          {/* Upcoming Games Section Skeleton */}
          <section className="space-y-6">
            <Skeleton className="h-9 w-48 bg-zinc-900" />
            <GridSkeleton count={5} />
          </section>

          {/* New Games Section Skeleton */}
          <section className="space-y-6">
            <Skeleton className="h-9 w-48 bg-zinc-900" />
            <GridSkeleton count={5} />
          </section>
        </>
      )}
    </div>
  );
}

function GridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-columns-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-zinc-900 bg-zinc-950 p-4 space-y-4"
        >
          <Skeleton className="aspect-[16/10] w-full rounded-md bg-zinc-900" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-4/5 bg-zinc-900" />
            <Skeleton className="h-4 w-1/2 bg-zinc-900" />
          </div>
          <div className="pt-2 border-t border-zinc-900 flex justify-between">
            <Skeleton className="h-4 w-12 bg-zinc-900" />
            <Skeleton className="h-4 w-8 bg-zinc-900" />
          </div>
        </div>
      ))}
    </div>
  );
}
