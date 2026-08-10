"use client";

import { useState } from "react";
import { BellRing, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MonthlyGamesAlertNudge() {
  const [dismissed, setDismissed] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="clip-notch-sm border border-hairline bg-surface-2 p-4 flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-coral-soft flex items-center justify-center shrink-0 animate-ignite-pulse">
        <BellRing className="h-5 w-5 text-coral" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">
          Never miss a free PS Plus game
        </p>
        <p className="text-xs text-ink-faint">
          Get notified in-app the moment next month&apos;s Essential lineup
          drops.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {subscribed ? (
          <span className="text-xs font-semibold text-emerald-500 px-3">
            You&apos;re in!
          </span>
        ) : (
          <Button
            size="sm"
            onClick={() => setSubscribed(true)}
            className="bg-coral hover:bg-[#ff5858] text-void rounded-full font-bold h-8 text-xs px-4"
          >
            Notify Me
          </Button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-ink-faint hover:text-ink p-1.5 rounded-full hover:bg-surface-3 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
