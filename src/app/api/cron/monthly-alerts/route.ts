import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseClient";
import { getErrorMessage } from "@/lib/utils";
import { getCurrentEssentialGames } from "@/lib/ps-plus";

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
    // get the current essesntial games
    const games = await getCurrentEssentialGames();
    const currentIds = games.map((g) => g.productId).sort();

    // fetch last alerted games
    const { data: state } = await supabase
      .from("ps_plus_alert_state")
      .select("last_alerted_product_ids")
      .eq("id", 1)
      .maybeSingle();

    const lastIds = (state?.last_alerted_product_ids ?? []).slice().sort();

    if (JSON.stringify(lastIds) === JSON.stringify(currentIds)) {
      return NextResponse.json({
        message: "No new Essential lineup, nothing to do.",
      });
    }
    // fetch users who opted to alert the games
    const { data: optedInUsers } = await supabase
      .from("monthly_alert_preferences")
      .select("user_id")
      .eq("in_app_enabled", true);

    // write one notification, per games
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

    // update the stored state so tommorow run sees "no change"

    await supabase.from("ps_plus_alert_state").upsert({
      id: 1,
      last_alerted_product_ids: currentIds,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      message: `Alerted ${optedInUsers?.length ?? 0} user(s) about ${games.length} new Essential game(s).`,
    });
  } catch (error) {
    console.error("Cron Job Error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) || "Cron job failed" },
      { status: 500 },
    );
  }
}
