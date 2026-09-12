import { env } from "@/lib/env";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/webhooks";
import { createSupabaseAdminClient } from "@/lib/supabaseClient";

const USER_ID_TABLES = [
  "wishlists",
  "price_alerts",
  "notifications",
  "monthly_alert_preferences",
  "psn_accounts",
] as const;

const webhookSecret = env.CLERK_WEBHOOK_SIGNING_SECRET;

export async function POST(req: Request) {
  const svix_id = req.headers.get("svix-id") ?? "";
  const svix_timestamp = req.headers.get("svix-timestamp") ?? "";
  const svix_signature = req.headers.get("svix-signature") ?? "";

  const body = await req.text();

  const sivx = new Webhook(webhookSecret);

  try {
    sivx.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Clerk webhook signature verification failed:", err);
    return new Response("Bad Request", { status: 400 });
  }

  const evt = JSON.parse(body) as WebhookEvent;
  if (evt.type === "user.deleted") {
    const userId = evt.data.id;
    if (userId) {
      const supabase = createSupabaseAdminClient();
      for (const table of USER_ID_TABLES) {
        await supabase.from(table).delete().eq("user_id", userId);
      }
    }
  }

  return new Response("OK", { status: 200 });
}
