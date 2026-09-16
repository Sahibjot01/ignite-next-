// The platinum trophy's real silhouette is angular/faceted, distinct from
// the rounded cup shape of gold/silver/bronze — no icon library has this
// shape, so it's drawn here as a small original SVG matching lucide's
// stroke style (currentColor, 2px strokes) so it fits alongside <Medal>.
export default function PlatinumTrophyIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3l4.5 4.5L12 12 7.5 7.5 12 3z" />
      <path d="M7.5 7.5L3 9.5l4 3.5" />
      <path d="M16.5 7.5L21 9.5l-4 3.5" />
      <path d="M12 12v5" />
      <path d="M9 17h6" />
      <path d="M8 20h8" />
    </svg>
  );
}
