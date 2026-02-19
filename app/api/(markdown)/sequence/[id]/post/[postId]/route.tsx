import { NextRequest } from "next/server";
import { renderPostMarkdownByIdOrSlug } from "../../../../post/postMarkdownUtils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, postId: string }> }
) {
  const { id, postId } = await params;
  return await renderPostMarkdownByIdOrSlug(req, postId, {
    sequenceId: id,
    htmlPathOverride: `/s/${id}/p/${postId}`,
    markdownPathOverride: `/api/sequence/${id}/post/${postId}`,
  });
}
