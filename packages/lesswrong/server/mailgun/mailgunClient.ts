import Mailgun from "mailgun.js";
import type { Interfaces } from "mailgun.js/definitions";

const MAILGUN_API_KEY_ENV_VAR = "MAILGUN_VALIDATION_API_KEY";

// TODO: If/when we need multi-domain support, revisit this (and possibly reintroduce configuration).
export const MAILGUN_DOMAIN = "lesserwrong.com";
export const DEFAULT_FROM_ADDRESS = "no-reply@lesserwrong.com";

let mailgunClientInstance: Interfaces.IMailgunClient | null = null;

/**
 * Returns a Mailgun client if the API key is configured, otherwise null.
 */
export function getMailgunClient(): Interfaces.IMailgunClient | null {
  const apiKey = process.env[MAILGUN_API_KEY_ENV_VAR] ?? null;
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
