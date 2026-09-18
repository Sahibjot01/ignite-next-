import { Suspense } from "react";
import Navbar from "@/components/navbar";
import SectionHead from "@/components/section-head";
import MonthlyGamesAlertNudge from "@/components/monthly-games-alert-nudge";
import EssentialGameCard from "@/components/essential-game-card";
import CatalogChangeCard from "@/components/catalog-change-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentEssentialGames } from "@/lib/ps-plus";
import { getMonthlyAlertPreference } from "@/lib/actions";
import { createSupabaseAdminClient } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default function MonthlyGamesPage() {
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

        {/* This data source is fast today, but streaming it behind a
            skeleton costs nothing and means the page doesn't need
            revisiting if that ever changes (a slower fallback source, a
            cold cache, etc.) — same reasoning as the other pages. */}
        <Suspense fallback={<MonthlyGamesSkeleton />}>
          <MonthlyGamesContent />
        </Suspense>

        <div className="mb-8 mt-16">
          <SectionHead
            eyebrow="PS Plus Extra / Premium"
            title="Recently Changed in the Catalog"
            sub="Every game that's joined or left the Extra/Premium catalog, most recent first — unfiltered, not just what's on your wishlist."
            accent="platinum"
          />
        </div>

        <Suspense fallback={<CatalogChangesSkeleton />}>
          <CatalogChangesContent />
        </Suspense>
      </main>
    </div>
  );
}

async function CatalogChangesContent() {
  const supabase = createSupabaseAdminClient();
  const { data: changes } = await supabase
    .from("catalog_change_log")
    .select("product_id, name, image_url, concept_url, change_type, detected_at")
    .order("detected_at", { ascending: false })
    .limit(12);

  if (!changes || changes.length === 0) {
    return (
      <div className="clip-notch-md border border-dashed border-hairline-strong bg-surface/50 p-10 text-center">
        <p className="text-sm text-ink-dim">
          No catalog changes detected yet — this fills in as the daily check
          finds real additions/removals, not backfilled from history.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {changes.map((change) => (
        <CatalogChangeCard
          key={`${change.product_id}-${change.detected_at}`}
          name={change.name}
          imageUrl={change.image_url}
          conceptUrl={change.concept_url}
          changeType={change.change_type as "added" | "removed"}
          detectedAt={change.detected_at}
        />
      ))}
    </div>
  );
}

function CatalogChangesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <EssentialCardSkeleton key={i} />
      ))}
    </div>
  );
}

async function MonthlyGamesContent() {
  const games = await getCurrentEssentialGames();
  const alreadySubscribed = await getMonthlyAlertPreference();

  return (
    <>
      <div className="mb-8">
        <MonthlyGamesAlertNudge initialSubscribed={alreadySubscribed} />
      </div>

      {games.length === 0 ? (
        <div className="clip-notch-md border border-dashed border-hairline-strong bg-surface/50 p-10 text-center">
          <p className="text-sm text-ink-dim">
            Couldn&apos;t find this month&apos;s Essential lineup right now —
            try again shortly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <EssentialGameCard key={game.productId} game={game} />
          ))}
        </div>
      )}
    </>
  );
}

function EssentialCardSkeleton() {
  return (
    <div className="clip-notch-md relative flex h-full flex-col overflow-hidden border border-hairline bg-surface">
      <Skeleton className="aspect-[16/10] w-full rounded-none bg-surface-2" />
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-4/5 bg-surface-2" />
          <Skeleton className="h-3 w-2/5 bg-surface-2" />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
          <Skeleton className="h-4 w-24 bg-surface-2" />
          <Skeleton className="h-4 w-20 bg-surface-2" />
        </div>
      </div>
    </div>
  );
}

function MonthlyGamesSkeleton() {
  return (
    <>
      <Skeleton className="clip-notch-md mb-8 h-16 w-full bg-surface-2" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <EssentialCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
