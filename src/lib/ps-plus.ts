const ENDPOINT_URL = "https://www.playstation.com/bin/imagic/gameslist";
export interface RawGame {
  name: string;
  productId: string;
  conceptUrl: string;
  imageUrl: string;
  releaseDate: string;
  streamingSupported: boolean;
}

export interface EssentialGameResponse {
  catalogKey: string;
  count: number;
  games: RawGame[];
}

export async function getCurrentEssentialGames(
  locale = "en-ca",
): Promise<RawGame[]> {
  const queryParams = new URLSearchParams({
    locale: locale,
    categoryList: "plus-monthly-games-list",
  });
  const fullUrl = `${ENDPOINT_URL}?${queryParams.toString()}`;
  const reqHeader = new Headers();
  reqHeader.set("Content-Type", "application/json");
  reqHeader.set("Accept", "*/*");

  const res = await fetch(fullUrl, {
    headers: reqHeader,
    next: {
      revalidate: 60,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch from essential games: ${res.statusText}`);
  }
  const buckets = (await res.json()) as EssentialGameResponse[];
  return buckets.flatMap((bucket) => bucket.games);
}
