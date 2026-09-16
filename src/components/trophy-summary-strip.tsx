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
    <div className="animate-vault-glow clip-notch-md flex items-center gap-6 border border-hairline bg-surface px-6 py-4">
      <div className="flex flex-col items-center border-r border-hairline pr-6">
        <span className="font-display text-2xl font-bold text-ink">
          {trophyLevel}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-ink-faint">
          Level
        </span>
      </div>
      <div className="flex flex-1 items-center justify-between gap-4 sm:justify-start sm:gap-10">
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
