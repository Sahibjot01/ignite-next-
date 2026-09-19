"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import ToggleSwitch from "@/components/ui/toggle-switch";
import { setEmailAlertPreference } from "@/lib/actions";

export default function EmailAlertsCard({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const handleAlert = async (newValue: boolean) => {
    setEnabled(newValue);
    const res = await setEmailAlertPreference(newValue);
    if (!res.success) {
      setEnabled(!newValue);
    }
  };
  return (
    <div className="clip-notch-sm border border-hairline bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Mail className="h-5 w-5 text-coral shrink-0" />
          <div>
            <h4 className="font-display text-sm font-semibold text-ink">
              Email Alerts
            </h4>
            <p className="text-xs text-ink-faint">
              Also email the alerts you&apos;ve turned on above to your account
              email — for when you&apos;re not in the app.
            </p>
          </div>
        </div>
        <ToggleSwitch
          checked={enabled}
          onCheckedChange={handleAlert}
          label="Toggle email alerts"
        />
      </div>
    </div>
  );
}
