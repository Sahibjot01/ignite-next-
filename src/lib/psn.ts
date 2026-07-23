import crypto from "node:crypto";

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
