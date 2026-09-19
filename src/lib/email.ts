import { Resend } from "resend";
import { clerkClient } from "@clerk/nextjs/server";
import { env } from "@/lib/env";
import { renderAlertEmailHtml } from "@/lib/email-templates";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendAlertEmail({
  to,
  subject,
  heading,
  body,
  ctaText,
  ctaUrl,
}: {
  to: string;
  subject: string;
  heading: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}) {
  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: to,
    subject: subject,
    html: renderAlertEmailHtml({ heading: heading, body, ctaText, ctaUrl }),
  });
  if (error) {
    console.error("Failed to send alert email:", error);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface AlertEmailLine {
  text: string;
  url?: string;
}

// Only ever link to PlayStation's own store — game names/links come from
// Sony's catalog data, so they're escaped and the href is restricted rather
// than trusted, since the template drops `body` in as raw HTML.
function isStoreUrl(url: string): boolean {
  return url.startsWith("https://store.playstation.com/");
}

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const primary = user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    );
    return primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  } catch (error) {
    // A deleted Clerk account or a Clerk outage shouldn't abort the cron
    // run for every other user.
    console.error(`Could not look up email for ${userId}:`, error);
    return null;
  }
}

// One digest email per user per run (not one per game) — a month's five
// Essential games or a day's wishlist matches read as a single message.
export async function sendUserAlertEmail(
  userId: string,
  {
    subject,
    heading,
    lines,
    ctaText,
    ctaUrl,
  }: {
    subject: string;
    heading: string;
    lines: AlertEmailLine[];
    ctaText?: string;
    ctaUrl?: string;
  },
) {
  const to = await getUserEmail(userId);
  if (!to) return;

  const body = lines
    .map((line) => {
      const text = escapeHtml(line.text);
      return line.url && isStoreUrl(line.url)
        ? `<a href="${escapeHtml(line.url)}" style="color: #e2554f; text-decoration: none;">${text}</a>`
        : text;
    })
    .join("<br />");

  await sendAlertEmail({
    to,
    subject,
    heading: escapeHtml(heading),
    body,
    ctaText,
    ctaUrl,
  });
}
