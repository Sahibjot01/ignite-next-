import crypto from "node:crypto";
import { getUserPlayedGames } from "psn-api";

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
  const result = await getUserPlayedGames({ accessToken: accessToken }, "me", {
    categories: "ps4_game,ps5_native_game",
    limit: 10,
    offset: 0,
  });
  console.log(result.titles[0].playDuration);
  return result.titles;
}

export function formatPlayDuration(duration: string): string {
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);

  const hours = Number(match?.[1] ?? 0);
  const minutes = Number(match?.[2] ?? 0);
  return `${hours}h ${minutes}m`;
}
