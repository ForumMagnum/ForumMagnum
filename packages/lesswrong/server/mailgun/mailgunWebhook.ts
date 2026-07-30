/**
 * Parsing and signature verification for Mailgun's event webhooks.
 *
 * Mailgun signs each delivery with the account's *HTTP webhook signing key*, which
 * is a different secret from the sending API key, hence the separate
 * `MAILGUN_WEBHOOK_SIGNING_KEY` env var.
 *
 * Kept free of database access so it can be unit tested directly; ingestion lives
 * in `emailEventIngestion.ts`.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { EMAIL_SRC_QUERY_PARAM } from "@/lib/emails/emailTracking";

/** Replay window. Mailgun retries within minutes, so this is generous. */
export const MAILGUN_WEBHOOK_MAX_AGE_MS = 15 * 60 * 1_000;

const MailgunSignatureSchema = z.object({
  timestamp: z.string(),
  token: z.string(),
  signature: z.string(),
});

const JsonSchema: z.ZodType<Json> = z.lazy(() => z.union([
  z.boolean(),
  z.number(),
  z.string(),
  z.null(),
  z.array(JsonSchema),
  z.record(z.string(), JsonSchema),
]));

const MailgunEventDataSchema = z.object({
  event: z.string(),
  id: z.string(),
  timestamp: z.number(),
  url: z.string().optional(),
  "user-variables": z.record(z.string(), JsonSchema).optional(),
  "client-info": z.record(z.string(), JsonSchema).optional(),
});

export const MailgunWebhookPayloadSchema = z.object({
  signature: MailgunSignatureSchema,
  "event-data": MailgunEventDataSchema,
});

export type MailgunSignature = z.infer<typeof MailgunSignatureSchema>;
export type MailgunEventData = z.infer<typeof MailgunEventDataSchema>;

export type MailgunSignatureRejection =
  | "malformedTimestamp"
  | "staleTimestamp"
  | "badSignature";

export type MailgunSignatureVerification =
  | { ok: true }
  | { ok: false; reason: MailgunSignatureRejection };

export function verifyMailgunWebhookSignature({
  signature,
  signingKey,
  now = Date.now(),
}: {
  signature: MailgunSignature;
  signingKey: string;
  now?: number;
}): MailgunSignatureVerification {
  const timestampSeconds = Number(signature.timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return { ok: false, reason: "malformedTimestamp" };
  }
  if (Math.abs(now - (timestampSeconds * 1_000)) > MAILGUN_WEBHOOK_MAX_AGE_MS) {
    return { ok: false, reason: "staleTimestamp" };
  }
  const expected = createHmac("sha256", signingKey)
    .update(signature.timestamp + signature.token)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature.signature);
  if (
    expectedBuffer.length !== providedBuffer.length
    || !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return { ok: false, reason: "badSignature" };
  }
  return { ok: true };
}

export type EmailLinkDocumentType = "post" | "comment";

export interface EmailLinkTarget {
  documentType: EmailLinkDocumentType | null;
  documentId: string | null;
  /** The `<section>.<index>.<role>` slot the link occupied, when present. */
  emailSrc: string | null;
}

const postPathPatterns = [
  /^\/posts\/([a-zA-Z0-9]+)/,
  /^\/events\/([a-zA-Z0-9]+)/,
  /^\/s\/[a-zA-Z0-9]+\/p\/([a-zA-Z0-9]+)/,
  /^\/g\/[a-zA-Z0-9]+\/p\/([a-zA-Z0-9]+)/,
];

function parsedUrlOrNull(url: string): URL | null {
  return URL.canParse(url) ? new URL(url) : null;
}

/** Anything longer than an `_id` would not fit the column, so treat it as unparsed. */
function documentIdOrNull(candidate: string | null | undefined): string | null {
  return candidate && candidate.length <= 27 ? candidate : null;
}

function postIdFromPath(pathname: string): string | null {
  return postPathPatterns.reduce<string | null>(
    (found, pattern) => found ?? documentIdOrNull(pattern.exec(pathname)?.[1]),
    null,
  );
}

/**
 * Recovers what a clicked link pointed at. The raw URL is stored alongside this, so
 * a failure to match here degrades to "we know they clicked something".
 */
export function parseEmailLinkTarget(url: string | null | undefined): EmailLinkTarget {
  const parsed = url ? parsedUrlOrNull(url) : null;
  if (!parsed) {
    return { documentType: null, documentId: null, emailSrc: null };
  }
  const emailSrc = parsed.searchParams.get(EMAIL_SRC_QUERY_PARAM);
  const commentId = documentIdOrNull(parsed.searchParams.get("commentId"));
  if (commentId) {
    return { documentType: "comment", documentId: commentId, emailSrc };
  }
  const postId = postIdFromPath(parsed.pathname);
  return postId
    ? { documentType: "post", documentId: postId, emailSrc }
    : { documentType: null, documentId: null, emailSrc };
}

export interface MailgunClickedEvent {
  mailgunEventId: string;
  emailType: string | null;
  campaignId: string | null;
  userId: string | null;
  url: string | null;
  documentType: EmailLinkDocumentType | null;
  documentId: string | null;
  emailSrc: string | null;
  isBot: boolean | null;
  occurredAt: Date;
  /** Mailgun's device/client detail. Mirrored to analytics only. */
  clientInfo: JsonRecord | null;
}

function stringVariable(
  variables: JsonRecord | undefined,
  key: string,
): string | null {
  const value = variables?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Mailgun reports `client-info.bot` as a boolean on some events and as a string
 * (empty when not a bot) on others.
 */
function parseBotFlag(clientInfo: JsonRecord | undefined): boolean | null {
  const bot = clientInfo?.["bot"];
  if (typeof bot === "boolean") {
    return bot;
  }
  if (typeof bot === "string") {
    return bot.length > 0;
  }
  return null;
}

export function parseMailgunClickedEvent(eventData: MailgunEventData): MailgunClickedEvent {
  const variables = eventData["user-variables"];
  const clientInfo = eventData["client-info"];
  const target = parseEmailLinkTarget(eventData.url);
  return {
    mailgunEventId: eventData.id,
    emailType: stringVariable(variables, "emailType"),
    campaignId: stringVariable(variables, "campaignId"),
    userId: stringVariable(variables, "recipientId"),
    url: eventData.url ?? null,
    documentType: target.documentType,
    documentId: target.documentId,
    emailSrc: target.emailSrc,
    isBot: parseBotFlag(clientInfo),
    occurredAt: new Date(eventData.timestamp * 1_000),
    clientInfo: clientInfo ?? null,
  };
}
