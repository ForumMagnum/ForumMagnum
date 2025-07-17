import { handleCkEditorWebhook } from "@/server/ckEditor/ckEditorWebhook";
import { initDatabases, initSettings } from "@/server/serverStartup";
import type { NextRequest } from "next/server";

await initDatabases({
  postgresUrl: process.env.PG_URL || '',
  postgresReadUrl: process.env.PG_READ_URL || '',
});
await initSettings();

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body) {
    await handleCkEditorWebhook(body);
  }
  return new Response("ok");
}
