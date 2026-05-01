import crypto from "crypto";
import { handleCkEditorWebhook } from "@/server/ckEditor/ckEditorWebhook";
import { getCkEditorApiSecretKey } from "@/server/ckEditor/ckEditorServerConfig";
import type { NextRequest } from "next/server";

// https://ckeditor.com/docs/cs/latest/developer-resources/security/request-signature.html
function computeWebhookSignature(apiKey: string, method: string, path: string, timestamp: string, rawBody: string) {
  const hmac = crypto.createHmac("sha256", apiKey);
  hmac.update(`${method.toUpperCase()}${path}${timestamp}${rawBody}`);
  return hmac.digest("hex");
}

function signaturesMatch(expected: string, provided: string) {
  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(provided, "hex");
  if (expectedBuf.length === 0 || expectedBuf.length !== providedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

export async function POST(req: NextRequest) {
  const apiSecret = getCkEditorApiSecretKey();
  if (!apiSecret) {
    return new Response("ckeditor webhook not configured", { status: 500 });
  }

  const signature = req.headers.get("x-cs-signature");
  const timestamp = req.headers.get("x-cs-timestamp");
  if (!signature || !timestamp) {
    return new Response("missing signature headers", { status: 401 });
  }

  const rawBody = await req.text();
  const path = req.nextUrl.pathname + req.nextUrl.search;
  const expectedSignature = computeWebhookSignature(apiSecret, "POST", path, timestamp, rawBody);
  if (!signaturesMatch(expectedSignature, signature)) {
    return new Response("invalid signature", { status: 401 });
  }

  if (rawBody) {
    const body = JSON.parse(rawBody);
    if (body) {
      await handleCkEditorWebhook(body);
    }
  }
  return new Response("ok");
}
