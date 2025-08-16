import Posts from "@/server/collections/posts/collection";
import Comments from "@/server/collections/comments/collection";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { commentGetPageUrlFromDB } from "@/lib/collections/comments/helpers";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

async function findPostByLegacyAFId(legacyId: number) {
  return await Posts.findOne({"agentFoundationsId": legacyId.toString()})
}

async function findCommentByLegacyAFId(legacyId: number) {
  return await Comments.findOne({"agentFoundationsId": legacyId.toString()})
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return new Response('No ID provided', { status: 400 });
  }

  const context = createAnonymousContext();

  const post = await findPostByLegacyAFId(parseInt(id));
  if (post) {
    redirect(postGetPageUrl(post));
  } else {
    const comment = await findCommentByLegacyAFId(parseInt(id));
    if (comment) {
      redirect(await commentGetPageUrlFromDB(comment, context, false));
    } else {
      return new Response(`No af legacy item found with: id=${id}`, { status: 404 });
    }
  }
}
