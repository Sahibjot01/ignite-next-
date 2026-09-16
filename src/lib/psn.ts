import crypto from "node:crypto";
import { getUserPlayedGames, getUserTrophyProfileSummary } from "psn-api";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  return Buffer.from(process.env.PSN_TOKEN_ENCRYPTION_KEY!, "hex");
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  const ciphertextChunk = cipher.update(plaintext, "utf-8", "hex");
  const ciphertextFinalChunk = cipher.final("hex");
  const ciphertext = ciphertextChunk + ciphertextFinalChunk;
  const authTag = cipher.getAuthTag().toString("hex");

  return iv.toString("hex") + ":" + ciphertext + ":" + authTag;
}

export function decrypt(packed: string): string {
  const [ivHex, ciphertextHex, authTagHex] = packed.split(":");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const plaintextChunk = decipher.update(ciphertextHex, "hex", "utf-8");
  const plaintextFinalChunk = decipher.final("utf-8");

  return plaintextChunk + plaintextFinalChunk;
}

export async function getPsnPlayedGames(accessToken: string) {
  // PSN's API always sorts this list by recency, never by playtime, and
  // only returns `limit` games — 10 was silently hiding real most-played
  // games that just hadn't been touched recently (confirmed against a
  // real account: Ghost of Tsushima and Spider-Man 2, the #2 and #3 most
  // played games, were invisible at limit 10 despite 62 games existing).
  // 100 comfortably covers a normal library in one call, confirmed
  // against the real API — no pagination needed for accounts this size.
  const result = await getUserPlayedGames({ accessToken: accessToken }, "me", {
    categories: "ps4_game,ps5_native_game",
    limit: 100,
    offset: 0,
  });
  return result.titles;
}

// Account-wide trophy level + platinum/gold/silver/bronze counts — one
// call, unlike getUserTrophiesForSpecificTitle() which is per-game (N
// calls for N games), which is why trophy data was deferred out of P3.
export async function getPsnTrophySummary(
  accessToken: string,
  accountId: string,
) {
  return getUserTrophyProfileSummary({ accessToken }, accountId);
}

export function formatPlayDuration(duration: string): string {
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);

  const hours = Number(match?.[1] ?? 0);
  const minutes = Number(match?.[2] ?? 0);
  return `${hours}h ${minutes}m`;
}

// Same ISO-8601 duration PSN returns everywhere, as raw minutes instead
// of a display string — for sorting/comparing playtime, not showing it.
export function parseDurationToMinutes(duration: string): number {
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  const hours = Number(match?.[1] ?? 0);
  const minutes = Number(match?.[2] ?? 0);
  return hours * 60 + minutes;
}
