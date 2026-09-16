import { Resend } from "resend";
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
