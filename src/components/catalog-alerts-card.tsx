"use client";

import { useState } from "react";
import { Layers } from "lucide-react";
import ToggleSwitch from "@/components/ui/toggle-switch";
import { setCatalogAlertPreference } from "@/lib/actions";

export default function CatalogAlertsCard({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const handleAlert = async (newValue: boolean) => {
    setEnabled(newValue);
    const res = await setCatalogAlertPreference(newValue);
    if (!res.success) {
      setEnabled(!newValue);
    }
  };
  return (
    <div className="clip-notch-sm border border-hairline bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Layers className="h-5 w-5 text-coral shrink-0" />
          <div>
            <h4 className="font-display text-sm font-semibold text-ink">
              Wishlist Catalog Matches
            </h4>
            <p className="text-xs text-ink-faint">
              Get an in-app alert when a wishlisted game joins or leaves the
              PS Plus Extra/Premium catalog.
            </p>
          </div>
        </div>
        <ToggleSwitch
          checked={enabled}
          onCheckedChange={handleAlert}
          label="Toggle wishlist catalog match alerts"
        />
      </div>
    </div>
  );
}
