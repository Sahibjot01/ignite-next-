interface SectionHeadProps {
  eyebrow: string;
  title: string;
  sub?: string;
  accent?: "coral" | "platinum";
  aside?: string;
}

export default function SectionHead({
  eyebrow,
  title,
  sub,
  accent = "coral",
  aside,
}: SectionHeadProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex max-w-[46ch] flex-col gap-1.5">
        <p
          className={`font-display text-[11px] font-semibold uppercase tracking-[0.16em] ${
            accent === "coral" ? "text-coral" : "text-platinum"
          }`}
        >
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-medium leading-tight text-ink md:text-3xl">
          {title}
        </h2>
        {sub && <p className="text-sm leading-relaxed text-ink-dim">{sub}</p>}
      </div>
      {aside && (
        <span className="hidden shrink-0 pt-1 text-xs font-semibold uppercase tracking-widest text-ink-faint sm:inline">
          {aside}
        </span>
      )}
    </div>
  );
}
