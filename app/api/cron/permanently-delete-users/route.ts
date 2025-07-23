import type { NextRequest } from 'next/server';
import { permanentlyDeleteUsers } from '@/server/users/permanentDeletion';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await permanentlyDeleteUsers();
  
  return new Response('OK', { status: 200 });
}
