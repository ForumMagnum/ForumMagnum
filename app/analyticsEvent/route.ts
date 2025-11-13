import { handleAnalyticsEventWriteRequest } from "@/server/analytics/serverAnalyticsWriter";
import { backgroundTask } from "@/server/utils/backgroundTask";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  let bodyText: string|null = null;
  let bodyJson: any = null;
  try {
    bodyText = await req.text();
    if (bodyText.length > 0) {
      bodyJson = JSON.parse(bodyText);
    }
  } catch(e) {
    //eslint-disable-next-line no-console
    console.error(e);
  }
  
  if (!bodyJson?.events || !bodyJson?.now) {
    return new Response('analyticsEvent endpoint should be JSON with fields "events" and "now"', { status: 400 });
  }
  
  backgroundTask(handleAnalyticsEventWriteRequest(bodyJson.events, bodyJson.now));
  return new Response("ok", { status: 200 });
}
