import { NextRequest } from "next/server";
import { renderPostMarkdownByIdOrSlug } from "../../post/postMarkdownUtils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return await renderPostMarkdownByIdOrSlug(req, id, {
    htmlPathOverride: `/events/${id}`,
    markdownPathOverride: `/api/events/${id}`,
  });
}
