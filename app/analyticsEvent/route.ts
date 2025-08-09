import { handleAnalyticsEventWriteRequest } from "@/server/analytics/serverAnalyticsWriter";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  let body: any = null;
  try {
    body = await req.json();
  } catch(e) {
    console.error(e);
  }
  
  if (!body?.events || !body?.now) {
    return new Response('analyticsEvent endpoint should be JSON with fields "events" and "now"', { status: 400 });
  }
  
  void handleAnalyticsEventWriteRequest(body.events, body.now);
  return new Response("ok", { status: 200 });
}