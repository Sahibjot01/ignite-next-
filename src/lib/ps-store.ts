const ENDPOINT_URL = "https://web.np.playstation.com/api/graphql/v1/op";
const PRICE_QUERY_HASH =
  "aa9fb87d783a1df3822327f4126c3d1a0660b5654a77cf405c2779c443a67d0d";
const DEFAULT_LOCALE = "en-CA";
const PRICE_OPERATION_NAME = "productRetrieveForCtasWithPrice";

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
  const { productRetrieve } = await fetchPsStore<ProductRetrieveResponse>(
    PRICE_OPERATION_NAME,
    { productId },
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
    cta.price.discountedValue < cheapest.price.discountedValue
      ? cta
      : cheapest,
  );

  return cheapestCta.price;
}
