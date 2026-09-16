import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Clock, Gamepad2, Sparkles } from "lucide-react";
import Navbar from "@/components/navbar";
import SectionHead from "@/components/section-head";
import GameTradingCard from "@/components/game-trading-card";
import TrophySummaryStrip from "@/components/trophy-summary-strip";
import { Button } from "@/components/ui/button";
import { getPsnAccountStatus, getLibraryGames } from "@/lib/actions";
import { formatPlayDuration } from "@/lib/psn";
import { format } from "date-fns";
export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  ps5_native_game: "PS5",
  ps4_game: "PS4",
  pspc_game: "PC",
};

// Placeholder only — real genre/playtime-weighted scoring is P4, not yet
// built. Kept visually real so the layout can be judged, but never
// presented as an actual personalized pick.
const RECOMMENDATION_PREVIEW = [
  { title: "Because you play a lot of RPGs", reason: "Matches your top genre" },
  { title: "Similar to your most-played game", reason: "Same genre, unowned" },
  { title: "Highly rated in a genre you like", reason: "High RAWG rating" },
];

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
      content = (
        <>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-faint">
              Preview — placeholder numbers
            </span>
          </div>
          <div className="mb-10">
            <TrophySummaryStrip
              trophyLevel={72}
              platinum={0}
              gold={6}
              silver={19}
              bronze={211}
            />
          </div>

          <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {result.games.map((game) => {
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
                />
              );
            })}
          </div>

          <div className="mt-12">
            <div className="mb-5 flex items-baseline gap-2">
              <h2 className="font-display text-lg font-medium text-ink">
                Recommended For You
              </h2>
              <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-faint">
                Preview
              </span>
            </div>
            <p className="mb-5 text-xs text-ink-faint">
              A look at what this will feel like — real picks based on your
              genres and playtime are still being built.
            </p>
            <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
              {RECOMMENDATION_PREVIEW.map((rec) => (
                <GameTradingCard
                  key={rec.title}
                  title={rec.title}
                  cover="/icons/gamepad.svg"
                  metaIcon={<Sparkles className="h-3.5 w-3.5" />}
                  metaText={rec.reason}
                  accent="platinum"
                />
              ))}
            </div>
          </div>
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
