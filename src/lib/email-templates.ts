// Email HTML has to be built differently from a normal web page: most clients
// (Outlook especially) strip <style> tags, custom fonts, and modern CSS like
// clip-path or CSS variables — so everything here is inline styles on a
// table-based layout, the one thing every client renders consistently.

interface AlertEmailOptions {
  heading: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}

const PAGE_BG = "#f0f1f4";
const CARD_BG = "#ffffff";
const HAIRLINE = "rgba(10, 13, 19, 0.08)";
const INK = "#12161f";
const INK_DIM = "#5b6472";
const CORAL = "#ff7676";
const CORAL_DARK = "#e2554f";

const FONT_STACK =
  "'Segoe UI', Helvetica, Arial, sans-serif";

export function renderAlertEmailHtml({
  heading,
  body,
  ctaText,
  ctaUrl,
}: AlertEmailOptions): string {
  const cta =
    ctaText && ctaUrl
      ? `
        <tr>
          <td style="padding: 28px 40px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-radius: 6px; background-color: ${CORAL};">
                  <a
                    href="${ctaUrl}"
                    style="display: inline-block; padding: 12px 24px; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;"
                  >
                    ${ctaText}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
      : "";

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
  </head>
  <body style="margin: 0; padding: 0; background-color: ${PAGE_BG};" bgcolor="${PAGE_BG}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${PAGE_BG};" bgcolor="${PAGE_BG}">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; width: 100%; background-color: ${CARD_BG}; border: 1px solid ${HAIRLINE}; border-radius: 8px;" bgcolor="${CARD_BG}">
            <tr>
              <td style="padding: 28px 40px 4px; border-top: 3px solid ${CORAL}; border-radius: 8px 8px 0 0;">
                <span style="font-family: ${FONT_STACK}; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${CORAL_DARK};">
                  Pixelhound
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 40px 0;">
                <h1 style="margin: 0; font-family: ${FONT_STACK}; font-size: 20px; font-weight: 700; color: ${INK};">
                  ${heading}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 40px 0;">
                <p style="margin: 0; font-family: ${FONT_STACK}; font-size: 14px; line-height: 1.6; color: ${INK_DIM};">
                  ${body}
                </p>
              </td>
            </tr>
            ${cta}
            <tr>
              <td style="padding: 32px 40px 28px;">
                <hr style="border: none; border-top: 1px solid ${HAIRLINE}; margin: 0 0 16px;" />
                <p style="margin: 0; font-family: ${FONT_STACK}; font-size: 11px; color: ${INK_DIM};">
                  Sent by Pixelhound — your PlayStation tracker.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
