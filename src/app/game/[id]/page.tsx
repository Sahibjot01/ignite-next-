import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import GameDetail from "@/components/game-detail";
import { getGameDetails, getGameScreenshots } from "@/lib/rawg";
import { getPsStorePriceByName } from "@/lib/ps-store";
import { getWishlistStatus, getPriceAlert } from "@/lib/actions";

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

  // Fetch auth-based states and the live PS Store price in parallel
  const [isWishlisted, priceAlert, psPrice] = await Promise.all([
    getWishlistStatus(game.id),
    getPriceAlert(game.id),
    getPsStorePriceByName(game.name),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-void text-ink">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 md:px-12">
        <GameDetail
          game={game}
          screenshots={screenshots}
          initialWishlistStatus={isWishlisted}
          psPrice={psPrice}
          initialPriceAlert={priceAlert}
        />
      </main>
    </div>
  );
}
