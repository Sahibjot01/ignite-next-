import { env } from "./env";

const ENDPOINT_URL = "https://web.np.playstation.com/api/graphql/v1/op";
const DEFAULT_LOCALE = "en-CA";
const PRICE_OPERATION_NAME = "productRetrieveForCtasWithPrice";
const PRICE_QUERY_HASH = env.PS_STORE_PRICE_QUERY_HASH;
const X_ALGOLIA_APPLICATION_ID = env.ALGOLIA_APPLICATION_ID;
const X_ALGOLIA_API_KEY = env.ALGOLIA_API_KEY;

// Sony's own concept id doubles as a direct storefront deep link — no
// search/resolve step needed when the concept id is already known (e.g.
// straight from psn-api's played-games response). Exported so callers
// outside this module (played-games cards) don't duplicate the URL shape.
export function buildConceptUrl(
  conceptId: string | number,
  locale: string = DEFAULT_LOCALE,
): string {
  return `https://store.playstation.com/${locale.toLowerCase()}/concept/${conceptId}`;
}
interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
}

export interface PsStorePrice {
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
  displayDiscountText: string;
  displayUpsellText: string | null;
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

export interface PsStoreProductPrice {
  purchasePrice: PsStorePrice | null;
  subscriptionPrice: PsStorePrice | null;
  conceptUrl: string | null;
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
    throw Object.assign(new Error(json.errors[0].message), {
      isGraphqlError: true,
    });
  }
  if (!res.ok) {
    throw Object.assign(
      new Error(`Failed to fetch from Psn: ${res.statusText}`),
      { status: res.status },
    );
  }

  return json.data as T;
}

function buildProductPrice(
  productRetrieve: PsStoreProduct,
  locale: string,
): PsStoreProductPrice | null {
  if (productRetrieve.webctas.length === 0) {
    return null;
  }

  // Prefer the PS Plus-included option if one exists, otherwise
  // fall back to the cheapest actual purchase option.
  //
  // isTiedToSubscription alone isn't enough to mean "included with your
  // subscription" — UPSELL_PS_PLUS_TRIAL (a short timed trial for Premium
  // subscribers) also sets it true, and is a completely different thing
  // from UPSELL_PS_PLUS_GAME_CATALOG (the game is actually in the
  // Extra/Premium catalog). Confirmed against real API responses: Black
  // Myth: Wukong only has a trial CTA and was being shown as fully
  // "Included with PS Plus", which it isn't.
  const subscriptionCta = productRetrieve.webctas.find(
    (cta) => cta.type === "UPSELL_PS_PLUS_GAME_CATALOG",
  );

  const purchaseCtas = productRetrieve.webctas.filter(
    (cta) => cta.type === "ADD_TO_CART",
  );

  const cheapestPurchaseCta =
    purchaseCtas.length > 0
      ? purchaseCtas.reduce((cheapest, cta) =>
          cta.price.discountedValue < cheapest.price.discountedValue
            ? cta
            : cheapest,
        )
      : null;

  // Free-to-play games (Fortnite, Warframe, Apex, Aniimo, ...) have no
  // ADD_TO_CART at all — Sony gives them a single DOWNLOAD cta priced "Free".
  // Without this they fell through to "Not available on the PlayStation
  // Store". Deliberately DOWNLOAD only and not tied to a subscription: a
  // paid game's PS Plus trial (UPSELL_PS_PLUS_TRIAL) is also flagged free
  // but isn't the game being free.
  const freeDownloadCta = productRetrieve.webctas.find(
    (cta) =>
      cta.type === "DOWNLOAD" &&
      cta.price.isFree &&
      !cta.price.isTiedToSubscription,
  );

  return {
    purchasePrice: cheapestPurchaseCta?.price ?? freeDownloadCta?.price ?? null,
    subscriptionPrice: subscriptionCta?.price ?? null,
    conceptUrl: buildConceptUrl(productRetrieve.concept.id, locale),
  };
}

async function fetchProductRetrieve(
  productId: string,
  locale: string,
): Promise<PsStoreProduct | null> {
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

  return productRetrieve;
}

export async function getProductPrice(
  productId: string,
  locale: string = DEFAULT_LOCALE,
): Promise<PsStoreProductPrice | null> {
  const productRetrieve = await fetchProductRetrieve(productId, locale);
  if (productRetrieve == null) {
    return null;
  }
  return buildProductPrice(productRetrieve, locale);
}

// Sony appends the edition name onto the base title for anything that isn't
// the plain Standard edition (e.g. "Resident Evil Requiem Deluxe Edition"
// vs. just "Resident Evil Requiem") — confirmed against real API responses.
// Not a guarantee for every title in the catalog, just the best signal
// available; a title with no unmarked candidate just doesn't get a
// "Standard" option, rather than guessing wrong.
const NON_STANDARD_EDITION_MARKERS = [
  "deluxe",
  "ultimate",
  "premium",
  "gold",
  "complete",
  "definitive",
  "anniversary",
  "game of the year",
  "goty",
  "bundle",
  "season pass",
  "director's cut",
  "directors cut",
];

// Demos/trials aren't purchasable editions — exclude them from the list
// entirely rather than surfacing them as a "buy this" option.
const NOT_A_REAL_EDITION_MARKERS = ["demo", "trial"];

function nameContainsAny(name: string, markers: string[]): boolean {
  const lower = name.toLowerCase();
  return markers.some((marker) => lower.includes(marker));
}

export interface PsStoreEdition {
  skuId: string;
  name: string;
  isStandard: boolean;
  price: PsStoreProductPrice;
}

// A concept can resolve to several SKUs (Standard, Deluxe, a demo, ...).
// This fetches all of them and returns every real purchasable edition,
// Standard first when one is identifiable — callers decide whether to show
// just the first one or let the user switch between them.
export async function resolveEditions(
  candidateSkuIds: string[],
  locale: string = DEFAULT_LOCALE,
): Promise<PsStoreEdition[]> {
  if (candidateSkuIds.length === 0) {
    return [];
  }

  const resolved = await Promise.all(
    candidateSkuIds.map(async (skuId) => {
      const productRetrieve = await fetchProductRetrieve(skuId, locale);
      return productRetrieve == null ? null : { skuId, productRetrieve };
    }),
  );

  // Two candidates can produce a redundant-looking duplicate for two
  // different reasons, both confirmed against real data:
  // 1. A trial-eligible SKU and the outright-purchase SKU can be the exact
  //    same underlying product (Black Myth: Wukong) — same product id.
  // 2. The PS4 and PS5 versions of the same game are genuinely different
  //    products to Sony (different product ids, e.g. a "CUSA..." PS4 id vs.
  //    a "PPSA..." PS5 id for God of War Ragnarök) but share the identical
  //    display name — different ids, same name.
  // Neither is a real "edition" choice worth showing twice, so dedupe by
  // name rather than product id — it covers both cases, since identical
  // products always share a name too.
  const seenNames = new Set<string>();

  const editions: PsStoreEdition[] = [];
  for (const r of resolved) {
    if (r == null) continue;
    if (seenNames.has(r.productRetrieve.name)) continue;
    if (nameContainsAny(r.productRetrieve.name, NOT_A_REAL_EDITION_MARKERS)) {
      continue;
    }
    const price = buildProductPrice(r.productRetrieve, locale);
    if (price == null) continue;

    seenNames.add(r.productRetrieve.name);
    editions.push({
      skuId: r.skuId,
      name: r.productRetrieve.name,
      isStandard: !nameContainsAny(
        r.productRetrieve.name,
        NON_STANDARD_EDITION_MARKERS,
      ),
      price,
    });
  }

  editions.sort((a, b) => Number(b.isStandard) - Number(a.isStandard));
  return editions;
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
    throw Object.assign(
      new Error(`Failed to fetch from algolia search: ${resp.statusText}`),
      { status: resp.status },
    );
  }
  const result = (await resp.json()) as SearchRetrieveResponse;
  return result.results[0].hits;
}

// Resolves a RAWG game name straight to every real, purchasable PS Store
// edition — the search-then-price chain callers actually want, rather than
// making every caller repeat the "take the first hit's first skuId" step by
// hand (which isn't reliably Standard — see resolveEditions).
export async function getPsStoreEditionsByName(
  gameName: string,
  locale: string = DEFAULT_LOCALE,
): Promise<PsStoreEdition[]> {
  try {
    const hits = await searchPsStoreProducts(gameName, locale);
    if (hits.length === 0 || hits[0].skuIds.length === 0) {
      return [];
    }
    return await resolveEditions(hits[0].skuIds, locale);
  } catch (error) {
    console.error(`Error resolving PS Store editions for ${gameName}:`, error);
    return [];
  }
}
