// EXPERIMENT (experiment/iframe-layout-ronny-exp3): Experiment 3's Post tab for the AI Futures post: the
// demo post page in Experiment 3's mode (?widgetBlocks=ai-futures), showing the edits made in this
// browser's Editor tab. Recreates the post if the dev database was reset.
import { NextResponse, connection, type NextRequest } from "next/server";
import { ensureLayoutDemoPost } from "@/server/layoutDemo/aiFuturesLayoutDemo";
import { WIDGET_BLOCKS_QUERY_PARAM } from "@/components/posts/PostsPage/widgetBlocksDemo";

export async function GET(req: NextRequest) {
  await connection();
  const post = await ensureLayoutDemoPost();
  const url = new URL(`/posts/${post._id}/${post.slug}`, req.nextUrl.origin);
  req.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  url.searchParams.set(WIDGET_BLOCKS_QUERY_PARAM, "ai-futures");
  return NextResponse.redirect(url);
}
