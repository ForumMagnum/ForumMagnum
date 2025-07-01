import { handleAnalyticsEventWriteRequest } from "@/server/analytics/serverAnalyticsWriter";
import { initDatabases, initSettings } from "@/server/serverStartup";
import type { NextRequest } from "next/server";

// TODO: figure out what to do about local development, where we might have multiple routes hit on the same instance... maybe make these implicit singletons?
await initDatabases({
  postgresUrl: process.env.PG_URL || '',
  postgresReadUrl: process.env.PG_URL || '',
});
await initSettings();

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  if (!body?.events || !body?.now) {
    return new Response('analyticsEvent endpoint should be JSON with fields "events" and "now"', { status: 400 });
  }
  
  void handleAnalyticsEventWriteRequest(body.events, body.now);
  return new Response("ok", { status: 200 });
}