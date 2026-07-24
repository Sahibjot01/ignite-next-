import GameCard from "./game-card";
import { Game } from "@/lib/rawg";

interface GameGridProps {
  games: Game[];
  wishlistGameIds: Set<number>;
}

export default function GameGrid({ games, wishlistGameIds }: GameGridProps) {
  if (!games || games.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-hairline-strong text-ink-faint">
        No games found.
      </div>
    );
  }

  return (
    <div className="grid grid-columns-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          isWishlisted={wishlistGameIds.has(game.id)}
        />
      ))}
    </div>
  );
}
