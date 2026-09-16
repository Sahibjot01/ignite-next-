import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Clock, Gamepad2, Sparkles } from "lucide-react";
import Navbar from "@/components/navbar";
import SectionHead from "@/components/section-head";
import GameTradingCard from "@/components/game-trading-card";
import TrophySummaryStrip from "@/components/trophy-summary-strip";
import AutoScrollRow from "@/components/auto-scroll-row";
import { Button } from "@/components/ui/button";
import {
  getPsnAccountStatus,
  getLibraryGames,
  getTrophySummary,
} from "@/lib/actions";
import { getRecommendations } from "@/lib/recommendations";
import { formatPlayDuration, parseDurationToMinutes } from "@/lib/psn";
import { imageResizeURL, resolveGameIds } from "@/lib/rawg";
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

  const psnAccount = await getPsnAccountStatus();

  let content;

  if (!psnAccount) {
    content = (
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
  } else {
    const result = await getLibraryGames();

    if (!result.success) {
      const sessionExpired = result.error.includes("session expired");
      content = (
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
    } else if (result.games.length === 0) {
      content = (
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
    } else {
      // getTrophySummary() does its own PSN token refresh — kept sequential
      // relative to getLibraryGames() above (already awaited by this point,
      // so no overlap) since PSN's refresh token rotates on every use and
      // two concurrent refreshes racing on the same stored token could make
      // one fail. getRecommendations() never touches PSN tokens (RAWG
      // only), so it's safe to run alongside the trophy fetch.
      // getLibraryGames() returns games sorted by recency (PSN's API
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

      // PSN titles have no RAWG id of their own, so cards can't link
      // anywhere without resolving one first — none of getTrophySummary(),
      // getRecommendations(), or this resolve step touch PSN tokens
      // except the trophy call, so all three run together safely (see the
      // note on the trophy/library sequencing below).
      const [trophyResult, recommendations, gameIds] = await Promise.all([
        getTrophySummary(),
        getRecommendations(result.games),
        resolveGameIds([
          ...mostPlayed.map((g) => g.name),
          ...recentlyPlayed.map((g) => g.name),
        ]),
      ]);

      content = (
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
              const rawgId = gameIds.get(game.name);
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
                  href={rawgId ? `/game/${rawgId}` : undefined}
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
              const rawgId = gameIds.get(game.name);
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
                  href={rawgId ? `/game/${rawgId}` : undefined}
                />
              );
            })}
          </AutoScrollRow>

          {recommendations.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-5 font-display text-lg font-medium text-ink">
                Recommended For You
              </h2>
              <AutoScrollRow className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
                {recommendations.map((rec) => (
                  <GameTradingCard
                    key={rec.game.id}
                    title={rec.game.name}
                    cover={
                      imageResizeURL(rec.game.background_image, 640) ||
                      "/icons/gamepad.svg"
                    }
                    metaIcon={<Sparkles className="h-3.5 w-3.5" />}
                    metaText={rec.reason}
                    accent="platinum"
                    href={`/game/${rec.game.id}`}
                  />
                ))}
              </AutoScrollRow>
            </div>
          )}
        </>
      );
    }
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
        {content}
      </main>
    </div>
  );
}
