import { hasEmbeddingsForRecommendations, updateMissingPostEmbeddings } from "@/server/embeddings";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (hasEmbeddingsForRecommendations()) {
    await updateMissingPostEmbeddings();
  }

  return new Response('OK', { status: 200 });
}
