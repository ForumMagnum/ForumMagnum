import EmailEvents from "@/server/collections/emailEvents/collection";
import { serverCaptureEvent } from "@/server/analytics/serverAnalyticsWriter";
import type { MailgunClickedEvent } from "./mailgunWebhook";

/**
 * Stores a click in the main DB and mirrors the full detail to the analytics DB.
 *
 * Mailgun delivers webhooks at least once, so this upserts on `mailgunEventId` and
 * reports whether the row was new. Returns false for a redelivery, which also
 * suppresses a duplicate analytics event.
 */
export async function ingestMailgunClickedEvent(
  event: MailgunClickedEvent,
): Promise<boolean> {
  const insertedCount = await EmailEvents.rawUpdateOne(
    { mailgunEventId: event.mailgunEventId },
    {
      $set: {
        eventType: "clicked",
        emailType: event.emailType,
        campaignId: event.campaignId,
        userId: event.userId,
        url: event.url,
        documentType: event.documentType,
        documentId: event.documentId,
        isBot: event.isBot,
        occurredAt: event.occurredAt,
      },
    },
    { upsert: true, returnCount: "upsertedCount" },
  );
  const wasNew = insertedCount > 0;

  if (wasNew) {
    // The analytics mirror keeps what the main DB omits: which exact element was
    // clicked, and Mailgun's client detail.
    serverCaptureEvent("emailLinkClicked", {
      mailgunEventId: event.mailgunEventId,
      emailType: event.emailType,
      campaignId: event.campaignId,
      userId: event.userId,
      url: event.url,
      documentType: event.documentType,
      documentId: event.documentId,
      emailSrc: event.emailSrc,
      isBot: event.isBot,
      occurredAt: event.occurredAt.toISOString(),
      clientInfo: event.clientInfo,
    });
  }

  return wasNew;
}
