const CHEAPSHARK_BASE_URL = "https://www.cheapshark.com/api/1.0";

export interface CheapSharkDeal {
  dealID: string;
  storeID: string;
  storeName: string;
  price: number;
  normalPrice: number;
  savings: number;
  isOnSale: boolean;
}

export interface CheapSharkGameInfo {
  gameID: string;
  externalName: string;
  cheapestPrice: number;
  deals: CheapSharkDeal[];
}

// Static mapping of CheapShark store IDs to user-friendly store names
export const STORES_MAP: Record<string, string> = {
  "1": "Steam",
  "2": "GamersGate",
  "3": "GreenManGaming",
  "6": "Direct2Drive",
  "7": "GOG",
  "8": "Origin",
  "11": "Epic Games Store",
  "13": "Uplay",
  "15": "Fanatical",
  "21": "WinGameStore",
  "23": "GameBillet",
  "24": "Voidu",
  "25": "Humble Store",
  "27": "IndieGala",
  "30": "Gamesplanet",
  "31": "Blizzard Shop",
  "34": "Itch.io",
  "35": "Microsoft Store",
};

// Search for a game title on CheapShark and return the closest match gameID
export async function searchCheapSharkGame(title: string): Promise<string | null> {
  try {
    const url = `${CHEAPSHARK_BASE_URL}/games?title=${encodeURIComponent(title)}`;
    const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache matches for 1 hour
    if (!res.ok) return null;
    
    interface SearchResult {
      gameID: string;
      external: string;
    }
    const results = (await res.json()) as SearchResult[];
    if (!results || results.length === 0) return null;

    // Find exact case-insensitive match if possible, otherwise use first result
    const exactMatch = results.find(
      (r) => r.external.toLowerCase() === title.toLowerCase()
    );
    return exactMatch ? exactMatch.gameID : results[0].gameID;
  } catch (error) {
    console.error("Error searching CheapShark:", error);
    return null;
  }
}

// Fetch pricing deals for a specific CheapShark gameID
export async function getCheapSharkDeals(gameID: string): Promise<CheapSharkGameInfo | null> {
  try {
    const url = `${CHEAPSHARK_BASE_URL}/games?id=${gameID}`;
    const res = await fetch(url, { cache: "no-store" }); // Deals change, fetch live on detail page
    if (!res.ok) return null;

    interface RawDeal {
      dealID: string;
      storeID: string;
      price: string;
      retailPrice: string;
      savings: string;
    }
    interface RawGameResponse {
      info: {
        title: string;
      };
      deals: RawDeal[];
    }
    const data = (await res.json()) as RawGameResponse;

    const deals: CheapSharkDeal[] = data.deals.map((d) => {
      const price = parseFloat(d.price);
      const normalPrice = parseFloat(d.retailPrice);
      const savings = Math.round(parseFloat(d.savings));
      return {
        dealID: d.dealID,
        storeID: d.storeID,
        storeName: STORES_MAP[d.storeID] || "Other Store",
        price,
        normalPrice,
        savings,
        isOnSale: price < normalPrice,
      };
    });

    // Sort deals by price ascending (cheapest first)
    deals.sort((a, b) => a.price - b.price);

    return {
      gameID,
      externalName: data.info.title,
      cheapestPrice: deals.length > 0 ? deals[0].price : 0,
      deals,
    };
  } catch (error) {
    console.error(`Error getting CheapShark deals for gameID ${gameID}:`, error);
    return null;
  }
}

// Helper to fetch CheapShark deals directly by RAWG game title
export async function getDealsByGameTitle(title: string): Promise<CheapSharkGameInfo | null> {
  const gameID = await searchCheapSharkGame(title);
  if (!gameID) return null;
  return getCheapSharkDeals(gameID);
}

// Generate the store redirect URL for a deal
export function getDealRedirectUrl(dealID: string): string {
  return `https://www.cheapshark.com/redirect?dealID=${dealID}`;
}
