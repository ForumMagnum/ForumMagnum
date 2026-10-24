import { gateway, tool, type ToolSet } from "ai";
import { z } from "zod";
import type { ForumTypeString } from "@/lib/instanceSettings";
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

const searchLessWrongInputSchema = z.object({
  query: z.string(),
  type: z.enum(["posts", "comments", "tags", "users", "sequences"]).optional()
    .describe("Only return this kind of result"),
});

const semanticSearchLessWrongInputSchema = z.object({
  query: z.string(),
  type: z.enum(["posts", "comments"]),
});

const readLessWrongInputSchema = z.object({
  url: z.string(),
});

export function getLlmTools(context: ResolverContext): ToolSet {
  const { forumType } = context;
  return {
    parallel_search: gateway.tools.parallelSearch(),
    browserbase_fetch: gateway.tools.browserbaseFetch({ format: "markdown" }),
    searchLessWrong: tool({
      description: "Keyword search over LessWrong posts, comments, wiki pages, users and sequences. Returns Markdown with links you can open with readLessWrong.",
      inputSchema: searchLessWrongInputSchema,
      execute: (input) => searchLessWrong(input, forumType),
    }),
    semanticSearchLessWrong: tool({
      description: "Search LessWrong posts or comments by meaning rather than exact words. Comment coverage is partial, mostly comments from 2023 onward.",
      inputSchema: semanticSearchLessWrongInputSchema,
      execute: (input) => semanticSearchLessWrong(input, context),
    }),
    readLessWrong: tool({
      description: "Read a LessWrong page as Markdown: a post, comment, wiki page or sequence. Takes a LessWrong URL or path. Use this rather than browserbase_fetch for LessWrong pages.",
      inputSchema: readLessWrongInputSchema,
      execute: (input) => readLessWrong(input, forumType),
    }),
  };
}

async function searchLessWrong({ query, type }: z.infer<typeof searchLessWrongInputSchema>, forumType: ForumTypeString): Promise<string> {
  const params = new URLSearchParams({
    search: query,
    limit: "10",
    ...(type ? { type } : {}),
  });
  return await fetchPublicMarkdown(`/api/search?${params}`, forumType);
}

async function semanticSearchLessWrong({ query, type }: z.infer<typeof semanticSearchLessWrongInputSchema>, context: ResolverContext): Promise<string> {
  if (type === "posts") {
    return await semanticSearchPosts(query, context);
  }
  return await semanticSearchComments(query, context);
}

async function readLessWrong({ url }: z.infer<typeof readLessWrongInputSchema>, forumType: ForumTypeString): Promise<string> {
  const markdownPath = getPublicMarkdownPath(url, forumType);
  if (!markdownPath) {
    throw new Error(`There is no Markdown version of ${url}`);
  }
  return await fetchPublicMarkdown(markdownPath, forumType);
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
