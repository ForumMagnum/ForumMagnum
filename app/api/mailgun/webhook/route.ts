import { ingestMailgunClickedEvent } from "@/server/mailgun/emailEventIngestion";
import {
  MailgunWebhookPayloadSchema,
  parseMailgunClickedEvent,
  verifyMailgunWebhookSignature,
} from "@/server/mailgun/mailgunWebhook";
import { NextRequest } from "next/server";

/**
 * Receives Mailgun's event webhooks. Register the endpoint from the Mailgun
 * dashboard's Webhooks tab, or with
 * `PUT /v4/domains/<domain>/webhooks` with `clicked=<this url>`.
 *
 * Only `clicked` is ingested today; other event types are acknowledged and dropped.
 * Anything other than a 200 makes Mailgun retry, and sustained failures get the
 * webhook disabled, so non-events return 200 rather than an error.
 */
export async function POST(req: NextRequest) {
  const signingKey = process.env["MAILGUN_WEBHOOK_SIGNING_KEY"];
  if (!signingKey) {
    // eslint-disable-next-line no-console
    console.error("Received a Mailgun webhook but MAILGUN_WEBHOOK_SIGNING_KEY is not configured");
    return new Response("Webhook signing key not configured", { status: 500 });
  }

  const payload = MailgunWebhookPayloadSchema.safeParse(await req.json());
  if (!payload.success) {
    return new Response("Invalid Mailgun webhook payload", { status: 400 });
  }

  const verification = verifyMailgunWebhookSignature({
    signature: payload.data.signature,
    signingKey,
  });
  if (!verification.ok) {
    return new Response(verification.reason, { status: 403 });
  }

  const eventData = payload.data["event-data"];
  if (eventData.event !== "clicked") {
    return new Response("", { status: 200 });
  }

  await ingestMailgunClickedEvent(parseMailgunClickedEvent(eventData));
  return new Response("", { status: 200 });
}
