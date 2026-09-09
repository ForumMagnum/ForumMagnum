import { getForumTypeForRequest } from "@/server/utils/requestUtil";
import type { NextRequest } from 'next/server';
import { postAiEditorUsageToSlack } from './postAiEditorUsageToSlack';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await postAiEditorUsageToSlack(getForumTypeForRequest(request));

  return new Response('OK', { status: 200 });
}
