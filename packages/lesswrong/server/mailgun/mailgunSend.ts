import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import type { MailgunMessageData } from "mailgun.js/definitions";
import { getMailgunClient, MAILGUN_DOMAIN } from "./mailgunClient";
import { defaultEmailSetting } from "../databaseSettings";

export function renderUnsubscribeLinkTemplateForBulk(htmlOrText: string): string {
  return htmlOrText.replaceAll("{{unsubscribeUrl}}", "%recipient.unsubscribeUrl%");
}

export function getUnsubscribeAllUrlFromToken(token: string): string {
  const prefix = getSiteUrl().slice(0, -1);
  return `${prefix}/emailToken/${token}`;
}

export async function sendMailgunBatchEmail(args: {
  subject: string;
  html?: string | null;
  text?: string | null;
  to: string[]; // recipient emails
  recipientVariables: Record<string, { unsubscribeUrl: string }>;
  from?: string;
}): Promise<{ ok: boolean; status: number; json: unknown }> {
  const client = getMailgunClient();
  if (!client) {
    throw new Error("MAILGUN_VALIDATION_API_KEY is not set");
  }
  const from = args.from ?? defaultEmailSetting.get();

  try {
    // At least one of text or html must be provided
    if (!args.text && !args.html) {
      throw new Error("Either text or html must be provided");
    }

    // Build the message data with at least text or html
    // The MailgunMessageData type requires at least one content field, which we guarantee above
    const messageData = {
      from,
      to: args.to,
      subject: args.subject,
      ...(args.text ? { text: args.text } : {}),
      ...(args.html ? { html: args.html } : {}),
      "recipient-variables": JSON.stringify(args.recipientVariables),
    } as MailgunMessageData;

    const result = await client.messages.create(MAILGUN_DOMAIN, messageData);

    return { ok: true, status: result.status, json: result };
  } catch (e) {
    // Extract status and response from the error if available
    let status = 500;
    let json: unknown = null;

    if (e && typeof e === "object") {
      if ("status" in e && typeof e.status === "number") {
        status = e.status;
      }
      if ("message" in e) {
        json = { error: e.message };
      }
    }

    return { ok: false, status, json };
  }
}
