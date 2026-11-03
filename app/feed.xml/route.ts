import { serveCommentRSS, servePostRSS } from "@/server/rss";
import { FILTER_MODE_CHOICES } from "@/lib/filterSettings";
import { NextRequest } from "next/server";
import { z } from "zod";

const filterModeSchema = z.union([
  z.enum([...FILTER_MODE_CHOICES, "TagDefault"]),
  z.number(),
  z.templateLiteral(["x", z.number()]),
]);

const filterSettingsSchema = z.object({
  personalBlog: filterModeSchema.optional(),
  tags: z.array(z.object({
    tagId: z.string(),
    tagName: z.string().optional(),
    filterMode: filterModeSchema,
  })),
});

function parseJsonOrUndefined(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

function parseFilterSettings(filterSettingsParam: string) {
  const result = filterSettingsSchema.safeParse(parseJsonOrUndefined(filterSettingsParam));
  return result.success ? result.data : null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const { filterSettings: filterSettingsParam, ...queryParams } = Object.fromEntries(searchParams.entries());

  const filterSettings = filterSettingsParam ? parseFilterSettings(filterSettingsParam) : undefined;
  if (filterSettings === null) {
    return new Response("Invalid filterSettings", { status: 400 });
  }
  const terms = {
    ...queryParams,
    view: queryParams.view ?? 'rss',
    ...(filterSettings && { filterSettings }),
  };

  let res: string;
  if (queryParams.type === 'comments') {
    res = await serveCommentRSS(terms, req);
  } else {
    res = await servePostRSS(terms, req);
  }

  return new Response(res, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Vercel-CDN-Cache-Control': 'max-age=600'
    },
  });
}
