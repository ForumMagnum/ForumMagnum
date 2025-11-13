import { queryRequestSchema, type SearchOptions, type SearchQuery } from "@/lib/search/NativeSearchClient";
import ElasticService from "@/server/search/elastic/ElasticService";
import uniq from "lodash/uniq";
import type { NextRequest } from "next/server";

const getSearchService = (() => {
  let searchService: ElasticService | null = null;
  return () => {
    if (!searchService) {
      searchService = new ElasticService();
    }
    return searchService;
  }
})();

const defaultSearchOptions: SearchOptions = {
  emptyStringSearchResults: "default"
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  let searchOptions: SearchOptions;
  let queries: SearchQuery[] = [];
  
  const parsedBody = queryRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return new Response("Expected an array of queries or an object with options", { status: 400 });
  }

  const parsedRequest = parsedBody.data;
  
  if (Array.isArray(parsedRequest)) {
    searchOptions = defaultSearchOptions;
    queries = body;
  } else if ('queries' in parsedRequest) {
    searchOptions = body.options ?? defaultSearchOptions;
    queries = body.queries;
  }

  try {
    const results = await Promise.all(queries.map(q => getSearchService().runQuery(q, searchOptions)));
    for (const result of results) {
      const resultIds = result.hits.map(r=>r._id);
      if (uniq(resultIds).length !== resultIds.length) {
        // eslint-disable-next-line no-console
        console.error(`Search result set contained duplicate entries`);
      }
    }
    return new Response(JSON.stringify(results), { status: 200 });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Search error:", e, JSON.stringify(e, null, 2));
    return new Response(e.message ?? "An error occurred", { status: 400 });
  }
}
