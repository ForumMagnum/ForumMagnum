// EXPERIMENT (branch experiment/iframe-layout-ronny): a stable link to the iframe layout demo post.
// Recreates the post if the dev database was reset, then redirects to it, keeping any query
// parameters (?textWidth=wider, ?layoutUi=off).
import { NextResponse, type NextRequest } from "next/server";
import { ensureLayoutDemoPost } from "@/server/layoutDemo/aiFuturesLayoutDemo";

export async function GET(req: NextRequest) {
  const post = await ensureLayoutDemoPost();
  const url = new URL(`/posts/${post._id}/${post.slug}`, req.nextUrl.origin);
  req.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  return NextResponse.redirect(url);
}
