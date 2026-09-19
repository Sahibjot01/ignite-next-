// Picks which of Sony's search results is actually the game we asked about.
//
// The search returns loosely ranked variants (sequels, DLC, bundles) and the
// old code took the first one, which was wrong often enough to matter:
// "Grand Theft Auto V" -> Grand Theft Auto VI, "God of War (2018)" -> God of
// War Sons of Sparta, "Elden Ring" -> Elden Ring Nightreign. That guess also
// decides which price gets tracked, so it has to be right or absent.

// The most a title can differ and still count as the same game. 0.75 is the
// lowest that still accepts RAWG's "Resident Evil 9: Requiem" against Sony's
// "Resident Evil Requiem" (3 of 4 words shared); anything looser starts
// accepting sequels ("Hades" vs "Hades 2" scores 0.5).
const MIN_SIMILARITY = 0.75;

// Sony names the same game differently in different places: "™"/"®", platform
// tags ("Destiny 2 PS4™ & PS5™"), page-title suffixes ("... - PS4 Games |
// PlayStation"), accents ("Yōtei"). RAWG adds a disambiguating year "(2018)".
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/\s+[-–]\s+PS[45].*$/i, "")
    .replace(/\s*\|.*$/, "")
    .toLowerCase()
    .replace(/[™®©'’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word !== "" && word !== "ps4" && word !== "ps5")
    .join(" ");
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const wordsA = new Set(a.split(" "));
  const wordsB = new Set(b.split(" "));
  const shared = [...wordsA].filter((word) => wordsB.has(word)).length;
  return shared / (wordsA.size + wordsB.size - shared);
}

// skuIds is optional on purpose: some real search results (non-product pages)
// come back without it, which crashed the first version of this.
interface TitledHit {
  title?: string;
  productName?: string;
  skuIds?: string[];
}

// Returns the best-matching hit, or null when nothing is close enough —
// "Not available" is a better answer than another game's price. On a tie the
// earlier (higher-ranked) hit wins.
export function pickBestHit<T extends TitledHit>(
  gameName: string,
  hits: T[],
): T | null {
  const target = normalizeTitle(gameName);
  let best: T | null = null;
  let bestScore = 0;

  for (const hit of hits) {
    if (!hit.skuIds || hit.skuIds.length === 0) continue;
    const candidateTitle = hit.title ?? hit.productName;
    if (!candidateTitle) continue;
    const score = similarity(target, normalizeTitle(candidateTitle));
    if (score > bestScore) {
      best = hit;
      bestScore = score;
    }
  }

  return bestScore >= MIN_SIMILARITY ? best : null;
}
