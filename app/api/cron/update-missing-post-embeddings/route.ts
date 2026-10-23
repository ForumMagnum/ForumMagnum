import { hasEmbeddingsForRecommendations, updateMissingPostEmbeddings } from "@/server/embeddings";
import type { NextRequest } from "next/server";
import { checkCronRequestAuthorization } from "@/server/utils/cronAuth";

export async function GET(request: NextRequest) {
  const authError = checkCronRequestAuthorization(request);
  if (authError) {
    return authError;
  }

  if (hasEmbeddingsForRecommendations()) {
    await updateMissingPostEmbeddings();
  }

  return new Response('OK', { status: 200 });
}
