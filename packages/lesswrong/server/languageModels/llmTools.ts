import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
// The restriction is meant for the `openai` package (a Turbopack bundler bug);
// its `openai*` pattern also matches this unrelated AI SDK provider package.
// eslint-disable-next-line no-restricted-imports
import { openai } from "@ai-sdk/openai";
import { gateway, tool, type ToolSet } from "ai";
import { z } from "zod";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { htmlToTextDefault } from "@/lib/htmlToText";
import { asyncFilter } from "@/lib/utils/asyncUtils";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { getEmbeddingsFromApi as getPostSearchEmbeddings } from "@/server/embeddings";
import { getEmbeddingsFromApi as getCommentSearchEmbeddings } from "@/server/voyage/client";
import { commentIsPubliclyVisible, postIsPubliclyVisible } from "./publicVisibility";
import { fetchPublicMarkdown, getPublicMarkdownPath } from "./publicMarkdown";

const SEMANTIC_SEARCH_RESULT_LIMIT = 10;
const COMMENT_SNIPPET_CHARACTERS = 300;

/**
 * The tools a model gets: web search, web fetch, and LessWrong search and
 * reading. LessWrong content comes through the public Markdown API, fetched
 * without cookies so it returns exactly what a logged-out visitor sees;
 * semantic search reads embeddings from our database, so its results are
 * checked with `publicVisibility`.
 */
export function getLlmTools(context: ResolverContext, gatewayModelId: string): ToolSet {
  const { forumType } = context;
  return {
    ...getWebSearchTool(gatewayModelId),
    // Fetched by Browserbase, not by our servers
    browserbase_fetch: gateway.tools.browserbaseFetch({ format: "markdown" }),
    searchLessWrong: tool({
      description: "Keyword search over LessWrong posts, comments, wiki pages, users and sequences, optionally limited to one author's posts and comments. Returns Markdown with links you can open with readLessWrong.",
      inputSchema: z.object({
        query: z.string(),
        type: z.enum(["posts", "comments", "tags", "users", "sequences"]).optional()
          .describe("Only return this kind of result"),
        author: z.string().optional()
          .describe("Only return posts and comments by this user, given as their user slug"),
      }),
      execute: async ({ query, type, author }) => {
        const params = new URLSearchParams({
          search: query,
          limit: "10",
          ...(type ? { type } : {}),
          ...(author ? { author } : {}),
        });
        return await fetchPublicMarkdown(`/api/search?${params}`, forumType);
      },
    }),
    semanticSearchLessWrong: tool({
      description: "Search LessWrong posts or comments by meaning rather than exact words. Comment coverage is partial, mostly comments from 2023 onward.",
      inputSchema: z.object({
        query: z.string(),
        type: z.enum(["posts", "comments"]),
      }),
      execute: async ({ query, type }) => type === "posts"
        ? await semanticSearchPosts(query, context)
        : await semanticSearchComments(query, context),
    }),
    readLessWrong: tool({
      description: "Read a LessWrong page as Markdown: a post, comment, wiki page or sequence. Takes a LessWrong URL or path. Use this rather than browserbase_fetch for LessWrong pages.",
      inputSchema: z.object({
        url: z.string(),
      }),
      execute: async ({ url }) => {
        const markdownPath = getPublicMarkdownPath(url, forumType);
        if (!markdownPath) {
          return `There is no Markdown version of ${url}.`;
        }
        return await fetchPublicMarkdown(markdownPath, forumType);
      },
    }),
  };
}

/**
 * The model's own provider's search tool where it has one, otherwise the
 * Gateway's. Tool names follow each provider's documented examples.
 */
function getWebSearchTool(gatewayModelId: string): ToolSet {
  const provider = gatewayModelId.split("/")[0];
  switch (provider) {
    case "anthropic":
      return { web_search: anthropic.tools.webSearch_20250305() };
    case "openai":
      return { web_search: openai.tools.webSearch({}) };
    case "google":
      return { google_search: google.tools.googleSearch({}) };
    default:
      return { parallel_search: gateway.tools.parallelSearch() };
  }
}

async function semanticSearchPosts(query: string, context: ResolverContext): Promise<string> {
  const { embeddings } = await getPostSearchEmbeddings(query);
  const postIds = await context.repos.postEmbeddings.getNearestPostIdsWeightedByQuality(embeddings, SEMANTIC_SEARCH_RESULT_LIMIT);
  const posts = filterNonnull(await Promise.all(postIds.map((postId) => context.loaders.Posts.load(postId))));
  const visiblePosts = await asyncFilter(posts, (post) => postIsPubliclyVisible(post, context));
  if (!visiblePosts.length) {
    return "No results.";
  }

  const lines = await Promise.all(visiblePosts.map(async (post) => {
    const author = await context.loaders.Users.load(post.userId);
    return `- [${post.title}](/posts/${post._id}/${post.slug}) by ${userGetDisplayName(author, context.forumType)}, ${post.postedAt.toISOString().slice(0, 10)}, ${post.baseScore} karma`;
  }));
  return lines.join("\n");
}

async function semanticSearchComments(query: string, context: ResolverContext): Promise<string> {
  const { embeddings } = await getCommentSearchEmbeddings(query, "query");
  const comments = await context.repos.commentEmbeddings.searchCommentsByEmbedding(embeddings, { scoreBias: 0 });
  const visibleComments = (await asyncFilter(comments, (comment) => commentIsPubliclyVisible(comment, context)))
    .slice(0, SEMANTIC_SEARCH_RESULT_LIMIT);
  if (!visibleComments.length) {
    return "No results.";
  }

  const lines = await Promise.all(visibleComments.map(async (comment) => {
    const [author, post] = await Promise.all([
      context.loaders.Users.load(comment.userId),
      comment.postId ? context.loaders.Posts.load(comment.postId) : null,
    ]);
    const snippet = htmlToTextDefault(comment.contents?.html ?? "").slice(0, COMMENT_SNIPPET_CHARACTERS);
    return `- [Comment by ${userGetDisplayName(author, context.forumType)} on "${post?.title}"](/posts/${comment.postId}/${post?.slug}/comment/${comment._id}), ${comment.baseScore} karma: ${snippet}`;
  }));
  return lines.join("\n");
}
