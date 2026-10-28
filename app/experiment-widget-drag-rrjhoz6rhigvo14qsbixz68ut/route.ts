// EXPERIMENT (experiment/iframe-layout-ronny-exp2): Experiment 2's Post tab. The demo post page, in its
// Experiment 2 mode (?widgetDrag=1): it shows the edits made in this browser's Editor tab (see
// WidgetDragPostBody), at LessWrong's normal text width. Recreates the post if the dev database was reset.
import { NextResponse, connection, type NextRequest } from "next/server";
import { ensureLayoutDemoPost } from "@/server/layoutDemo/aiFuturesLayoutDemo";

export async function GET(req: NextRequest) {
  await connection();
  const post = await ensureLayoutDemoPost();
  const url = new URL(`/posts/${post._id}/${post.slug}`, req.nextUrl.origin);
  req.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  url.searchParams.set("widgetDrag", "1");
  return NextResponse.redirect(url);
}
