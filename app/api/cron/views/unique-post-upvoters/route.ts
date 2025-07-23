import { uniquePostUpvotersView } from "@/server/postgresView";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await uniquePostUpvotersView.getCronJob()?.job();

  return new Response('OK', { status: 200 });
}
