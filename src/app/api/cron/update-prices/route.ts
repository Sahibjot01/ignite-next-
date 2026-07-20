import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseClient";
import { getDealsByGameTitle } from "@/lib/cheapshark";
import { getErrorMessage } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 🔹 1. Security Check: Verify CRON_SECRET headers
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();

    // 🔹 2. Fetch all unique games from the wishlist to update
    const { data: wishlistedGames, error: wishlistError } = await supabase
      .from("wishlists")
      .select("game_id, game_name, game_image");

    if (wishlistError) throw wishlistError;
    if (!wishlistedGames || wishlistedGames.length === 0) {
      return NextResponse.json({ message: "No wishlisted games to update." });
    }

    // Deduplicate games by game_id
    const uniqueGames = Array.from(
      new Map(wishlistedGames.map((g) => [g.game_id, g])).values(),
    );

    console.log(
      `Running daily price updates for ${uniqueGames.length} unique games.`,
    );
    const results = [];

    // 🔹 3. Loop over unique games and fetch current deals
    for (const game of uniqueGames) {
      try {
        const dealsInfo = await getDealsByGameTitle(game.game_name);

        if (!dealsInfo || dealsInfo.deals.length === 0) {
          console.log(`No pricing found for ${game.game_name}`);
          continue;
        }

        const cheapestDeal = dealsInfo.deals[0];
        const currentPrice = cheapestDeal.price;

        // Record a new snapshot if the price is different from the last recorded one
        const { data: lastSnapshot } = await supabase
          .from("price_snapshots")
          .select("*")
          .eq("game_id", game.game_id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!lastSnapshot || Number(lastSnapshot.price) !== currentPrice) {
          await supabase.from("price_snapshots").insert({
            game_id: game.game_id,
            cheapshark_id: dealsInfo.gameID,
            store_name: cheapestDeal.storeName,
            price: currentPrice,
            normal_price: cheapestDeal.normalPrice,
            is_on_sale: cheapestDeal.isOnSale,
          });
          console.log(
            `Updated price for ${game.game_name} to $${currentPrice}`,
          );
        }

        // 🔹 4. Check active price alerts for this game
        const { data: activeAlerts, error: alertsError } = await supabase
          .from("price_alerts")
          .select("*")
          .eq("game_id", game.game_id)
          .eq("is_active", true);

        if (alertsError) throw alertsError;

        if (activeAlerts && activeAlerts.length > 0) {
          for (const alert of activeAlerts) {
            const target = Number(alert.target_price);

            // Check if current price is at or below target
            if (currentPrice <= target) {
              // Trigger Alert: Insert notification
              await supabase.from("notifications").insert({
                user_id: alert.user_id,
                game_id: game.game_id,
                message: `🔥 Price Drop Alert! ${game.game_name} has dropped to $${currentPrice.toFixed(2)} (Target: $${target.toFixed(2)}) on ${cheapestDeal.storeName}!`,
              });

              // Deactivate alert until re-armed
              await supabase
                .from("price_alerts")
                .update({
                  is_active: false,
                  triggered_at: new Date().toISOString(),
                })
                .eq("id", alert.id);

              console.log(
                `Triggered price alert for user ${alert.user_id} on ${game.game_name}`,
              );
            }
          }
        }

        results.push({
          gameId: game.game_id,
          name: game.game_name,
          status: "updated",
          price: currentPrice,
        });
      } catch (gameError) {
        console.error(`Error updating price for ${game.game_name}:`, gameError);
        results.push({
          gameId: game.game_id,
          name: game.game_name,
          status: "failed",
          error: String(gameError),
        });
      }
    }

    return NextResponse.json({
      message: "Daily price update completed successfully.",
      results,
    });
  } catch (error) {
    console.error("Cron Job Error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) || "Cron job failed" },
      { status: 500 },
    );
  }
}
