import { Posts } from "@/server/collections/posts/collection";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";


export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const url = searchParams.get('url');
  if (!url) {
    return new Response('Please provide a URL', { status: 400 });
  }

  const post = await Posts.findOne({ url }, { sort: { postedAt: -1, createdAt: -1 } });
  if (!post || !post.url) {
    return new Response(`Invalid URL: ${url}`, { status: 404 });
  }

  void Posts.rawUpdateOne({ _id: post._id }, { $inc: { clickCount: 1 } });

  redirect(post.url);
}
