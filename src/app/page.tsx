import { Suspense } from "react";
import Navbar from "@/components/navbar";
import GameGrid from "@/components/game-grid";
import SpotlightStrip from "@/components/spotlight-strip";
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
    <div className="flex flex-col min-h-screen bg-void text-ink">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 md:px-12">
        <Suspense fallback={<HomeSkeleton searchQuery={searchQuery} />}>
          <HomeContent searchQuery={searchQuery} />
        </Suspense>
      </main>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
  accent = "coral",
  aside,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  accent?: "coral" | "platinum";
  aside?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex max-w-[46ch] flex-col gap-1.5">
        <p
          className={`font-display text-[11px] font-semibold uppercase tracking-[0.16em] ${
            accent === "coral" ? "text-coral" : "text-platinum"
          }`}
        >
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-medium leading-tight text-ink md:text-3xl">
          {title}
        </h2>
        {sub && <p className="text-sm leading-relaxed text-ink-dim">{sub}</p>}
      </div>
      {aside && (
        <span className="hidden shrink-0 pt-1 text-xs font-semibold uppercase tracking-widest text-ink-faint sm:inline">
          {aside}
        </span>
      )}
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
        <SectionHead
          eyebrow="Results"
          title={`"${searchQuery}"`}
          sub={`Found ${searchResults.length} games matching your query.`}
        />
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
    <div className="space-y-14 animate-in fade-in duration-500">
      {/* Spotlight — ambient auto-rotating strip */}
      {popular.length > 0 && (
        <section className="space-y-6">
          <SectionHead
            eyebrow="On rotation"
            title="Spotlight"
            sub="Auto-advancing through what's trending — hover or tap to pause."
          />
          <SpotlightStrip games={popular.slice(0, 6)} />
        </section>
      )}

      {/* Popular Games Section */}
      <section className="space-y-6">
        <SectionHead
          eyebrow="Trending"
          title="Popular Games"
          sub="Highly rated titles the PlayStation community is playing right now."
          aside="Highly Rated"
        />
        <GameGrid games={popular} wishlistGameIds={wishlistGameIds} />
      </section>

      {/* Upcoming Games Section */}
      <section className="space-y-6">
        <SectionHead
          eyebrow="On the horizon"
          title="Upcoming Games"
          sub="Anticipated releases worth keeping an eye on."
          accent="platinum"
          aside="Anticipated"
        />
        <GameGrid games={upcoming} wishlistGameIds={wishlistGameIds} />
      </section>

      {/* New Games Section */}
      <section className="space-y-6">
        <SectionHead
          eyebrow="Just landed"
          title="New Games"
          sub="Recently released on PlayStation."
          accent="platinum"
          aside="Recently Released"
        />
        <GameGrid games={newGames} wishlistGameIds={wishlistGameIds} />
      </section>
    </div>
  );
}

function HomeSkeleton({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="space-y-14">
      {searchQuery ? (
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-9 w-60 bg-surface-2" />
            <Skeleton className="h-4 w-40 bg-surface-2" />
          </div>
          <GridSkeleton count={9} />
        </div>
      ) : (
        <>
          <section className="space-y-6">
            <Skeleton className="h-9 w-48 bg-surface-2" />
            <Skeleton className="h-[260px] w-full clip-notch-lg bg-surface-2 sm:h-[320px]" />
          </section>

          {/* Popular Games Section Skeleton */}
          <section className="space-y-6">
            <Skeleton className="h-9 w-48 bg-surface-2" />
            <GridSkeleton count={5} />
          </section>

          {/* Upcoming Games Section Skeleton */}
          <section className="space-y-6">
            <Skeleton className="h-9 w-48 bg-surface-2" />
            <GridSkeleton count={5} />
          </section>

          {/* New Games Section Skeleton */}
          <section className="space-y-6">
            <Skeleton className="h-9 w-48 bg-surface-2" />
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
          className="border border-hairline bg-surface p-4 space-y-4"
        >
          <Skeleton className="aspect-[16/10] w-full rounded-md bg-surface-2" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-4/5 bg-surface-2" />
            <Skeleton className="h-4 w-1/2 bg-surface-2" />
          </div>
          <div className="pt-2 border-t border-hairline flex justify-between">
            <Skeleton className="h-4 w-12 bg-surface-2" />
            <Skeleton className="h-4 w-8 bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
