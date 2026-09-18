const ENDPOINT_URL = "https://www.playstation.com/bin/imagic/gameslist";
export interface RawGame {
  name: string;
  productId: string;
  conceptUrl: string;
  imageUrl: string;
  releaseDate: string;
  streamingSupported: boolean;
  genre?: string[];
}

export interface EssentialGameResponse {
  catalogKey: string;
  count: number;
  games: RawGame[];
}

// Shared fetch: the imagic/gameslist endpoint is one endpoint family with a
// `categoryList` param that changes which catalog comes back — Essential
// monthly (3 games), Extra/Premium (~470), Ubisoft+ Classics, etc. — all in
// the same 27-alphabet-bucket shape. See PSN-API-DISCOVERY.md's "Round four".
async function fetchCatalogList(
  categoryList: string,
  locale = "en-ca",
): Promise<RawGame[]> {
  const queryParams = new URLSearchParams({
    locale: locale,
    categoryList: categoryList,
  });
  const fullUrl = `${ENDPOINT_URL}?${queryParams.toString()}`;
  const reqHeader = new Headers();
  reqHeader.set("Content-Type", "application/json");
  reqHeader.set("Accept", "*/*");

  const res = await fetch(fullUrl, {
    headers: reqHeader,
    next: {
      revalidate: 60,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${categoryList}: ${res.statusText}`);
  }
  const buckets = (await res.json()) as EssentialGameResponse[];
  return buckets.flatMap((bucket) => bucket.games);
}

export async function getCurrentEssentialGames(
  locale = "en-ca",
): Promise<RawGame[]> {
  return fetchCatalogList("plus-monthly-games-list", locale);
}

// P5 Tier 2 — the Extra/Premium catalog: ~470 titles vs. Essential's 3, same
// endpoint family, confirmed against the real API in PSN-API-DISCOVERY.md.
export async function getExtraPremiumCatalog(
  locale = "en-ca",
): Promise<RawGame[]> {
  return fetchCatalogList("plus-games-list", locale);
}

// Lean shape stored in ps_plus_catalog_state between cron runs — just enough
// to diff by productId and still have a name/link if a game disappears (a
// removed game is gone from the live API response, so its name has to be
// remembered from the last time it was seen, not re-fetched).
export interface CatalogEntry {
  productId: string;
  name: string;
  conceptUrl: string;
  imageUrl: string | null;
}

export function toCatalogEntries(games: RawGame[]): CatalogEntry[] {
  return games.map((game) => ({
    productId: game.productId,
    name: game.name,
    conceptUrl: game.conceptUrl,
    imageUrl: game.imageUrl ?? null,
  }));
}

// Some Extra/Premium catalog entries carry a trailing platform tag the
// wishlist name won't have (e.g. "A Little to the Left PS4 & PS5",
// confirmed against real catalog data) — stripped before comparing.
const PLATFORM_SUFFIX_RE = /\s*(ps4\s*(&|and)?\s*ps5|ps5|ps4)$/;

// RAWG-sourced wishlist names disambiguate a franchise's original entry
// with a trailing year, e.g. "God of War (2018)" — PS Store's own catalog
// just calls it "God of War". Stripped from the raw name (before lowercase/
// punctuation cleanup) so the two agree; narrow on purpose — only a
// trailing "(...)" group, not general substring matching (see the
// exact-match note below for why loose matching is the thing to avoid
// here).
function stripTrailingParenthetical(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function normalize(name: string): string {
  const cleaned = stripTrailingParenthetical(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
  return cleaned.replace(PLATFORM_SUFFIX_RE, "").trim();
}

export interface CatalogMatch<T> {
  game: T;
  matchedWishlistName: string;
}

// Matches catalog entries (additions or removals) against a user's wishlist
// names by exact match on the normalized name, not a prefix match.
//
// A prefix match was tried first and caught a real bug in live testing:
// the catalog's "God of War" entry prefix-matched the wishlist's "God of
// War (2018)" (correct — same game with a disambiguating year) but also
// "God of War: Ragnarök" and "God of War Ragnarok: Valhalla" (wrong — those
// are different games in the same franchise, not editions of one game).
// Exact match after stripping punctuation/platform-suffix noise avoids that
// false positive; the tradeoff is missing a real match if a catalog entry
// carries an edition suffix the wishlist name doesn't ("... Deluxe
// Edition") — an acceptable miss, a wrong "your wishlisted sequel is free"
// alert is not.
export function matchCatalogToWishlist<T extends { name: string }>(
  games: T[],
  wishlistNames: string[],
): CatalogMatch<T>[] {
  if (wishlistNames.length === 0) return [];
  const normalizedWishlist = wishlistNames.map(normalize);
  const matches: CatalogMatch<T>[] = [];
  for (const game of games) {
    const candidateName = normalize(game.name);
    const matchIndex = normalizedWishlist.findIndex(
      (wishlistName) => wishlistName === candidateName,
    );
    if (matchIndex !== -1) {
      matches.push({ game, matchedWishlistName: wishlistNames[matchIndex] });
    }
  }
  return matches;
}
