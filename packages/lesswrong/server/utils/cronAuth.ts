import crypto from "crypto";
import type { NextRequest } from "next/server";

function constantTimeStringEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Check that a request to a cron route came from the cron runner, which sends
 * `Authorization: Bearer ${CRON_SECRET}`. Returns a response to send back if
 * the request should be rejected, or null if the cron job should run.
 *
 * If CRON_SECRET isn't configured, cron routes are disabled entirely (rather
 * than accepting the literal header `Bearer undefined`).
 */
export function checkCronRequestAuthorization(request: NextRequest): Response | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return new Response('Cron routes are disabled because CRON_SECRET is not configured', { status: 503 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !constantTimeStringEquals(authHeader, `Bearer ${cronSecret}`)) {
    return new Response('Unauthorized', { status: 401 });
  }

  return null;
}
