const ENDPOINT_URL = "https://web.np.playstation.com/api/graphql/v1/op";
const DEFAULT_LOCALE = "en-CA";
const PRICE_OPERATION_NAME = "productRetrieveForCtasWithPrice";
const PRICE_QUERY_HASH = process.env.PS_STORE_PRICE_QUERY_HASH!;
const X_ALGOLIA_APPLICATION_ID = process.env.ALGOLIA_APPLICATION_ID!;
const X_ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY!;
interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
}

interface PsStorePrice {
  applicability: string;
  basePrice: string;
  basePriceValue: number;
  currencyCode: string;
  discountedPrice: string;
  discountedValue: number;
  campaignId: string | null;
  endTime: string | null;
  isFree: boolean;
  isTiedToSubscription: boolean;
  serviceBranding: string[];
  savingTag: string;
  history: {
    launchPrice: string | null;
    lowestRecentPrice: string | null;
  } | null;
}

interface PsStoreCta {
  type: string;
  price: PsStorePrice;
}

interface PsStoreProduct {
  id: string;
  name: string;
  concept: { id: string };
  skus: { id: string; name: string }[];
  webctas: PsStoreCta[];
}

interface ProductRetrieveResponse {
  productRetrieve: PsStoreProduct | null;
}

interface PsStoreSearchHit {
  conceptId: string;
  skuIds: string[];
}

interface SearchRetrieveResponse {
  results: { hits: PsStoreSearchHit[] }[];
}

async function fetchPsStore<T>(
  operationName: string,
  variables: Record<string, string>,
  hash: string,
  locale: string = DEFAULT_LOCALE,
): Promise<T> {
  const queryParams = new URLSearchParams({
    operationName: operationName,
    variables: JSON.stringify(variables),
    extensions: JSON.stringify({
      persistedQuery: {
        version: 1,
        sha256Hash: hash,
      },
    }),
  });
  const fullUrl = `${ENDPOINT_URL}?${queryParams.toString()}`;
  const reqHeader = new Headers();
  reqHeader.set("Content-Type", "application/json");
  reqHeader.set("X-Psn-Store-Locale-Override", locale);

  const res = await fetch(fullUrl, {
    headers: reqHeader,
    next: {
      revalidate: 60,
    },
  });

  const json = (await res.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch from Psn: ${res.statusText}`);
  }

  return json.data as T;
}

export async function getProductPrice(
  productId: string,
  locale: string = DEFAULT_LOCALE,
): Promise<PsStorePrice | null> {
  // Accept a raw skuId (e.g. from searchPsStoreProducts) as well as a bare
  // productId — a skuId is always `productId-U00X`, and the price query
  // only accepts the shorter productId form.
  const resolvedProductId = productId.replace(/-U\d+$/, "");

  const { productRetrieve } = await fetchPsStore<ProductRetrieveResponse>(
    PRICE_OPERATION_NAME,
    { productId: resolvedProductId },
    PRICE_QUERY_HASH,
    locale,
  );

  if (productRetrieve == null || productRetrieve.webctas.length === 0) {
    return null;
  }

  // Prefer the PS Plus-included option if one exists, otherwise
  // fall back to the cheapest actual purchase option.
  const psPlusCta = productRetrieve.webctas.find(
    (cta) => cta.price.isTiedToSubscription,
  );

  if (psPlusCta) {
    return psPlusCta.price;
  }

  const cheapestCta = productRetrieve.webctas.reduce((cheapest, cta) =>
    cta.price.discountedValue < cheapest.price.discountedValue ? cta : cheapest,
  );

  return cheapestCta.price;
}

export async function searchPsStoreProducts(
  query: string,
  locale: string = DEFAULT_LOCALE,
): Promise<PsStoreSearchHit[]> {
  const fullUrl = `https://${X_ALGOLIA_APPLICATION_ID.toLowerCase()}-dsn.algolia.net/1/indexes/*/queries`;
  const reqHeader = new Headers();
  reqHeader.set("Content-Type", "application/json");
  reqHeader.set("x-algolia-application-id", X_ALGOLIA_APPLICATION_ID);
  reqHeader.set("x-algolia-api-key", X_ALGOLIA_API_KEY);
  const resp = await fetch(fullUrl, {
    method: "POST",
    headers: reqHeader,
    body: JSON.stringify({
      requests: [
        {
          indexName: `crawler_${locale.toLowerCase()}`,
          query: query,
          params: "hitsPerPage=30&filters=pageType%3Agame",
        },
      ],
    }),
    next: {
      revalidate: 60,
    },
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch from algolia search: ${resp.statusText}`);
  }
  const result = (await resp.json()) as SearchRetrieveResponse;
  return result.results[0].hits;
}
