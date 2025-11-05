import { handleCkEditorWebhook } from "@/server/ckEditor/ckEditorWebhook";
import type { NextRequest } from "next/server";


export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body) {
    await handleCkEditorWebhook(body);
  }
  return new Response("ok");
}
