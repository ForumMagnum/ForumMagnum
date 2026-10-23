import type { NextRequest } from 'next/server';
import { checkCronRequestAuthorization } from '@/server/utils/cronAuth';
import { postAiEditorUsageToSlack } from './postAiEditorUsageToSlack';

export async function GET(request: NextRequest) {
  const authError = checkCronRequestAuthorization(request);
  if (authError) {
    return authError;
  }

  await postAiEditorUsageToSlack();

  return new Response('OK', { status: 200 });
}
