import { getSiteUrl } from "@/lib/vulcan-lib/utils";

const MAILGUN_API_KEY_ENV_VAR = "MAILGUN_VALIDATION_API_KEY";

// TODO: If/when we need multi-domain support, revisit this (and possibly reintroduce configuration).
const MAILGUN_DOMAIN = "lesserwrong.com";
const DEFAULT_FROM_ADDRESS = "no-reply@lesserwrong.com";

function buildMailgunAuthHeader(apiKey: string): string {
  const token = Buffer.from(`api:${apiKey}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

function getMailgunApiKeyOrThrow() {
  const apiKey = process.env[MAILGUN_API_KEY_ENV_VAR] ?? null;
  if (!apiKey) {
    throw new Error(`Missing Mailgun API key env var: ${MAILGUN_API_KEY_ENV_VAR}`);
  }
  return apiKey;
}

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
  const apiKey = getMailgunApiKeyOrThrow();
  const from = args.from ?? DEFAULT_FROM_ADDRESS;

  const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
  const body = new URLSearchParams();
  body.set("from", from);
  body.set("subject", args.subject);

  if (args.text) body.set("text", args.text);
  if (args.html) body.set("html", args.html);

  // Mailgun supports either repeated `to` params or comma-separated; repeated is safer.
  for (const email of args.to) {
    body.append("to", email);
  }

  body.set("recipient-variables", JSON.stringify(args.recipientVariables));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: buildMailgunAuthHeader(apiKey),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { rawText: text };
  }

  return { ok: res.ok, status: res.status, json };
}


