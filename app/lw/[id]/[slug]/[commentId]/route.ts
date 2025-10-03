import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import Comments from "@/server/collections/comments/collection";
import Posts from "@/server/collections/posts/collection";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

async function findPostByLegacyId(legacyId: string) {
  const parsedId = parseInt(legacyId, 36);
  return await Posts.findOne({"legacyId": parsedId.toString()});
}

async function findCommentByLegacyId(legacyId: string | null) {
  if (legacyId === null) {
    return null;
  }
  
  const parsedId = parseInt(legacyId, 36);
  return await Comments.findOne({"legacyId": parsedId.toString()});
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string, slug: string, commentId: string }> }) {
  const { id, commentId } = await params;
  
  if (!id) {
    return new Response('No ID provided', { status: 400 });
  }

  const [post, comment] = await Promise.all([
    findPostByLegacyId(id),
    findCommentByLegacyId(commentId),
  ]);

  if (post && comment) {
    const url = commentGetPageUrlFromIds({ postId: post._id, postSlug: post.slug, commentId: comment._id, permalink: true, isAbsolute: true });
    return redirect(url);
  } else if (post) {
    return redirect(postGetPageUrl(post, true));
  } else {
    return new Response(`No post or comment found with: id=${id} commentId=${commentId}`, { status: 404 });
  }
}
