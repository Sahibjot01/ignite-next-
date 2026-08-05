import { getProductPrice, searchPsStoreProducts } from "@/lib/ps-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  console.log(searchParams);

  const searchTerm = searchParams.get("q");
  console.log(searchTerm);

  if (searchTerm == null) {
    return;
  }
  const result = await searchPsStoreProducts(searchTerm);
  const gameDetail = await getProductPrice(result[0].skuIds[0]);
  console.log(gameDetail);

  return Response.json(gameDetail);
}
