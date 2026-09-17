import { Medal } from "lucide-react";
import PlatinumTrophyIcon from "@/components/icons/platinum-trophy-icon";

interface TrophySummaryStripProps {
  trophyLevel: number;
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
}

const GRADES = [
  { key: "platinum", label: "Platinum", color: "text-platinum" },
  { key: "gold", label: "Gold", color: "text-amber-400" },
  { key: "silver", label: "Silver", color: "text-slate-300" },
  { key: "bronze", label: "Bronze", color: "text-amber-700" },
] as const;

export default function TrophySummaryStrip({
  trophyLevel,
  platinum,
  gold,
  silver,
  bronze,
}: TrophySummaryStripProps) {
  const counts = { platinum, gold, silver, bronze };

  return (
    // Below `sm`, the level block stacks on top (full width, divider
    // below it) and the four grades become a 2x2 grid instead of one tight
    // row — the single-row layout was overflowing its own clip-path on a
    // real phone width (confirmed: the last grade's right edge measured
    // ~26px past the strip's padded content edge at 375px), clipping the
    // bronze count. `sm` and up is unchanged from before.
    <div className="animate-vault-glow clip-notch-md flex flex-col gap-4 border border-hairline bg-surface px-6 py-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex items-center justify-between border-b border-hairline pb-4 sm:flex-col sm:justify-center sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
        <span className="font-display text-2xl font-bold text-ink">
          {trophyLevel}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-ink-faint">
          Level
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-1 sm:items-center sm:justify-start sm:gap-10">
        {GRADES.map((grade) => (
          <div key={grade.key} className="flex items-center gap-2">
            {grade.key === "platinum" ? (
              <PlatinumTrophyIcon className={`h-5 w-5 ${grade.color}`} />
            ) : (
              <Medal className={`h-5 w-5 ${grade.color}`} />
            )}
            <span className="font-display text-lg font-semibold text-ink">
              {counts[grade.key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
