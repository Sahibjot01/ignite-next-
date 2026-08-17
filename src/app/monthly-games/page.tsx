import Navbar from "@/components/navbar";
import SectionHead from "@/components/section-head";
import MonthlyGamesAlertNudge from "@/components/monthly-games-alert-nudge";
import EssentialGameCard from "@/components/essential-game-card";
import { getCurrentEssentialGames } from "@/lib/ps-plus";

export const dynamic = "force-dynamic";

export default async function MonthlyGamesPage() {
  const games = await getCurrentEssentialGames();

  return (
    <div className="flex flex-col min-h-screen bg-void text-ink">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 md:px-12">
        <div className="mb-8">
          <SectionHead
            eyebrow="PS Plus Essential"
            title="This Month's Free Games"
            sub="Claim these before they rotate out — once the month ends, they're full price again."
            accent="coral"
          />
        </div>

        <div className="mb-8">
          <MonthlyGamesAlertNudge />
        </div>

        {games.length === 0 ? (
          <div className="clip-notch-md border border-dashed border-hairline-strong bg-surface/50 p-10 text-center">
            <p className="text-sm text-ink-dim">
              Couldn&apos;t find this month&apos;s Essential lineup right now
              — try again shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <EssentialGameCard key={game.productId} game={game} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
