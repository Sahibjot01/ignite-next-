import { NextRequest, NextResponse } from "next/server";
import {
  getPopularGames,
  getUpcomingGames,
  getNewGames,
  searchGames,
  getGameDetails,
  getGameScreenshots,
} from "@/lib/rawg";
import { getErrorMessage } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await props.params;
    
    if (!path || path.length === 0) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const firstSegment = path[0];

    // 🔹 1. Popular Games
    if (firstSegment === "popular") {
      const data = await getPopularGames();
      return NextResponse.json(data);
    }

    // 🔹 2. Upcoming Games
    if (firstSegment === "upcoming") {
      const data = await getUpcomingGames();
      return NextResponse.json(data);
    }

    // 🔹 3. New Games
    if (firstSegment === "new") {
      const data = await getNewGames();
      return NextResponse.json(data);
    }

    // 🔹 4. Search Games
    if (firstSegment === "search") {
      const searchParams = req.nextUrl.searchParams;
      const query = searchParams.get("query");
      if (!query) {
        return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
      }
      const data = await searchGames(query);
      return NextResponse.json(data);
    }

    // 🔹 5. Game Screenshots: /api/games/[id]/screenshots
    if (path.length === 2 && path[1] === "screenshots") {
      const gameId = parseInt(firstSegment);
      if (isNaN(gameId)) {
        return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
      }
      const data = await getGameScreenshots(gameId);
      return NextResponse.json(data);
    }

    // 🔹 6. Game Details: /api/games/[id]
    if (path.length === 1) {
      const gameId = parseInt(firstSegment);
      if (isNaN(gameId)) {
        return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
      }
      const data = await getGameDetails(gameId);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
  } catch (error) {
    console.error("RAWG Proxy Route Error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) || "Failed to process request" },
      { status: 500 }
    );
  }
}
