import { getLibraryGames } from "@/lib/actions";

export async function GET() {
  const result = await getLibraryGames();
  if (!result.success) return Response.json(result);
  return Response.json(result.games.map((game) => game.name));
}
