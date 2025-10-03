import { serveCommentRSS, servePostRSS } from "@/server/rss";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const queryParams = Object.fromEntries(searchParams.entries());

  queryParams.view ??= 'rss';
  if (queryParams.filterSettings) {
    queryParams.filterSettings = JSON.parse(queryParams.filterSettings);
  }

  let res: string;
  if (queryParams.type === 'comments') {
    res = await serveCommentRSS(queryParams, req);
  } else {
    res = await servePostRSS(queryParams);
  }

  return new Response(res, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Vercel-CDN-Cache-Control': 'max-age=600'
    },
  });
}
