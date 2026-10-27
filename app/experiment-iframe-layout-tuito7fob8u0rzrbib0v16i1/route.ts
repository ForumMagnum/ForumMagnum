// EXPERIMENT (branch experiment/iframe-layout-ronny): a stable, hard-to-guess link to the iframe layout
// demo post, for sharing with the team.
// Recreates the post if the dev database was reset, then redirects to it, keeping any query
// parameters (?textWidth=wider, ?layoutUi=off).
import { NextResponse, connection, type NextRequest } from "next/server";
import { ensureLayoutDemoPost } from "@/server/layoutDemo/aiFuturesLayoutDemo";

export async function GET(req: NextRequest) {
  // Look the post up on every visit, never at build time.
  await connection();
  const post = await ensureLayoutDemoPost();
  const url = new URL(`/posts/${post._id}/${post.slug}`, req.nextUrl.origin);
  req.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  return NextResponse.redirect(url);
}
