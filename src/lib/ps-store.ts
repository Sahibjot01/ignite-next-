const ENDPOINT_URL = "https://web.np.playstation.com/api/graphql/v1/op";
const PRICE_QUERY_HASH =
  "aa9fb87d783a1df3822327f4126c3d1a0660b5654a77cf405c2779c443a67d0d";
const DEFAULT_LOCALE = "en-CA";

interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
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
