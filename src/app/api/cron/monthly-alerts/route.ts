import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseClient";
import { getErrorMessage } from "@/lib/utils";
import {
  getCurrentEssentialGames,
  getExtraPremiumCatalog,
  getUbisoftClassicsCatalog,
  toCatalogEntries,
  matchCatalogToWishlist,
  type CatalogEntry,
} from "@/lib/ps-plus";

export const dynamic = "force-dynamic";

const MASS_CHANGE_RATIO = 0.25;

export async function GET(req: NextRequest) {
  // 🔹 1. Security Check: Verify CRON_SECRET headers
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();

    // 🔹 P5 Tier 1: Essential monthly games — alert everyone opted in,
    // unconditionally, only when the lineup itself has changed since the
    // last run.
    const games = await getCurrentEssentialGames();
    const currentIds = games.map((g) => g.productId).sort();

    const { data: state } = await supabase
      .from("ps_plus_alert_state")
      .select("last_alerted_product_ids")
      .eq("id", 1)
      .maybeSingle();

    const lastIds = (state?.last_alerted_product_ids ?? []).slice().sort();
    const essentialLineupChanged =
      JSON.stringify(lastIds) !== JSON.stringify(currentIds);
    let essentialAlertedUserCount = 0;

    // Deliberately does NOT early-return when unchanged — Tier 2 below has
    // to run every day regardless of whether this month's Essential lineup
    // happens to have changed today, since they're independent catalogs on
    // independent schedules. An earlier version of this route did
    // early-return here, which silently skipped Tier 2 on every day
    // Essential didn't change — caught by a live test run, not review.
    if (essentialLineupChanged) {
      const { data: optedInUsers } = await supabase
        .from("monthly_alert_preferences")
        .select("user_id")
        .eq("in_app_enabled", true);

      essentialAlertedUserCount = optedInUsers?.length ?? 0;

      for (const user of optedInUsers ?? []) {
        for (const game of games) {
          await supabase.from("notifications").insert({
            user_id: user.user_id,
            game_id: null,
            message: `${game.name} is free this month with PS Plus Essential!`,
            external_url: game.conceptUrl,
          });
        }
      }

      await supabase.from("ps_plus_alert_state").upsert({
        id: 1,
        last_alerted_product_ids: currentIds,
        updated_at: new Date().toISOString(),
      });
    }

    // 🔹 P5 Tier 2: Extra/Premium catalog, matched per-user against wishlist
    //
    // Unlike Essential (same 3 games blasted to everyone opted in), the
    // Extra/Premium catalog has ~470 titles — alerting on all of them would
    // be noise, per ROADMAP.md's explicit decision. So this only fires when
    // a catalog addition/removal actually matches something on that
    // specific user's wishlist. Reuses the same diff-against-last-run
    // pattern as the Essential block above, just keyed by the whole
    // catalog's product IDs instead of 3.
    //
    // Note: this is same-day detection, not advance warning — a removal is
    // only known once the game is already gone from the catalog. No
    // "leaving in N days" field has been found on this endpoint yet (see
    // PSN-API-DISCOVERY.md), so alerts are worded as "left", not "leaving
    // soon". Revisit if a future DevTools pass turns one up.
    const [extraGames, ubisoftGames] = await Promise.all([
      getExtraPremiumCatalog(),
      getUbisoftClassicsCatalog(),
    ]);
    // An empty list here is a broken fetch, not a real "everything left" —
    // throw before it can be diffed into ~70 fake removals.
    if (extraGames.length === 0 || ubisoftGames.length === 0) {
      throw new Error("A PS Plus catalog list came back empty");
    }
    // The two lists overlap slightly (confirmed against the real API: 2
    // shared productIds) — dedupe so a game isn't logged twice.
    const combined = new Map(
      [...extraGames, ...ubisoftGames].map((g) => [g.productId, g]),
    );
    const currentCatalog = toCatalogEntries([...combined.values()]);
    const currentCatalogIds = new Set(currentCatalog.map((g) => g.productId));

    const { data: catalogState } = await supabase
      .from("ps_plus_catalog_state")
      .select("last_seen_games")
      .eq("id", 1)
      .maybeSingle();

    const lastSeenGames = (catalogState?.last_seen_games ??
      []) as CatalogEntry[];
    const lastSeenIds = new Set(lastSeenGames.map((g) => g.productId));

    const catalogAdditions = currentCatalog.filter(
      (g) => !lastSeenIds.has(g.productId),
    );
    const catalogRemovals = lastSeenGames.filter(
      (g) => !currentCatalogIds.has(g.productId),
    );

    let catalogAlertCount = 0;

    // Mass-change guard. Caught for real on 2026-09-19: the live
    // plus-games-list went from 468 titles to 49 overnight (all 49 were in
    // the old list). Diffed blindly, that's ~420 fake "Left the catalog"
    // rows in the public feed plus wishlist alerts, and the reverse spam if
    // Sony flips back. A real day changes a handful of titles, not a
    // quarter of the catalog — past that, skip everything (no log, no
    // alerts, no state write) and say so, instead of trusting the fetch.
    const changedCount = catalogAdditions.length + catalogRemovals.length;
    const massChange =
      lastSeenGames.length > 0 &&
      changedCount > lastSeenGames.length * MASS_CHANGE_RATIO;
    if (massChange) {
      console.error(
        `Catalog diff skipped: ${changedCount} changes vs ${lastSeenGames.length} stored titles looks like a bad/partial fetch, not real churn.`,
      );
    }

    if (!massChange && (catalogAdditions.length > 0 || catalogRemovals.length > 0)) {
      const { data: catalogOptedInUsers } = await supabase
        .from("monthly_alert_preferences")
        .select("user_id")
        .eq("catalog_alerts_enabled", true);

      for (const user of catalogOptedInUsers ?? []) {
        const { data: wishlistRows } = await supabase
          .from("wishlists")
          .select("game_name")
          .eq("user_id", user.user_id);

        const wishlistNames = (wishlistRows ?? []).map((r) => r.game_name);
        if (wishlistNames.length === 0) continue;

        const addedMatches = matchCatalogToWishlist(
          catalogAdditions,
          wishlistNames,
        );
        const removedMatches = matchCatalogToWishlist(
          catalogRemovals,
          wishlistNames,
        );

        for (const match of addedMatches) {
          await supabase.from("notifications").insert({
            user_id: user.user_id,
            game_id: null,
            message: `${match.game.name} (on your wishlist) just joined the PS Plus Extra/Premium catalog!`,
            external_url: match.game.conceptUrl,
          });
          catalogAlertCount++;
        }

        for (const match of removedMatches) {
          await supabase.from("notifications").insert({
            user_id: user.user_id,
            game_id: null,
            message: `${match.game.name} (on your wishlist) just left the PS Plus Extra/Premium catalog.`,
            external_url: match.game.conceptUrl,
          });
          catalogAlertCount++;
        }
      }

      // Public, unfiltered history log — separate from the wishlist-matched
      // notifications above. ps_plus_catalog_state only ever holds the
      // latest snapshot (it has to, for tomorrow's diff), so without this
      // there'd be nowhere to show "what changed" visually once a run
      // passes. Every detected addition/removal gets logged here
      // regardless of whether it matched anyone's wishlist.
      const changeLogRows = [
        ...catalogAdditions.map((g) => ({
          product_id: g.productId,
          name: g.name,
          image_url: g.imageUrl,
          concept_url: g.conceptUrl,
          change_type: "added" as const,
        })),
        ...catalogRemovals.map((g) => ({
          product_id: g.productId,
          name: g.name,
          image_url: g.imageUrl,
          concept_url: g.conceptUrl,
          change_type: "removed" as const,
        })),
      ];
      if (changeLogRows.length > 0) {
        await supabase.from("catalog_change_log").insert(changeLogRows);
      }

      await supabase.from("ps_plus_catalog_state").upsert({
        id: 1,
        last_seen_games: currentCatalog,
        updated_at: new Date().toISOString(),
      });
    }

    const essentialMessage = essentialLineupChanged
      ? `Alerted ${essentialAlertedUserCount} user(s) about ${games.length} new Essential game(s).`
      : "No new Essential lineup.";

    const catalogMessage = massChange
      ? `Catalog diff SKIPPED: ${changedCount} changes vs ${lastSeenGames.length} stored titles looks like a bad fetch.`
      : `Catalog: ${catalogAdditions.length} addition(s), ${catalogRemovals.length} removal(s), ${catalogAlertCount} wishlist-matched alert(s) sent.`;

    return NextResponse.json({
      message: `${essentialMessage} ${catalogMessage}`,
    });
  } catch (error) {
    console.error("Cron Job Error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) || "Cron job failed" },
      { status: 500 },
    );
  }
}
