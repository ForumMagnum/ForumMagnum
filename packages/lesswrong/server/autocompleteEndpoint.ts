import type { Express } from "express";
import { getContextFromReqAndRes, getUserFromReq } from "./vulcan-lib/apollo-server/context";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { getAnthropicPromptCachingClientOrThrow } from "./languageModels/anthropicClient";
import express from "express";
import { PromptCachingBetaMessageParam } from "@anthropic-ai/sdk/resources/beta/prompt-caching/messages";
import { formatRelative } from "@/lib/utils/timeFormat";
import { Readable } from 'stream';
import { pipeline } from 'stream/promises'
import { hyperbolicApiKey } from "@/lib/instanceSettings";
import { runQuery } from "./vulcan-lib/query";
import Users from "@/server/collections/users/collection";
import { clientIdMiddleware } from "./clientIdMiddleware";
import { gql } from "@/lib/generated/gql-codegen";

const postsForAutocompleteQuery = gql(`
  query multiPostsForAutocompleteQuery($input: MultiPostInput) {
    posts(input: $input) {
      results {
        ...PostsForAutocomplete
      }
    }
  }
`);

const commentsForAutocompleteQuery = gql(`
  query multiCommentsForAutocompleteQuery($input: MultiCommentInput) {
    comments(input: $input) {
      results {
        ...CommentsForAutocomplete
      }
    }
  }
`);

const commentsForAutocompleteWithParentsQuery = gql(`
  query multiCommentsForAutocompleteWithParentsQuery($input: MultiCommentInput) {
    comments(input: $input) {
      results {
        ...CommentsForAutocompleteWithParents
      }
    }
  }
`);

const getParentComments = (comment: CommentsForAutocompleteWithParents) => {
  const parentComments: CommentsForAutocompleteWithParents[] = [];
  let currentComment: CommentsForAutocompleteWithParents | null = comment;
  while (currentComment.parentComment && currentComment.parentComment._id !== currentComment._id) {
    currentComment = currentComment.parentComment as CommentsForAutocompleteWithParents;
    if (currentComment) {
      parentComments.push(currentComment);
    } else {
      break;
    }
  }
  return parentComments.reverse();
}

const getPostBodyFormatted = (post: PostsForAutocomplete) => {
  return `${post.title}
by ${post.user?.displayName}
${post.baseScore}
${post.contents?.markdown}`.trim();
}

const getCommentBodyFormatted = (comment: CommentsForAutocomplete) => {
  const dateString = formatRelative(new Date(comment.createdAt ?? 0), new Date(), false)
  return `Comment on ${comment.post?.title}
${comment.user?.displayName} ${dateString} ${comment.baseScore} ${comment.extendedScore?.agreement}
${comment.contents?.markdown}`.trim();
}

const getPostReplyMessageFormatted = (post: PostsForAutocomplete, currentUser: DbUser, prefix: string) => {
  return `${getPostBodyFormatted(post)}
---
Comment on ${post.title}
${currentUser.displayName} 1h ${Math.floor(20 + (Math.random() * 75))} ${Math.floor((Math.random() - 0.35) * 100)}
${prefix}`.trim();
}

const getCommentReplyMessageFormatted = (comment: CommentsForAutocompleteWithParents, prefix: string, currentUser: DbUser) => {
  const parentComments = getParentComments(comment);
  return `${getPostBodyFormatted(comment.post!)}
---
${parentComments.map((comment) => getCommentBodyFormatted(comment)).join("\n---\n")}
---
${getCommentBodyFormatted(comment)}
---
Comment on ${comment.post?.title}
${currentUser.displayName} 1h ${Math.floor(20 + (Math.random() * 75))} ${Math.floor((Math.random() - 0.5) * 100)}
${prefix}`.trim();
}

async function constructMessageHistory(
  prefix: string,
  commentIds: string[],
  postIds: string[],
  user: DbUser,
  context: ResolverContext,
  replyingCommentId?: string,
  postId?: string
): Promise<PromptCachingBetaMessageParam[]> {
  const messages: PromptCachingBetaMessageParam[] = [];

  // Make the fetches parallel to save time
  const [postsResponse, commentsResponse] = await Promise.all([
    runQuery(postsForAutocompleteQuery, {
      input: { terms: { postIds } }
    }, context),
    runQuery(commentsForAutocompleteQuery, {
      input: { terms: { commentIds } }
    }, context),
  ]);

  const posts = postsResponse.data?.posts?.results?.filter((post): post is NonNullable<typeof post> => !!post) ?? [];
  const comments = commentsResponse.data?.comments?.results?.filter((comment): comment is NonNullable<typeof comment> => !!comment) ?? [];

  // eslint-disable-next-line no-console
  console.log(`Converting ${posts.length} posts and ${comments.length} comments to messages`);

  // Add fetched posts and comments to message history
  for (const post of posts) {
    messages.push({
      role: "user",
      content: [{ type: "text", text: `<cmd>cat lw/${post._id}.txt</cmd>` }],
    });

    messages.push({
      role: "assistant",
      content: [
        {
          type: "text",
          text: getPostBodyFormatted(post),
        },
      ],
    });
  }

  for (const comment of comments) {
    messages.push({
      role: "user",
      content: [{ type: "text", text: `<cmd>cat lw/${comment._id}.txt</cmd>` }],
    });

    messages.push({
      role: "assistant",
      content: [{ type: "text", text: getCommentBodyFormatted(comment) }],
    });
  }

  // Add final user message with prefix
  messages.push({
    role: "user",
    content: [{ type: "text", text: `<cmd>cat lw/hsqKp56whpPEQns3Z.txt</cmd>`, cache_control: {type: "ephemeral"}}]
  });

  if (replyingCommentId) {
    // Fetch the comment we're replying to
    const replyingToCommentResponse = await runQuery(commentsForAutocompleteWithParentsQuery, {
      input: { terms: { commentIds: [replyingCommentId] } }
    }, context);
    
    const replyingToComments = replyingToCommentResponse.data?.comments?.results?.filter((comment): comment is NonNullable<typeof comment> => !!comment) ?? [];
    if (replyingToComments.length === 0) {
      throw new Error("Comment not found");
    }
    const replyingToComment = replyingToComments[0];
    const message = getCommentReplyMessageFormatted(replyingToComment, prefix, user)

    messages.push({
      role: "assistant",
      content: [
        {
          type: "text",
          text: message
        },
      ],
    });
  }
  else if (postId) {
    const postResponse = await runQuery(postsForAutocompleteQuery, {
      input: { terms: { postIds: [postId] } }
    }, context);
    
    const posts = postResponse.data?.posts?.results?.filter((post): post is NonNullable<typeof post> => !!post) ?? [];
    if (posts.length === 0) {
      throw new Error("Post not found");
    }
    const post = posts[0];

    messages.push({
      role: "assistant",
      content: [
        {
          type: "text",
          text: getPostReplyMessageFormatted(post, user, prefix)
        },
      ],
    });
  }
  else {
    messages.push({
      role: "assistant",
      content: [
        {
          type: "text",
          text: `${prefix}`
        }
      ]
    });
  }
  return messages;
}

async function construct405bPrompt(
  prefix: string,
  commentIds: string[],
  postIds: string[],
  user: DbUser,
  context: ResolverContext,
  replyingCommentId?: string,
  postId?: string
): Promise<string> {

  // Make the fetches parallel to save time
  const [postsResponse, commentsResponse] = await Promise.all([
    runQuery(postsForAutocompleteQuery, {
      input: { terms: { postIds } }
    }, context),
    runQuery(commentsForAutocompleteQuery, {
      input: { terms: { commentIds } }
    }, context),
  ]);

  const posts = postsResponse.data?.posts?.results?.filter((post) => !!post) ?? [];
  const comments = commentsResponse.data?.comments?.results?.filter((comment) => !!comment) ?? [];

  // eslint-disable-next-line no-console
  console.log(`Converting ${posts.length} posts and ${comments.length} comments to messages`, postId, replyingCommentId);

  let finalSection = ''

  if (replyingCommentId) {
    // Fetch the comment we're replying to
    const replyingToCommentResponse = await runQuery(commentsForAutocompleteWithParentsQuery, {
      input: { terms: { commentIds: [replyingCommentId] } }
    }, context);
    
    const replyingToComments = replyingToCommentResponse.data?.comments?.results?.filter((comment) => !!comment) ?? [];
    if (replyingToComments.length === 0) {
      throw new Error("Comment not found");
    }
    const replyingToComment = replyingToComments[0];

    finalSection = getCommentReplyMessageFormatted(replyingToComment, prefix, user)    
  } else if (postId) {
    const postResponse = await runQuery(postsForAutocompleteQuery, {
      input: { terms: { postIds: [postId] } }
    }, context);
    
    const posts = postResponse.data?.posts?.results?.filter((post) => !!post) ?? [];
    if (posts.length === 0) {
      throw new Error("Post not found");
    }
    const post = posts[0];

    finalSection = getPostReplyMessageFormatted(post, user, prefix)
  } else {
    finalSection = `${prefix}`
  }


  return `
${posts.map((post) => getPostBodyFormatted(post)).join("\n---\n")}
====
${comments.map((comment) => getCommentBodyFormatted(comment)).join("\n---\n")}
====
${finalSection}`.trim();
}


export function addAutocompleteEndpoint(app: Express) {
  app.use("/api/autocomplete", express.json(), clientIdMiddleware);
  app.post("/api/autocomplete", async (req, res) => {
    const context = await getContextFromReqAndRes({req, res, isSSR: false});
    const currentUser = context.currentUser
    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      if (!userIsAdmin(currentUser)) {
        throw new Error("Claude Completion is for admins only");
      }

      const client = getAnthropicPromptCachingClientOrThrow();

      const { prefix = '', commentIds, postIds, replyingCommentId, postId, userId } = req.body;
      const user = userId ? await context.loaders.Users.load(userId) : undefined;

      // Set headers for streaming response
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      const loadingMessagesStream = client.messages.stream({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        system: "The assistant is in CLI simulation mode, and responds to the user's CLI commands only with the output of the command.",
        messages: await constructMessageHistory(
          prefix,
          commentIds,
          postIds,
          user ?? currentUser,
          context,
          replyingCommentId,
          postId
        ),
      });

      loadingMessagesStream.on("text", (delta, snapshot) => {
        res.write(
          `data: ${JSON.stringify({ type: "text", content: delta })}\n\n`,
        );
      });

      loadingMessagesStream.on("end", () => {
        res.write(`data: ${JSON.stringify({ type: "end" })}\n\n`);
        res.end();
      });

      loadingMessagesStream.on("error", (error) => {
        // eslint-disable-next-line no-console
        console.error("Stream error:", JSON.stringify(error));
        res.write(
          `data: ${JSON.stringify({ type: "error", message: "An error occurred" })}\n\n`,
        );
        res.end();
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Autocomplete error:", error);
      res.status(500).json({ error: "An error occurred during autocomplete" });
    }
  });
  app.use("/api/autocomplete405b", express.json());
  app.post("/api/autocomplete405b", async (req, res) => {
    const context = await getContextFromReqAndRes({req, res, isSSR: false});
    const currentUser = context.currentUser
    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      if (!userIsAdmin(currentUser)) {
        throw new Error("Claude Completion is for admins only");
      }
  
      const { prefix = '', commentIds, postIds, replyingCommentId, postId, userId } = req.body;
      const user = userId ? await Users.findOne({ _id: userId}) : undefined;

      // Set headers for streaming response
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
  
      const url = 'https://api.hyperbolic.xyz/v1/completions';
  
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hyperbolicApiKey.get()}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/Meta-Llama-3.1-405B',
          prompt: await construct405bPrompt(
            prefix,
            commentIds,
            postIds,
            user ?? currentUser,
            context,
            replyingCommentId,
            postId
          ),
          max_tokens: 256,
          temperature: 0.7,
          top_p: 0.9,
          stream: true,
          frequency_penalty: 0.5
        }),
      });
  
      if (!response.ok || !response.body) {
        res.writeHead(response.status, response.statusText);
        res.end(`Error from API: ${response.statusText}`);
        return;
      }
      const reader = response.body.getReader();
      const readableNodeStream = new Readable({
        async read() {
          const { done, value } = await reader.read();
          if (done) {
            this.push(null);
          } else {
            this.push(Buffer.from(value));
          }
        }
      });

      await pipeline(readableNodeStream, res);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Autocomplete error:", error);
      res.status(500).json({ error: "An error occurred during autocomplete" });
    }
  });
}
