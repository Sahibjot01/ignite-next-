"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";
import ToggleSwitch from "@/components/ui/toggle-switch";

export default function MonthlyAlertsCard() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="clip-notch-sm border border-hairline bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <BellRing className="h-5 w-5 text-coral shrink-0" />
          <div>
            <h4 className="font-display text-sm font-semibold text-ink">
              Monthly Free Games
            </h4>
            <p className="text-xs text-ink-faint">
              Get an in-app alert the moment this month&apos;s Essential
              lineup drops.
            </p>
          </div>
        </div>
        <ToggleSwitch
          checked={enabled}
          onCheckedChange={setEnabled}
          label="Toggle monthly free games alert"
        />
      </div>
    </div>
  );
}
