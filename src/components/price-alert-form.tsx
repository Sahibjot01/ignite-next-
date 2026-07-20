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
      <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 flex flex-col items-center text-center gap-4">
        <Bell className="h-6 w-6 text-zinc-500" />
        <div>
          <h4 className="text-sm font-bold text-zinc-350">Want price alerts?</h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs">
            Sign in to track deal details and set alerts when the price drops below your target!
          </p>
        </div>
        <SignInButton mode="modal">
          <Button className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-full text-xs font-bold px-6 h-9">
            Sign In to Alert
          </Button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <Bell className="h-5 w-5 text-[#ff7676]" />
        <div>
          <h4 className="text-sm font-bold text-zinc-300">Set Price Alert</h4>
          <p className="text-xs text-zinc-500">Get notified immediately upon a price drop</p>
        </div>
      </div>

      {alert ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-zinc-900/50 p-3 border border-zinc-900 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">Active Target Price Alert</p>
              <p className="text-lg font-black text-[#ff7676] mt-0.5">
                ${alert.target_price.toFixed(2)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={handleDelete}
              className="border-zinc-800 hover:border-red-900 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 rounded-full h-8"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BellOff className="h-3.5 w-3.5 mr-1.5" />
              )}
              Remove
            </Button>
          </div>
          <p className="text-[10px] text-zinc-500 italic text-center">
            Currently tracking. If the lowest store price falls below your target, we will send an alert here.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-semibold">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white pl-7 pr-3 rounded-full focus:ring-[#ff7676] focus:border-[#ff7676] h-10 text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#ff7676] hover:bg-[#ff5858] text-white rounded-full font-bold px-5 h-10 text-sm"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Alert Me"
              )}
            </Button>
          </div>
          <p className="text-[10px] text-zinc-500">
            Suggested price target: 20% off current deal price (${Math.round(currentPrice * 0.8 * 100) / 100}).
          </p>
        </form>
      )}
    </div>
  );
}
