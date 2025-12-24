import Mailgun from "mailgun.js";
import type { Interfaces } from "mailgun.js/definitions";

// TODO: If/when we need multi-domain support, revisit this (and possibly reintroduce configuration).
export const MAILGUN_DOMAIN = "lesswrong.com";

let mailgunClientInstance: Interfaces.IMailgunClient | null = null;

/**
 * Returns a Mailgun client if the API key is configured, otherwise null.
 */
export function getMailgunClient(): Interfaces.IMailgunClient | null {
  const apiKey = process.env['MAILGUN_LESSWRONG_API_KEY'] ?? null;
  if (!apiKey) return null;

  if (!mailgunClientInstance) {
    const mailgun = new Mailgun(FormData);
    mailgunClientInstance = mailgun.client({
      username: "api",
      key: apiKey,
    });
  }
  return mailgunClientInstance;
}
