import { NextRequest } from "next/server";
import { getPostBibtexResponse } from "@/server/citations/postBibtexResponse";

export async function GET(req: NextRequest, { params }: { params: Promise<{ idOrSlug: string }> }) {
  const { idOrSlug } = await params;
  return await getPostBibtexResponse(req, idOrSlug);
}
