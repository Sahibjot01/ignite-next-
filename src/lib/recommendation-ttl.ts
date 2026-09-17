// Shared by the server action (actions.ts) that enforces the cooldown and
// the client panel that displays it — kept dependency-free (no Supabase, no
// RAWG/Gemini imports) so it's safe to import from a "use client" file
// without pulling server-only secrets into the browser bundle.

// Recomputing hits Gemini + a batch of RAWG searches, so this isn't a
// display nicety — it's the actual rate limit protecting the Gemini free
// tier quota. ~5 real users refreshing at most once a day stays far inside
// any free-tier cap; refreshing on every page visit (the old behavior)
// blew through it in a single test session (see PR history).
export const RECOMMENDATION_TTL_HOURS = 24;

export function hoursUntilRefresh(computedAt: string): number {
  const elapsedMs = Date.now() - new Date(computedAt).getTime();
  const remainingMs =
    RECOMMENDATION_TTL_HOURS * 60 * 60 * 1000 - elapsedMs;
  return Math.max(0, Math.ceil(remainingMs / (60 * 60 * 1000)));
}

export function isStale(computedAt: string): boolean {
  return hoursUntilRefresh(computedAt) === 0;
}
