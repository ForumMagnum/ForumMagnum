import { NextRequest } from "next/server";
import { renderPostMarkdownByIdOrSlug } from "../postMarkdownUtils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ idOrSlug: string }> }) {
  const { idOrSlug } = await params;
  return await renderPostMarkdownByIdOrSlug(req, idOrSlug);
}
