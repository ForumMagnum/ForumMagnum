// EXPERIMENT (experiment/iframe-layout-ronny-exp3): Experiment 3's Post tab for its second demo post, "How
// content blocks behave next to widgets": the post page in Experiment 3's mode, showing the edits made in
// this browser's Editor tab. Creates the post if it's missing and updates it when its HTML changes.
import { NextResponse, connection, type NextRequest } from "next/server";
import { ensureBlocksDemoPost } from "@/server/layoutDemo/blocksLayoutDemo";
import { WIDGET_BLOCKS_QUERY_PARAM } from "@/components/posts/PostsPage/widgetBlocksDemo";

export async function GET(req: NextRequest) {
  await connection();
  const post = await ensureBlocksDemoPost();
  const url = new URL(`/posts/${post._id}/${post.slug}`, req.nextUrl.origin);
  req.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  url.searchParams.set(WIDGET_BLOCKS_QUERY_PARAM, "blocks");
  return NextResponse.redirect(url);
}
