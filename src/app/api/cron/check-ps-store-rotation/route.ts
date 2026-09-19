// Not wired into vercel.json — Vercel's Hobby tier only allows crons that
// run once a day, and both daily slots are already used by update-prices
// and monthly-alerts. This exists as a reference for what a dedicated,
// more-frequent rotation check would look like if this project ever
// moves to a paid plan; it's unused dead code until then.
//
// Difference from the check baked into update-prices: this probes one
// known-good product directly instead of piggybacking on the wishlist
// price loop, so it works even with an empty wishlist and, in theory,
// could run more often than once a day.
import { NextRequest, NextResponse } from "next/server";
import { getProductPrice } from "@/lib/ps-store";
import { sendAlertEmail } from "@/lib/email";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

// A known-good productId, hardcoded — just needs to exist, not be wishlisted
const PROBE_PRODUCT_ID = "UP0700-CUSA00744_00-AC7RMASTER00000";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await getProductPrice(PROBE_PRODUCT_ID);
    return NextResponse.json({ message: "PS Store keys OK." });
  } catch (error) {
    if (
      error instanceof Error &&
      (("status" in error && (error.status === 401 || error.status === 403)) ||
        "isGraphqlError" in error)
    ) {
      await sendAlertEmail({
        to: env.SUPERUSER_EMAIL,
        subject: "Pixelhound: PS Store keys may have rotated",
        heading: "The PS Store rotation probe failed",
        body: "A single known-good product lookup failed with an auth/GraphQL error — the persisted-query hash or Algolia keys likely need to be re-discovered.",
      });
    }
    return NextResponse.json({
      message: "Probe failed, alert sent if applicable.",
    });
  }
}
