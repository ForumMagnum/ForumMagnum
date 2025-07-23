import type { NextRequest } from 'next/server';
import { updateMissingPostEmbeddings } from '@/server/embeddings';
import { HAS_EMBEDDINGS_FOR_RECOMMENDATIONS } from '@/server/embeddings';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!HAS_EMBEDDINGS_FOR_RECOMMENDATIONS) {
    return new Response('OK', { status: 200 });
  }

  await updateMissingPostEmbeddings();
  
  return new Response('OK', { status: 200 });
}
