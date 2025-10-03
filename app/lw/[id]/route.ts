import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import Posts from "@/server/collections/posts/collection";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

async function findPostByLegacyId(legacyId: string) {
  const parsedId = parseInt(legacyId, 36);
  return await Posts.findOne({"legacyId": parsedId.toString()});
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return new Response('No ID provided', { status: 400 });
  }

  const post = await findPostByLegacyId(id);

  if (post) {
    redirect(postGetPageUrl(post, true));
  } else {
    return new Response(`No post found with: id=${id}`, { status: 404 });
  }
}
