"use client";

import { useState, useTransition } from "react";
import { Sparkles, Bot, RefreshCw } from "lucide-react";
import GameTradingCard from "@/components/game-trading-card";
import AutoScrollRow from "@/components/auto-scroll-row";
import { Button } from "@/components/ui/button";
import {
  refreshRecommendations,
  type RecommendationCache,
  type CachedRecommendation,
} from "@/lib/actions";
import { imageResizeURL } from "@/lib/rawg";
import { hoursUntilRefresh, isStale } from "@/lib/recommendation-ttl";

function RecommendationRow({
  heading,
  badge,
  description,
  icon,
  items,
}: {
  heading: string;
  badge?: string;
  description?: string;
  icon: React.ReactNode;
  items: CachedRecommendation[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="mb-5 flex items-baseline gap-2">
        <h2 className="font-display text-lg font-medium text-ink">
          {heading}
        </h2>
        {badge && (
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-faint">
            {badge}
          </span>
        )}
      </div>
      {description && (
        <p className="mb-5 text-xs text-ink-faint">{description}</p>
      )}
      <AutoScrollRow className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {items.map((rec) => (
          <GameTradingCard
            key={rec.gameId}
            title={rec.name}
            cover={
              imageResizeURL(rec.backgroundImage, 640) ||
              "/icons/gamepad.svg"
            }
            metaIcon={icon}
            metaText={rec.reason}
            accent="platinum"
            href={`/game/${rec.gameId}`}
          />
        ))}
      </AutoScrollRow>
    </div>
  );
}

export default function RecommendationsPanel({
  initialCache,
}: {
  initialCache: RecommendationCache | null;
}) {
  const [cache, setCache] = useState(initialCache);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    setError(null);
    startTransition(async () => {
      const result = await refreshRecommendations();
      if (result.success) {
        setCache(result.cache);
      } else {
        setError(result.error);
      }
    });
  };

  if (isPending) {
    return (
      <div className="mt-12">
        <div className="animate-vault-glow clip-notch-md flex flex-col items-center gap-3 border border-hairline bg-surface px-6 py-10 text-center">
          <Sparkles className="h-6 w-6 animate-pulse text-platinum" />
          <p className="font-display text-sm font-medium text-ink">
            Ignite is thinking about what you&apos;d enjoy next…
          </p>
          <p className="text-xs text-ink-faint">
            Comparing your play history against the PlayStation catalog —
            this takes a few seconds.
          </p>
        </div>
      </div>
    );
  }

  if (!cache) {
    return (
      <div className="mt-12">
        <div className="clip-notch-md flex flex-col items-center gap-4 border border-dashed border-hairline-strong bg-surface/40 px-6 py-10 text-center">
          <Sparkles className="h-6 w-6 text-platinum" />
          <div>
            <h3 className="font-display text-lg font-medium text-ink">
              Discover something new
            </h3>
            <p className="mt-1 max-w-sm text-sm text-ink-faint">
              Get personalized picks based on your play history — our own
              rule-based recommender, plus a second AI-generated take for
              comparison.
            </p>
          </div>
          {error && <p className="text-xs text-coral">{error}</p>}
          <Button
            onClick={handleRefresh}
            className="animate-recommend-glow rounded-full bg-coral px-6 font-bold text-void hover:bg-[#ff5858]"
          >
            Get My Recommendations
          </Button>
        </div>
      </div>
    );
  }

  const stale = isStale(cache.computed_at);

  return (
    <>
      <RecommendationRow
        heading="Recommended For You"
        icon={<Sparkles className="h-3.5 w-3.5" />}
        items={cache.rule_based}
      />
      <RecommendationRow
        heading="AI Picks"
        badge="Experimental — for comparison"
        description="A separate, LLM-generated take on the same question — not the app's core recommendation logic, just a comparison against it."
        icon={<Bot className="h-3.5 w-3.5" />}
        items={cache.ai_picks}
      />

      <div className="clip-notch-sm mt-6 flex items-center justify-between gap-4 border border-hairline bg-surface/60 px-4 py-3">
        {error ? (
          <p className="text-xs text-coral">{error}</p>
        ) : stale ? (
          <p className="text-xs text-ink-faint">
            Your picks are due for a refresh.
          </p>
        ) : (
          <p className="text-xs text-ink-faint">
            Next refresh available in {hoursUntilRefresh(cache.computed_at)}h.
          </p>
        )}
        {stale && (
          <Button
            onClick={handleRefresh}
            size="sm"
            className="animate-recommend-glow flex items-center gap-1.5 rounded-full bg-coral px-4 font-bold text-void hover:bg-[#ff5858]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        )}
      </div>
    </>
  );
}
