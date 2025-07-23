import type { NextRequest } from 'next/server';
import { sendCurationEmails } from '@/server/curationEmails/cron';
import { testServerSetting } from '@/lib/instanceSettings';
import { useCurationEmailsCron } from '@/lib/betas';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (testServerSetting.get() || !useCurationEmailsCron) {
    return new Response('OK', { status: 200 });
  }

  await sendCurationEmails();
  
  return new Response('OK', { status: 200 });
}
