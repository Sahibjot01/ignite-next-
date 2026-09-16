import type { UserPlayedGamesResponse } from "psn-api";
import { searchGames, getGamesByGenres, type Game } from "./rawg";

type PlayedGame = UserPlayedGamesResponse["titles"][number];

export interface Recommendation {
  game: Game;
  reason: string;
}

// Below this, a game is a bounce-off, not a "liked it" signal. A quick
// 11-minute try-and-quit shouldn't count toward the genres it's weighted
// into — this was flagged directly in ROADMAP.md as a real flaw to avoid,
// not an edge case: naive playtime-weighting treats every minute played
// as positive, which is backwards for games someone dropped immediately.
const MIN_ENGAGEMENT_MINUTES = 30;

// How many of the user's top (post-filter) most-played games to base
// genre weighting on — matches ROADMAP.md's "top genres from your 5
// most-played games" spec.
const TOP_PLAYED_COUNT = 5;

const MAX_RECOMMENDATIONS = 6;

function parseDurationToMinutes(duration: string): number {
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  const hours = Number(match?.[1] ?? 0);
  const minutes = Number(match?.[2] ?? 0);
  return hours * 60 + minutes;
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// The first two significant words of a title — a cheap way to group a
// base game with its own editions/DLC, which RAWG lists as separate
// catalog entries. Splitting on colon/dash alone isn't enough: confirmed
// against the real API that "The Witcher 3: Wild Hunt – Blood and Wine"
// and "The Witcher 3 Wild Hunt - Complete Edition" split to different
// prefixes (one has an early colon, the other doesn't) even though
// they're editions of the same game — comparing the first two words
// catches both ("the witcher").
function franchiseKey(name: string): string {
  return normalize(name).split(/\s+/).slice(0, 2).join(" ");
}

interface GenreTally {
  name: string;
  slug: string;
  count: number;
  // The most-played game that contributed this genre, used for the
  // "because you played X" reasoning on suggestions later.
  exampleGameName: string;
}

export async function getRecommendations(
  playedGames: PlayedGame[],
): Promise<Recommendation[]> {
  const engaged = playedGames.filter(
    (game) => parseDurationToMinutes(game.playDuration) >= MIN_ENGAGEMENT_MINUTES,
  );
  if (engaged.length === 0) return [];

  const topPlayed = [...engaged]
    .sort(
      (a, b) =>
        parseDurationToMinutes(b.playDuration) -
        parseDurationToMinutes(a.playDuration),
    )
    .slice(0, TOP_PLAYED_COUNT);

  // RAWG has no way to look a game up by PSN title ID, so each top-played
  // game gets resolved to its RAWG record by name search — same approach
  // already used for PS Store price resolution (lib/ps-store.ts).
  const resolved = await Promise.all(
    topPlayed.map(async (playedGame) => {
      const hits = await searchGames(playedGame.name);
      return { playedGame, rawgMatch: hits[0] };
    }),
  );

  const genreTallies = new Map<string, GenreTally>();
  for (const { playedGame, rawgMatch } of resolved) {
    for (const genre of rawgMatch?.genres ?? []) {
      const existing = genreTallies.get(genre.slug);
      if (existing) {
        existing.count += 1;
      } else {
        genreTallies.set(genre.slug, {
          name: genre.name,
          slug: genre.slug,
          count: 1,
          exampleGameName: playedGame.name,
        });
      }
    }
  }

  const topGenres = [...genreTallies.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  if (topGenres.length === 0) return [];

  // Excludes by name-prefix, not just exact title — "Bloodborne: The Old
  // Hunters" is DLC for a game already played, but its exact name never
  // matches "Bloodborne" as a string. Confirmed against the real API:
  // without this, already-played games' own DLC showed up as "recommended".
  const ownedNames = playedGames.map((game) => normalize(game.name));
  const candidates = await getGamesByGenres(topGenres.map((g) => g.slug));
  const unowned = candidates.filter((game) => {
    const candidateName = normalize(game.name);
    return !ownedNames.some((owned) => candidateName.startsWith(owned));
  });

  // RAWG lists a game's editions/DLC as separate catalog entries that all
  // inherit the base game's high rating (confirmed against the real API:
  // an unfiltered genre match returned six near-duplicate entries across
  // just two franchises). Deduping by franchiseKey keeps only the
  // highest-rated entry per franchise, since results are already sorted.
  const sortedByRating = [...unowned].sort((a, b) => b.rating - a.rating);
  const seenFranchises = new Set<string>();
  const deduped: Game[] = [];
  for (const game of sortedByRating) {
    const key = franchiseKey(game.name);
    if (seenFranchises.has(key)) continue;
    seenFranchises.add(key);
    deduped.push(game);
  }

  const sorted = deduped.slice(0, MAX_RECOMMENDATIONS);

  return sorted.map((game) => {
    const matchedGenre = topGenres.find((genre) =>
      game.genres?.some((g) => g.slug === genre.slug),
    );
    return {
      game,
      reason: matchedGenre
        ? `Because you played ${matchedGenre.exampleGameName}`
        : "Matches your most-played genres",
    };
  });
}
