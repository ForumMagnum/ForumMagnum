import "./integrationTestSetup";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { POST } from "../../../app/api/mailgun/webhook/route";
import EmailEvents from "../server/collections/emailEvents/collection";
import { ingestMailgunClickedEvent } from "../server/mailgun/emailEventIngestion";
import type { MailgunClickedEvent } from "../server/mailgun/mailgunWebhook";
import { randomId } from "../lib/random";

const SIGNING_KEY = "integration-test-webhook-signing-key";

function clickedEvent(overrides: Partial<MailgunClickedEvent> = {}): MailgunClickedEvent {
  return {
    mailgunEventId: randomId(),
    emailType: "aiDigest",
    campaignId: randomId(),
    userId: randomId(),
    url: "https://www.lesswrong.com/posts/abc123/a-slug?emailSrc=rec.2.title",
    documentType: "post",
    documentId: "abc123",
    emailSrc: "rec.2.title",
    isBot: false,
    occurredAt: new Date("2026-07-24T12:00:00.000Z"),
    clientInfo: { "device-type": "desktop" },
    ...overrides,
  };
}

function webhookRequest({
  mailgunEventId,
  campaignId,
  signingKey = SIGNING_KEY,
  event = "clicked",
}: {
  mailgunEventId: string;
  campaignId: string;
  signingKey?: string;
  event?: string;
}): NextRequest {
  const timestamp = String(Math.floor(Date.now() / 1_000));
  const token = randomId();
  return new NextRequest("https://www.lesswrong.com/api/mailgun/webhook", {
    method: "POST",
    body: JSON.stringify({
      signature: {
        timestamp,
        token,
        signature: createHmac("sha256", signingKey)
          .update(timestamp + token)
          .digest("hex"),
      },
      "event-data": {
        event,
        id: mailgunEventId,
        timestamp: Date.now() / 1_000,
        url: "https://www.lesswrong.com/posts/abc123/a-slug?emailSrc=rec.0.readMore",
        "user-variables": {
          emailType: "aiDigest",
          campaignId,
          recipientId: randomId(),
        },
        "client-info": { bot: "" },
      },
    }),
  });
}

describe("Mailgun webhook route", () => {
  beforeAll(() => {
    process.env["MAILGUN_WEBHOOK_SIGNING_KEY"] = SIGNING_KEY;
  });

  it("ingests one row however many times Mailgun redelivers the event", async () => {
    const mailgunEventId = randomId();
    const campaignId = randomId();
    const first = await POST(webhookRequest({ mailgunEventId, campaignId }));
    const second = await POST(webhookRequest({ mailgunEventId, campaignId }));

    expect([first.status, second.status]).toEqual([200, 200]);
    const stored = await EmailEvents.find({ campaignId }).fetch();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      eventType: "clicked",
      emailType: "aiDigest",
      documentType: "post",
      documentId: "abc123",
      isBot: false,
    });
  });

  it("rejects a payload signed with the wrong key without storing anything", async () => {
    const campaignId = randomId();
    const response = await POST(webhookRequest({
      mailgunEventId: randomId(),
      campaignId,
      signingKey: "not-our-signing-key",
    }));

    expect(response.status).toBe(403);
    expect(await EmailEvents.find({ campaignId }).fetch()).toHaveLength(0);
  });

  it("acknowledges event types we do not ingest", async () => {
    const campaignId = randomId();
    const response = await POST(webhookRequest({
      mailgunEventId: randomId(),
      campaignId,
      event: "delivered",
    }));

    expect(response.status).toBe(200);
    expect(await EmailEvents.find({ campaignId }).fetch()).toHaveLength(0);
  });
});

describe("Mailgun clicked event ingestion", () => {
  it("stores the attribution facts the selection history joins on", async () => {
    const event = clickedEvent();
    expect(await ingestMailgunClickedEvent(event)).toBe(true);

    const stored = await EmailEvents.findOne({ mailgunEventId: event.mailgunEventId });
    expect(stored).toMatchObject({
      eventType: "clicked",
      emailType: "aiDigest",
      campaignId: event.campaignId,
      userId: event.userId,
      url: event.url,
      documentType: "post",
      documentId: "abc123",
      isBot: false,
      occurredAt: event.occurredAt,
    });
  });

  it("is a no-op when Mailgun redelivers the same event", async () => {
    const event = clickedEvent();
    expect(await ingestMailgunClickedEvent(event)).toBe(true);
    expect(await ingestMailgunClickedEvent(event)).toBe(false);

    const stored = await EmailEvents.find({ mailgunEventId: event.mailgunEventId }).fetch();
    expect(stored).toHaveLength(1);
  });

  it("keeps separate events for separate clicks in one campaign", async () => {
    const campaignId = randomId();
    expect(await ingestMailgunClickedEvent(clickedEvent({ campaignId }))).toBe(true);
    expect(await ingestMailgunClickedEvent(clickedEvent({ campaignId }))).toBe(true);

    const stored = await EmailEvents.find({ campaignId }).fetch();
    expect(stored).toHaveLength(2);
  });
});
