"use client";

import { useState } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setPriceAlert, deletePriceAlert, PriceAlert } from "@/lib/actions";
import { toast } from "sonner";

interface PriceAlertFormProps {
  gameId: number;
  currentPrice: number;
  initialAlert: PriceAlert | null;
}

export default function PriceAlertForm({ gameId, currentPrice, initialAlert }: PriceAlertFormProps) {
  const { isSignedIn } = useUser();
  const [alert, setAlert] = useState<PriceAlert | null>(initialAlert);
  const [targetPrice, setTargetPrice] = useState(
    initialAlert ? String(initialAlert.target_price) : String(Math.round(currentPrice * 0.8 * 100) / 100)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) return;

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await setPriceAlert(gameId, price);
      if (res.success) {
        toast.success(`We will notify you when price drops below $${price}!`);
        // Refresh alert local state
        setAlert({
          id: "",
          user_id: "",
          game_id: gameId,
          target_price: price,
          is_active: true,
          triggered_at: null,
          created_at: new Date().toISOString(),
        });
      } else {
        toast.error(res.error || "Failed to set alert");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isSignedIn) return;

    setIsSubmitting(true);
    try {
      const res = await deletePriceAlert(gameId);
      if (res.success) {
        toast.success("Price alert removed");
        setAlert(null);
        setTargetPrice(String(Math.round(currentPrice * 0.8 * 100) / 100));
      } else {
        toast.error(res.error || "Failed to remove alert");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="clip-notch-sm flex flex-col items-center gap-4 border border-hairline bg-surface p-6 text-center">
        <Bell className="h-6 w-6 text-ink-faint" />
        <div>
          <h4 className="font-display text-sm font-semibold text-ink">Want price alerts?</h4>
          <p className="mt-1 max-w-xs text-xs text-ink-faint">
            Sign in to track deal details and set alerts when the price drops below your target!
          </p>
        </div>
        <SignInButton mode="modal">
          <Button className="h-9 rounded-full bg-surface-2 px-6 text-xs font-bold text-ink hover:bg-surface-3">
            Sign In to Alert
          </Button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="clip-notch-sm border border-hairline bg-surface p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <Bell className="h-5 w-5 text-coral" />
        <div>
          <h4 className="font-display text-sm font-semibold text-ink">Set Price Alert</h4>
          <p className="text-xs text-ink-faint">Get notified immediately upon a price drop</p>
        </div>
      </div>

      {alert ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-hairline bg-surface-2/50 p-3">
            <div>
              <p className="text-xs text-ink-faint">Active Target Price Alert</p>
              <p className="mt-0.5 text-lg font-black text-coral">
                ${alert.target_price.toFixed(2)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={handleDelete}
              className="h-8 rounded-full border-hairline-strong text-ink-dim hover:border-red-900 hover:bg-red-950/20 hover:text-red-400"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BellOff className="h-3.5 w-3.5 mr-1.5" />
              )}
              Remove
            </Button>
          </div>
          <p className="text-center text-[10px] italic text-ink-faint">
            Currently tracking. If the lowest store price falls below your target, we will send an alert here.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-faint">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="h-10 rounded-full border-hairline bg-surface-2 pl-7 pr-3 text-sm text-ink focus:border-coral focus:ring-coral"
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-full bg-coral px-5 text-sm font-bold text-void hover:bg-[#ff5858]"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Alert Me"
              )}
            </Button>
          </div>
          <p className="text-[10px] text-ink-faint">
            Suggested price target: 20% off current deal price (${Math.round(currentPrice * 0.8 * 100) / 100}).
          </p>
        </form>
      )}
    </div>
  );
}
