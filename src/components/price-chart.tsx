"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { TrendingDown } from "lucide-react";

// Recharts renders raw SVG attributes, not CSS — literal hex values mirroring
// the --void/--hairline/--ink-faint/--coral tokens in globals.css.
const GRID_COLOR = "rgba(226, 232, 244, 0.08)";
const AXIS_COLOR = "#576079"; // --ink-faint
const CORAL = "#ff7676"; // --coral
const VOID = "#0a0d13"; // --void

export interface Snapshot {
  id: string;
  game_id: number;
  price: number;
  normal_price: number;
  recorded_at: string;
}

interface PriceChartProps {
  snapshots: Snapshot[];
  hasPriceData: boolean;
}

export default function PriceChart({ snapshots, hasPriceData }: PriceChartProps) {
  if (!hasPriceData) {
    return (
      <div className="clip-notch-sm flex h-60 flex-col items-center justify-center border border-hairline bg-surface p-6 text-center text-ink-faint">
        <p className="font-semibold text-ink-dim">Pricing unavailable for this title</p>
        <p className="mt-1 max-w-xs text-xs text-ink-faint">
          We couldn&apos;t find this game on the PlayStation Store.
        </p>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="clip-notch-sm flex h-60 flex-col items-center justify-center border border-hairline bg-surface p-6 text-center text-ink-faint">
        <TrendingDown className="mb-2 h-8 w-8 animate-pulse text-ink-faint" />
        <p className="font-semibold text-ink-dim">Tracking started today</p>
        <p className="mt-1 max-w-xs text-xs text-ink-faint">
          No historical data yet. We just recorded the first price snapshot. Check back tomorrow for price trends!
        </p>
      </div>
    );
  }

  if (snapshots.length === 1) {
    return (
      <div className="clip-notch-sm flex h-60 flex-col items-center justify-center border border-hairline bg-surface p-6 text-center text-ink-faint">
        <TrendingDown className="mb-2 h-8 w-8 text-ink-faint" />
        <p className="font-semibold text-ink-dim">1 price point recorded (${snapshots[0].price})</p>
        <p className="mt-1 max-w-xs text-xs text-ink-faint">
          Tracking started on {format(new Date(snapshots[0].recorded_at), "MMM d, yyyy")}. Keep checking back for price changes!
        </p>
      </div>
    );
  }

  // Format data for chart
  const data = snapshots.map((s) => ({
    date: format(new Date(s.recorded_at), "MMM d"),
    rawDate: new Date(s.recorded_at),
    price: Number(s.price),
  }));

  const prices = data.map((d) => d.price);
  const minPrice = Math.max(0, Math.min(...prices) - 5);
  const maxPrice = Math.max(...prices) + 5;

  return (
    <div className="clip-notch-sm border border-hairline bg-surface p-6">
      <div className="mb-4">
        <h3 className="font-display text-sm font-semibold text-ink">Price History (CAD)</h3>
        <p className="text-xs text-ink-faint">Tracked price fluctuations over time</p>
      </div>
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={AXIS_COLOR}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke={AXIS_COLOR}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[minPrice, maxPrice]}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border border-hairline-strong bg-surface-2 px-3 py-2">
                      <p className="text-xs font-semibold text-ink-faint">
                        {payload[0].payload.date}
                      </p>
                      <p className="text-sm font-bold text-coral">
                        Price: ${payload[0].value}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={CORAL}
              strokeWidth={3}
              dot={{ stroke: CORAL, strokeWidth: 1, r: 4, fill: VOID }}
              activeDot={{ r: 6, fill: CORAL }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
