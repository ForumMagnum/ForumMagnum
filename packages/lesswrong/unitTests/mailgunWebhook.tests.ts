import { createHmac } from "node:crypto";
import {
  MAILGUN_WEBHOOK_MAX_AGE_MS,
  MailgunWebhookPayloadSchema,
  parseEmailLinkTarget,
  parseMailgunClickedEvent,
  verifyMailgunWebhookSignature,
} from "@/server/mailgun/mailgunWebhook";

const SIGNING_KEY = "test-webhook-signing-key";
const NOW = new Date("2026-07-24T12:00:00.000Z").getTime();
const TIMESTAMP = String(Math.floor(NOW / 1_000));
const TOKEN = "0123456789abcdef0123456789abcdef01234567";

function signature(overrides: Partial<{ timestamp: string; token: string; signature: string }> = {}) {
  const timestamp = overrides.timestamp ?? TIMESTAMP;
  const token = overrides.token ?? TOKEN;
  return {
    timestamp,
    token,
    signature: overrides.signature ?? createHmac("sha256", SIGNING_KEY)
      .update(timestamp + token)
      .digest("hex"),
  };
}

function clickedPayload() {
  return {
    signature: signature(),
    "event-data": {
      event: "clicked",
      id: "CPgfbmQMTCgYLLghsnPtCg",
      timestamp: NOW / 1_000,
      url: "https://www.lesswrong.com/posts/RPgHythvMKh6eG9pS/a-post?emailSrc=rec.2.title",
      "user-variables": {
        emailType: "aiDigest",
        campaignId: "issue-1",
        recipientId: "reader-1",
      },
      "client-info": {
        bot: "",
        "client-name": "Chrome",
        "device-type": "desktop",
      },
    },
  };
}

describe("Mailgun webhook signature verification", () => {
  it("accepts a correctly signed, fresh delivery", () => {
    expect(verifyMailgunWebhookSignature({
      signature: signature(),
      signingKey: SIGNING_KEY,
      now: NOW,
    })).toEqual({ ok: true });
  });

  it("rejects a signature made with the wrong key", () => {
    expect(verifyMailgunWebhookSignature({
      signature: signature(),
      signingKey: "some-other-key",
      now: NOW,
    })).toEqual({ ok: false, reason: "badSignature" });
  });

  it("rejects a tampered token even though the signature is well-formed", () => {
    expect(verifyMailgunWebhookSignature({
      signature: { ...signature(), token: TOKEN.replace("0", "1") },
      signingKey: SIGNING_KEY,
      now: NOW,
    })).toEqual({ ok: false, reason: "badSignature" });
  });

  it("rejects replays outside the freshness window", () => {
    const staleNow = NOW + MAILGUN_WEBHOOK_MAX_AGE_MS + 1_000;
    expect(verifyMailgunWebhookSignature({
      signature: signature(),
      signingKey: SIGNING_KEY,
      now: staleNow,
    })).toEqual({ ok: false, reason: "staleTimestamp" });
  });

  it("rejects an unparseable timestamp before doing any HMAC work", () => {
    expect(verifyMailgunWebhookSignature({
      signature: signature({ timestamp: "not-a-timestamp" }),
      signingKey: SIGNING_KEY,
      now: NOW,
    })).toEqual({ ok: false, reason: "malformedTimestamp" });
  });
});

describe("Mailgun clicked-event parsing", () => {
  it("parses the attribution variables, slot, and bot flag", () => {
    const payload = MailgunWebhookPayloadSchema.parse(clickedPayload());
    expect(parseMailgunClickedEvent(payload["event-data"])).toEqual({
      mailgunEventId: "CPgfbmQMTCgYLLghsnPtCg",
      emailType: "aiDigest",
      campaignId: "issue-1",
      userId: "reader-1",
      url: "https://www.lesswrong.com/posts/RPgHythvMKh6eG9pS/a-post?emailSrc=rec.2.title",
      documentType: "post",
      documentId: "RPgHythvMKh6eG9pS",
      emailSrc: "rec.2.title",
      isBot: false,
      occurredAt: new Date(NOW),
      clientInfo: {
        bot: "",
        "client-name": "Chrome",
        "device-type": "desktop",
      },
    });
  });

  it.each([
    ["a non-empty bot string", "GoogleImageProxy", true],
    ["an empty bot string", "", false],
    ["a boolean bot flag", true, true],
  ])("reads %s", (_label, bot, expected) => {
    const payload = clickedPayload();
    const parsed = MailgunWebhookPayloadSchema.parse({
      ...payload,
      "event-data": { ...payload["event-data"], "client-info": { bot } },
    });
    expect(parseMailgunClickedEvent(parsed["event-data"]).isBot).toBe(expected);
  });

  it("reports an unknown bot status when Mailgun omits client info", () => {
    const payload = clickedPayload();
    const parsed = MailgunWebhookPayloadSchema.parse({
      ...payload,
      "event-data": { ...payload["event-data"], "client-info": {} },
    });
    expect(parseMailgunClickedEvent(parsed["event-data"]).isBot).toBeNull();
  });

  it("leaves attribution null when the send did not carry tracking variables", () => {
    const untracked = clickedPayload();
    const event = parseMailgunClickedEvent(
      MailgunWebhookPayloadSchema.parse({
        ...untracked,
        "event-data": { ...untracked["event-data"], "user-variables": {} },
      })["event-data"],
    );
    expect(event.emailType).toBeNull();
    expect(event.campaignId).toBeNull();
    expect(event.userId).toBeNull();
  });

  it("rejects a payload missing the event id we deduplicate on", () => {
    const payload = clickedPayload();
    const eventData: Record<string, unknown> = { ...payload["event-data"] };
    delete eventData["id"];
    expect(MailgunWebhookPayloadSchema.safeParse({
      ...payload,
      "event-data": eventData,
    }).success).toBe(false);
  });
});

describe("clicked URL target parsing", () => {
  it.each([
    [
      "https://www.lesswrong.com/posts/abc123/a-slug?emailSrc=rec.0.image",
      { documentType: "post", documentId: "abc123", emailSrc: "rec.0.image" },
    ],
    [
      "https://www.lesswrong.com/posts/abc123/a-slug?commentId=def456&emailSrc=disc.1.threadComment",
      { documentType: "comment", documentId: "def456", emailSrc: "disc.1.threadComment" },
    ],
    [
      "https://www.lesswrong.com/s/seq1/p/abc123",
      { documentType: "post", documentId: "abc123", emailSrc: null },
    ],
    [
      "https://www.lesswrong.com/events/abc123/a-slug",
      { documentType: "post", documentId: "abc123", emailSrc: null },
    ],
    [
      "https://www.lesswrong.com/g/group1/p/abc123/",
      { documentType: "post", documentId: "abc123", emailSrc: null },
    ],
    [
      "https://www.lesswrong.com/w/some-tag?commentId=def456",
      { documentType: "comment", documentId: "def456", emailSrc: null },
    ],
  ])("parses %s", (url, expected) => {
    expect(parseEmailLinkTarget(url)).toEqual(expected);
  });

  it("keeps the slot for chrome links that point at no document", () => {
    expect(parseEmailLinkTarget(
      "https://www.lesswrong.com/account?tab=settings-notifications&emailSrc=unsubscribe",
    )).toEqual({
      documentType: null,
      documentId: null,
      emailSrc: "unsubscribe",
    });
  });

  it("ignores an id too long to be a document _id", () => {
    expect(parseEmailLinkTarget(
      `https://www.lesswrong.com/posts/${"a".repeat(40)}/a-slug`,
    )).toEqual({ documentType: null, documentId: null, emailSrc: null });
  });

  it("degrades to nulls for a missing or unparseable URL", () => {
    const empty = { documentType: null, documentId: null, emailSrc: null };
    expect(parseEmailLinkTarget(null)).toEqual(empty);
    expect(parseEmailLinkTarget("not a url")).toEqual(empty);
  });
});
