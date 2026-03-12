import { NextRequest } from "next/server";
import { renderPostMarkdownByIdOrSlug } from "../../../post/postMarkdownUtils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string, slug: string }> }) {
  const { id, slug } = await params;
  return await renderPostMarkdownByIdOrSlug(req, id, {
    htmlPathOverride: `/events/${id}/${slug}`,
    markdownPathOverride: `/api/events/${id}/${slug}`,
  });
}
