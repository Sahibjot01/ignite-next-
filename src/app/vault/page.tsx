import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Clock, Gamepad2 } from "lucide-react";
import Navbar from "@/components/navbar";
import SectionHead from "@/components/section-head";
import GameTradingCard from "@/components/game-trading-card";
import TrophySummaryStrip from "@/components/trophy-summary-strip";
import AutoScrollRow from "@/components/auto-scroll-row";
import RecommendationsPanel from "@/components/recommendations-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPsnAccountStatus,
  getVaultOverview,
  getRecommendationCache,
} from "@/lib/actions";
import { formatPlayDuration, parseDurationToMinutes } from "@/lib/psn";
import { buildConceptUrl } from "@/lib/ps-store";
import { format } from "date-fns";
export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  ps5_native_game: "PS5",
  ps4_game: "PS4",
  pspc_game: "PC",
};

export default async function LibraryPage() {
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
            eyebrow="Vault"
            title="Your Vault"
            sub="What you've played, and what to play next."
            accent="platinum"
          />
        </div>
        {/* The nav/title shell above renders immediately — everything below
            needs live PSN data (a real Sony OAuth round trip + a played-games
            fetch, ~1s combined, confirmed by timing it — see
            PSN-CONCEPT-ID-LINKING.md) that can't be cut further without
            caching, which was deliberately ruled out here in favor of just
            not blocking the whole page on it. Same pattern the home page
            already uses for its own RAWG-backed content. */}
        <Suspense fallback={<VaultSkeleton />}>
          <VaultContent />
        </Suspense>
      </main>
    </div>
  );
}

async function VaultContent() {
  // Kicked off here, not awaited until it's actually needed below — this
  // has no dependency on PSN data (it's a per-user DB row keyed on userId
  // alone), so there's no reason to pay for its ~220ms Supabase round trip
  // sequentially after the PSN work finishes. Runs "for free," overlapped
  // with getPsnAccountStatus() + getVaultOverview() below.
  const recommendationCachePromise = getRecommendationCache();

  const psnAccount = await getPsnAccountStatus();

  if (!psnAccount) {
    return (
      <div className="clip-notch-lg flex flex-col items-center justify-center border border-dashed border-hairline-strong bg-surface/40 px-4 py-16 text-center">
        <div className="mb-4 rounded-full border border-hairline-strong bg-surface-2 p-4 text-coral">
          <Gamepad2 className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg font-medium text-ink">
          No PlayStation account linked
        </h3>
        <p className="mt-1 max-w-sm text-xs text-ink-faint">
          Link your PlayStation account to see your play history here.
        </p>
        <Link href="/settings" className="mt-6">
          <Button className="rounded-full bg-coral px-6 font-bold text-void hover:bg-[#ff5858]">
            Go to Settings
          </Button>
        </Link>
      </div>
    );
  }

  const result = await getVaultOverview();

  if (!result.success) {
    const sessionExpired = result.error.includes("session expired");
    return (
      <div className="clip-notch-lg flex flex-col items-center justify-center border border-dashed border-hairline-strong bg-surface/40 px-4 py-16 text-center">
        <div className="mb-4 rounded-full border border-hairline-strong bg-surface-2 p-4 text-coral">
          <Gamepad2 className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg font-medium text-ink">
          {sessionExpired ? "Session expired" : "Couldn't load your library"}
        </h3>
        <p className="mt-1 max-w-sm text-xs text-ink-faint">{result.error}</p>
        <Link href="/settings" className="mt-6">
          <Button className="rounded-full bg-coral px-6 font-bold text-void hover:bg-[#ff5858]">
            Check your PlayStation connection
          </Button>
        </Link>
      </div>
    );
  }

  if (result.games.length === 0) {
    return (
      <div className="clip-notch-lg flex flex-col items-center justify-center border border-dashed border-hairline-strong bg-surface/40 px-4 py-16 text-center">
        <div className="mb-4 rounded-full border border-hairline-strong bg-surface-2 p-4 text-coral">
          <Gamepad2 className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg font-medium text-ink">
          No play history yet
        </h3>
        <p className="mt-1 max-w-sm text-xs text-ink-faint">
          Once you play something on PS4 or PS5, it&apos;ll show up here.
        </p>
      </div>
    );
  }

  // getVaultOverview() returns games sorted by recency (PSN's API
  // default, not something this app controls) — that's the right
  // order for "Recently Played" as-is. "Most Played" is a separate
  // client-side sort by actual playtime, since PSN's API has no way
  // to request that ordering directly.
  const mostPlayed = [...result.games]
    .sort(
      (a, b) =>
        parseDurationToMinutes(b.playDuration) -
        parseDurationToMinutes(a.playDuration),
    )
    .slice(0, 15);
  const recentlyPlayed = result.games.slice(0, 15);
  const trophyResult = result.trophy;

  // Recommendations are computed lazily, behind a button (see
  // RecommendationsPanel + getRecommendationCache/refreshRecommendations
  // in lib/actions.ts) — this just reads whatever's already cached, a
  // cheap DB lookup, and null when nothing's been generated yet.
  const recommendationCache = await recommendationCachePromise;

  return (
    <>
      {trophyResult.success && (
        <div className="mb-10">
          <TrophySummaryStrip
            trophyLevel={trophyResult.summary.trophyLevel}
            platinum={trophyResult.summary.platinum}
            gold={trophyResult.summary.gold}
            silver={trophyResult.summary.silver}
            bronze={trophyResult.summary.bronze}
          />
        </div>
      )}

      <h2 className="mb-5 font-display text-lg font-medium text-ink">
        Most Played
      </h2>
      <AutoScrollRow className="no-scrollbar mb-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {mostPlayed.map((game) => {
          const cover =
            game.imageUrl || game.localizedImageUrl || "/icons/gamepad.svg";
          return (
            <GameTradingCard
              key={game.titleId}
              title={game.name}
              cover={cover}
              badge={CATEGORY_LABEL[game.category]}
              subText={`Last played ${format(new Date(game.lastPlayedDateTime), "MMM d, yyyy")}`}
              metaIcon={<Clock className="h-3.5 w-3.5" />}
              metaText={`${formatPlayDuration(game.playDuration)} played`}
              accent="coral"
              href={buildConceptUrl(game.concept.id)}
            />
          );
        })}
      </AutoScrollRow>

      <h2 className="mb-5 font-display text-lg font-medium text-ink">
        Recently Played
      </h2>
      <AutoScrollRow className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {recentlyPlayed.map((game) => {
          const cover =
            game.imageUrl || game.localizedImageUrl || "/icons/gamepad.svg";
          return (
            <GameTradingCard
              key={game.titleId}
              title={game.name}
              cover={cover}
              badge={CATEGORY_LABEL[game.category]}
              subText={`Last played ${format(new Date(game.lastPlayedDateTime), "MMM d, yyyy")}`}
              metaIcon={<Clock className="h-3.5 w-3.5" />}
              metaText={`${formatPlayDuration(game.playDuration)} played`}
              accent="coral"
              href={buildConceptUrl(game.concept.id)}
            />
          );
        })}
      </AutoScrollRow>

      <RecommendationsPanel initialCache={recommendationCache} />
    </>
  );
}

function VaultCardSkeleton() {
  return (
    <div className="clip-notch-md relative flex h-full w-56 shrink-0 flex-col overflow-hidden border border-hairline bg-surface">
      <Skeleton className="aspect-[3/4] w-full rounded-none bg-surface-2" />
      <div className="space-y-2 border-t border-hairline px-3 py-2.5">
        <Skeleton className="h-3 w-4/5 bg-surface-2" />
        <Skeleton className="h-3 w-1/2 bg-surface-2" />
      </div>
    </div>
  );
}

function VaultCardRowSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <VaultCardSkeleton key={i} />
      ))}
    </div>
  );
}

function VaultSkeleton() {
  return (
    <div>
      <Skeleton className="clip-notch-md mb-10 h-[92px] w-full bg-surface-2" />

      <Skeleton className="mb-5 h-7 w-40 bg-surface-2" />
      <div className="mb-12">
        <VaultCardRowSkeleton />
      </div>

      <Skeleton className="mb-5 h-7 w-44 bg-surface-2" />
      <VaultCardRowSkeleton />
    </div>
  );
}
