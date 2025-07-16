import Posts from "@/server/collections/posts/collection";
import Comments from "@/server/collections/comments/collection";
import { commentGetRSSUrl } from '@/lib/collections/comments/helpers';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { redirect } from "next/navigation";
import { initDatabases, initSettings } from "@/server/serverStartup";
import type { NextRequest } from "next/server";

await initDatabases({
  postgresUrl: process.env.PG_URL || '',
  postgresReadUrl: process.env.PG_READ_URL || '',
});
await initSettings();

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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  const commentId = searchParams.get('commentId');
  
  if (!id) {
    return new Response('No ID provided', { status: 400 });
  }

  const [post, comment] = await Promise.all([
    findPostByLegacyId(id),
    findCommentByLegacyId(commentId),
  ]);

  if (post && comment) {
    redirect(commentGetRSSUrl(comment));
  } else if (post) {
    redirect(postGetPageUrl(post));
  } else {
    return new Response(`No post or comment found with: id=${id} commentId=${commentId}`, { status: 404 });
  }
}
