import { z } from "zod";

const envSchema = z.object({
  PS_STORE_PRICE_QUERY_HASH: z.string().min(1),
  ALGOLIA_APPLICATION_ID: z.string().min(1),
  ALGOLIA_API_KEY: z.string().min(1),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
