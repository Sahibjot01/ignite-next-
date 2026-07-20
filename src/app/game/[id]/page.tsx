import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import GameDetail from "@/components/game-detail";
import { getGameDetails, getGameScreenshots } from "@/lib/rawg";
import { getDealsByGameTitle } from "@/lib/cheapshark";
import { getWishlistStatus, getPriceAlert } from "@/lib/actions";
import { createSupabaseAdminClient } from "@/lib/supabaseClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GameDetailPage(props: PageProps) {
  const { id } = await props.params;

  if (isNaN(parseInt(id))) {
    notFound();
  }

  // Fetch game core details and screenshots in parallel
  let game;
  let screenshots = [];
  try {
    const [gameData, screenData] = await Promise.all([
      getGameDetails(id),
      getGameScreenshots(id),
    ]);
    game = gameData;
    screenshots = screenData;
  } catch (error) {
    console.error("Error loading game details:", error);
    notFound();
  }

  // Fetch auth-based states in parallel
  const [isWishlisted, priceAlert, dealsInfo] = await Promise.all([
    getWishlistStatus(game.id),
    getPriceAlert(game.id),
    getDealsByGameTitle(game.name),
  ]);

  // Handle price snapshots database logging
  const supabase = createSupabaseAdminClient();
  
  if (dealsInfo && dealsInfo.deals.length > 0) {
    const cheapestDeal = dealsInfo.deals[0];
    
    try {
      // Find the last snapshot for this game
      const { data: lastSnapshot } = await supabase
        .from("price_snapshots")
        .select("*")
        .eq("game_id", game.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const todayStr = new Date().toISOString().split("T")[0];
      const lastRecordedDateStr = lastSnapshot
        ? new Date(lastSnapshot.recorded_at).toISOString().split("T")[0]
        : null;

      // Deduplicate: Insert a new snapshot only if price changes, or it's a new day
      if (
        !lastSnapshot ||
        Number(lastSnapshot.price) !== cheapestDeal.price ||
        lastRecordedDateStr !== todayStr
      ) {
        await supabase.from("price_snapshots").insert({
          game_id: game.id,
          cheapshark_id: dealsInfo.gameID,
          store_name: cheapestDeal.storeName,
          price: cheapestDeal.price,
          normal_price: cheapestDeal.normalPrice,
          is_on_sale: cheapestDeal.isOnSale,
        });
      }
    } catch (dbError) {
      console.error("Failed to record price snapshot:", dbError);
    }
  }

  // Fetch all historical price snapshots for the chart
  const { data: snapshotsData } = await supabase
    .from("price_snapshots")
    .select("*")
    .eq("game_id", game.id)
    .order("recorded_at", { ascending: true });

  const snapshots = snapshotsData || [];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 md:px-12">
        <GameDetail
          game={game}
          screenshots={screenshots}
          initialWishlistStatus={isWishlisted}
          dealsInfo={dealsInfo}
          snapshots={snapshots}
          initialPriceAlert={priceAlert}
        />
      </main>
    </div>
  );
}
