"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { TrendingDown } from "lucide-react";

export interface Snapshot {
  id: string;
  game_id: number;
  price: number;
  normal_price: number;
  recorded_at: string;
}

interface PriceChartProps {
  snapshots: Snapshot[];
  cheapsharkMatched: boolean;
}

export default function PriceChart({ snapshots, cheapsharkMatched }: PriceChartProps) {
  if (!cheapsharkMatched) {
    return (
      <div className="flex h-60 flex-col items-center justify-center rounded-xl border border-zinc-900 bg-zinc-950 text-zinc-500 text-center p-6">
        <p className="font-semibold text-zinc-400">Pricing unavailable for this title</p>
        <p className="text-xs text-zinc-600 mt-1 max-w-xs">
          We couldn&apos;t find a matching PC deal for this game on CheapShark.
        </p>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="flex h-60 flex-col items-center justify-center rounded-xl border border-zinc-900 bg-zinc-950 text-zinc-500 text-center p-6">
        <TrendingDown className="h-8 w-8 text-zinc-600 mb-2 animate-pulse" />
        <p className="font-semibold text-zinc-400">Tracking started today</p>
        <p className="text-xs text-zinc-650 mt-1 max-w-xs">
          No historical data yet. We just recorded the first price snapshot. Check back tomorrow for price trends!
        </p>
      </div>
    );
  }

  if (snapshots.length === 1) {
    return (
      <div className="flex h-60 flex-col items-center justify-center rounded-xl border border-zinc-900 bg-zinc-950 text-zinc-500 text-center p-6">
        <TrendingDown className="h-8 w-8 text-zinc-600 mb-2" />
        <p className="font-semibold text-zinc-400">1 price point recorded (${snapshots[0].price})</p>
        <p className="text-xs text-zinc-600 mt-1 max-w-xs">
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
    <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6">
      <div className="mb-4">
        <h3 className="text-base font-bold text-zinc-300">Price History (USD)</h3>
        <p className="text-xs text-zinc-500">Tracked price fluctuations over time</p>
      </div>
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#71717a"
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
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 shadow-md">
                      <p className="text-xs font-semibold text-zinc-400">
                        {payload[0].payload.date}
                      </p>
                      <p className="text-sm font-bold text-[#ff7676]">
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
              stroke="#ff7676"
              strokeWidth={3}
              dot={{ stroke: "#ff7676", strokeWidth: 1, r: 4, fill: "#000" }}
              activeDot={{ r: 6, fill: "#ff7676" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
