const RAWG_BASE_URL = "https://api.rawg.io/api";
const RAWG_API_KEY = process.env.RAWG_API_KEY;

export interface Platform {
  id: number;
  name: string;
  slug: string;
}

export interface GamePlatform {
  platform: Platform;
}

export interface GameScreenshot {
  id: number;
  image: string;
}

export interface Game {
  id: number;
  name: string;
  released: string;
  background_image: string;
  rating: number;
  ratings_count: number;
  metacritic?: number;
  platforms?: GamePlatform[];
  description_raw?: string;
  short_screenshots?: GameScreenshot[];
}

export interface RawgResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Date Helpers (Ported from old Express proxy)
export const getCurrentDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const getLastYear = () => {
  const date = new Date();
  return `${date.getFullYear() - 1}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const getNextYear = () => {
  const date = new Date();
  return `${date.getFullYear() + 1}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

// Generic Fetcher with ISR caching
async function fetchRawg<T>(endpoint: string, params: Record<string, string> = {}, revalidate = 3600): Promise<T> {
  if (!RAWG_API_KEY) {
    throw new Error("Missing RAWG_API_KEY in environment variables");
  }

  const queryParams = new URLSearchParams({
    key: RAWG_API_KEY,
    ...params,
  });

  const url = `${RAWG_BASE_URL}/${endpoint}?${queryParams.toString()}`;
  
  const res = await fetch(url, {
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch from RAWG: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// 🔹 Exported RAWG API Methods
export async function getPopularGames(): Promise<Game[]> {
  const data = await fetchRawg<RawgResponse<Game>>("games", {
    dates: `${getLastYear()},${getCurrentDate()}`,
    ordering: "-rating",
    page_size: "10",
  });
  return data.results;
}

export async function getUpcomingGames(): Promise<Game[]> {
  const data = await fetchRawg<RawgResponse<Game>>("games", {
    dates: `${getCurrentDate()},${getNextYear()}`,
    ordering: "-added",
    page_size: "10",
  });
  return data.results;
}

export async function getNewGames(): Promise<Game[]> {
  const data = await fetchRawg<RawgResponse<Game>>("games", {
    dates: `${getLastYear()},${getCurrentDate()}`,
    ordering: "-released",
    page_size: "10",
  });
  return data.results;
}

export async function searchGames(query: string): Promise<Game[]> {
  const data = await fetchRawg<RawgResponse<Game>>("games", {
    search: query,
    page_size: "9",
  }, 60); // Cache search for 1 minute
  return data.results;
}

export async function getGameDetails(id: string | number): Promise<Game> {
  return fetchRawg<Game>(`games/${id}`);
}

export async function getGameScreenshots(id: string | number): Promise<GameScreenshot[]> {
  interface ScreenshotsResponse {
    results: GameScreenshot[];
  }
  const data = await fetchRawg<ScreenshotsResponse>(`games/${id}/screenshots`);
  return data.results;
}

// Image Resizer (Ported from old utility)
export const imageResizeURL = (imageLink: string | null | undefined, size: number): string => {
  if (!imageLink) return "";
  
  const newURL = imageLink.match(/media\/screenshots/)
    ? imageLink.replace(
        "/media/screenshots",
        `/media/resize/${size}/-/screenshots/`
      )
    : imageLink.replace("/media/games", `/media/resize/${size}/-/games/`);
  return newURL;
};
