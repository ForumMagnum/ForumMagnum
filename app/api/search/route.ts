import { queryRequestSchema, type SearchOptions, type SearchQuery } from "@/lib/search/NativeSearchClient";
import ElasticService from "@/server/search/elastic/ElasticService";
import { getSiteUrlFromReq } from "@/server/utils/getSiteUrl";
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

const SEARCH_INDEXES = ["posts", "comments", "tags", "users", "sequences"] as const;
type SearchIndexName = typeof SEARCH_INDEXES[number];

const DEFAULT_RESULTS_PER_TYPE = 5;
const MAX_RESULTS_PER_TYPE = 20;

function parseLimit(value: string | null): number {
  if (!value) return DEFAULT_RESULTS_PER_TYPE;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_RESULTS_PER_TYPE;
  return Math.min(parsed, MAX_RESULTS_PER_TYPE);
}

function parsePage(value: string | null): number {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function parseTypeFilter(value: string | null): SearchIndexName | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return (SEARCH_INDEXES as readonly string[]).includes(normalized)
    ? (normalized as SearchIndexName)
    : null;
}

function trimAndCollapseWhitespace(value: string): string {
  return value.replaceAll(/\s+/g, " ").trim();
}

function stripHtml(value: string): string {
  return trimAndCollapseWhitespace(value.replaceAll(/<[^>]+>/g, " "));
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function escapeMarkdown(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]");
}

function formatListItem(title: string, markdownUrl: string, details?: string[]): string {
  const safeTitle = escapeMarkdown(title);
  const detailText = details && details.length > 0 ? ` - ${details.join(" | ")}` : "";
  return `- [${safeTitle}](${markdownUrl})${detailText}`;
}

function getResultTitle(hit: SearchDocument, indexName: SearchIndexName): string {
  if (indexName === "posts") return hit.title ?? "Untitled post";
  if (indexName === "comments") return hit.postTitle ? `Comment on ${hit.postTitle}` : "Comment";
  if (indexName === "tags") return hit.name ?? "Untitled tag";
  if (indexName === "users") return hit.displayName ?? hit.username ?? hit.slug ?? "User";
  if (indexName === "sequences") return hit.title ?? "Untitled sequence";
  return hit.title ?? hit.name ?? hit._id;
}

function getResultMarkdownUrl(hit: SearchDocument, indexName: SearchIndexName): string {
  if (indexName === "posts") return `/api/post/${hit._id}`;
  if (indexName === "comments") return `/api/post/${hit.postSlug ?? hit.postId}/comments/${hit._id}`;
  if (indexName === "tags") return `/api/tag/${hit.slug}`;
  if (indexName === "users") return `/api/user/${hit.slug}`;
  if (indexName === "sequences") return `/api/sequence/${hit._id}`;
  return "#";
}

function getResultDetails(hit: SearchDocument, indexName: SearchIndexName): string[] {
  if (indexName === "posts") {
    const details = [
      hit.authorDisplayName ? `author: ${hit.authorDisplayName}` : null,
      Number.isFinite(hit.baseScore) ? `karma: ${hit.baseScore}` : null,
      hit.postedAt ? `date: ${new Date(hit.postedAt).toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "Z")}` : null,
    ];
    return details.filter((value): value is string => !!value);
  }
  if (indexName === "comments") {
    const snippet = hit._snippetResult?.body?.value ? stripHtml(hit._snippetResult.body.value) : "";
    const truncatedSnippet = snippet ? `snippet: ${truncate(snippet, 220)}` : null;
    return [
      hit.authorDisplayName ? `author: ${hit.authorDisplayName}` : null,
      truncatedSnippet,
    ].filter((value): value is string => !!value);
  }
  if (indexName === "tags") {
    const description = hit._snippetResult?.description?.value ? stripHtml(hit._snippetResult.description.value) : "";
    return description ? [`snippet: ${truncate(description, 220)}`] : [];
  }
  if (indexName === "users") {
    return [
      Number.isFinite(hit.karma) ? `karma: ${hit.karma}` : null,
      hit.bio ? `bio: ${truncate(stripHtml(hit.bio), 180)}` : null,
    ].filter((value): value is string => !!value);
  }
  if (indexName === "sequences") {
    const description = hit._snippetResult?.plaintextDescription?.value
      ? stripHtml(hit._snippetResult.plaintextDescription.value)
      : (hit.plaintextDescription ? stripHtml(hit.plaintextDescription) : "");
    return description ? [`snippet: ${truncate(description, 220)}`] : [];
  }
  return [];
}

function getSectionTitle(indexName: SearchIndexName): string {
  if (indexName === "posts") return "Posts";
  if (indexName === "comments") return "Comments";
  if (indexName === "tags") return "Wikitags";
  if (indexName === "users") return "Users";
  return "Sequences";
}

async function runMarkdownSearchQuery(
  req: NextRequest,
  searchQuery: string,
): Promise<Response> {
  const typeFilter = parseTypeFilter(req.nextUrl.searchParams.get("type"));
  const indexes = typeFilter ? [typeFilter] : [...SEARCH_INDEXES];
  const limitPerType = parseLimit(req.nextUrl.searchParams.get("limit"));
  const page = parsePage(req.nextUrl.searchParams.get("page"));

  const resultsByIndex = await Promise.all(indexes.map(async (indexName) => {
    const result = await getSearchService().runQuery({
      indexName,
      params: {
        query: searchQuery,
        hitsPerPage: limitPerType,
        page,
      },
    }, defaultSearchOptions);
    return { indexName, result };
  }));

  const totalHits = resultsByIndex.reduce((sum, { result }) => sum + result.nbHits, 0);
  const headerLines = [
    `# Search Results: ${searchQuery}`,
    "",
    `- Query: \`${searchQuery}\``,
    `- Results across all types: ${totalHits}`,
    `- Per-type page size: ${limitPerType}`,
    `- Page: ${page + 1}`,
    `- HTML search page: [/search?search=${encodeURIComponent(searchQuery)}](/search?search=${encodeURIComponent(searchQuery)})`,
    `- Markdown docs/search endpoint: [/api/search](/api/search)`,
    "",
  ];

  const sections = resultsByIndex.flatMap(({ indexName, result }) => {
    const sectionHeader = [`## ${getSectionTitle(indexName)} (${result.nbHits} total)`, ""];
    if (result.hits.length === 0) {
      return [...sectionHeader, "_No results._", ""];
    }
    const formattedHits = result.hits.map((hit) => formatListItem(
      getResultTitle(hit, indexName),
      getResultMarkdownUrl(hit, indexName),
      getResultDetails(hit, indexName),
    ));
    return [...sectionHeader, ...formattedHits, ""];
  });

  const markdown = [...headerLines, ...sections].join("\n");
  return new Response(markdown, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function getSearchDocumentationResponse(req: NextRequest): Response {
  const host = getSiteUrlFromReq(req);
  const markdown = `
# Search API

Use this endpoint to search posts, comments, wikitags, users, and sequences.

## Usage

- Markdown endpoint: \`/api/search\`
- HTML search page: \`/search\`
- Query parameter: \`?search=some%20keywords\`

Examples:

- \`https://${host}/api/search?search=decision%20theory\`
- \`https://${host}/search?search=decision%20theory\` (rewrites to markdown when markdown is requested)

## Parameters

- \`search\` (required for results): search text
- \`type\` (optional): one of \`posts\`, \`comments\`, \`tags\`, \`users\`, \`sequences\`
- \`limit\` (optional): results per type (default ${DEFAULT_RESULTS_PER_TYPE}, max ${MAX_RESULTS_PER_TYPE})
- \`page\` (optional): zero-based page (default 0)

If \`search\` is omitted, this documentation is returned.
`.trim();

  return new Response(markdown, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  const rawSearchQuery = req.nextUrl.searchParams.get("search")
    ?? req.nextUrl.searchParams.get("query")
    ?? "";
  const searchQuery = trimAndCollapseWhitespace(rawSearchQuery);
  if (!searchQuery) {
    return getSearchDocumentationResponse(req);
  }
  return await runMarkdownSearchQuery(req, searchQuery);
}

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
