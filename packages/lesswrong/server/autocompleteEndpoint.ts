import type { Express } from "express";
import { getUserFromReq } from "./vulcan-lib/apollo-server/context";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { getAnthropicPromptCachingClientOrThrow } from "./languageModels/anthropicClient";
import express from "express";
import { PromptCachingBetaMessageParam } from "@anthropic-ai/sdk/resources/beta/prompt-caching/messages";
import { Posts } from "@/lib/collections/posts";
import { Comments } from "@/lib/collections/comments";
import Revisions from "@/lib/collections/revisions/collection";
import { turndownService } from "./editor/conversionUtils";
import { formatRelative } from "@/lib/utils/timeFormat";
import Users from "@/lib/vulcan-users";
const { Readable } = require('stream');
import { pipeline } from 'stream/promises'
import { hyperbolicApiKey } from "@/lib/instanceSettings";



const getParentComments = async (comment: DbComment) => {
  const parentComments: DbComment[] = [];
  let currentComment: DbComment | null = comment;
  while (currentComment.parentCommentId && currentComment.parentCommentId !== currentComment._id) {
    currentComment = await Comments.findOne({ _id: currentComment.parentCommentId });
    if (currentComment) {
      parentComments.push(currentComment);
    } else {
      break;
    }
  }

  return parentComments.reverse();
}

const getPostBodyFormatted = (post: DbPost, revisionsMap: Map<string, DbRevision>, authorsMap: Map<string, DbUser>) => {
  const markdownBody = turndownService.turndown(revisionsMap.get(post._id)?.html ?? "<not available/>");
  const author = authorsMap.get(post.userId)?.displayName;
  return `${post.title}
by ${author}
${post.baseScore}
${markdownBody}`.trim();
}

const getCommentBodyFormatted = (comment: DbComment, revisionsMap: Map<string, DbRevision>, authorsMap: Map<string, DbUser>, parentPost: DbPost) => {
  const markdownBody = turndownService.turndown(revisionsMap.get(comment._id)?.html ?? comment.contents?.html ?? "<not available/>");
  const dateString = formatRelative(new Date(comment.createdAt), new Date(), false)
  const author = authorsMap.get(comment.userId)?.displayName;
  return `Comment on ${parentPost.title}
${author} ${dateString} ${comment.baseScore} ${comment.extendedScore?.agreement}
${markdownBody}`.trim();
}

const getPostReplyMessageFormatted = (post: DbPost, revisionsMap: Map<string, DbRevision>, authorsMap: Map<string, DbUser>, currentUser: DbUser, prefix: string) => {
  return `${getPostBodyFormatted(post, revisionsMap, authorsMap)}
---
Comment on ${post.title}
${currentUser.displayName} 1h ${Math.floor(20 + (Math.random() * 75))} ${Math.floor((Math.random() - 0.5) * 100)}
${prefix}`.trim();
}

const getCommentReplyMessageFormatted = (comment: DbComment, parentComments: DbComment[], parentPost: DbPost, revisionsMap: Map<string, DbRevision>, authorsMap: Map<string, DbUser>, prefix: string, currentUser: DbUser) => {
  const parentComment = parentComments[parentComments.length - 1];
  return `${getPostBodyFormatted(parentPost, revisionsMap, authorsMap)}
---
${parentComments.map((comment) => getCommentBodyFormatted(comment, revisionsMap, authorsMap, parentPost)).join("\n---\n")}
---
${getCommentBodyFormatted(comment, revisionsMap, authorsMap, parentPost)}
---
Comment on ${parentPost.title}
${currentUser.displayName} 1h ${Math.floor(20 + (Math.random() * 75))} ${Math.floor((Math.random() - 0.5) * 100)}
${prefix}`.trim();
}

async function constructMessageHistory(
  prefix: string,
  commentIds: string[],
  postIds: string[],
  currentUser: any,
  replyingCommentId?: string,
  postId?: string
): Promise<PromptCachingBetaMessageParam[]> {
  const messages: PromptCachingBetaMessageParam[] = [];

  // Make the fetches parallel to save time
  const [revisions, posts, comments] = await Promise.all([
    Revisions.find({ documentId: { $in: [...postIds, ...commentIds] }, fieldName: "contents", version: "1.0.0" }).fetch(),
    Posts.find({ _id: { $in: postIds } }).fetch(),
    Comments.find({ _id: { $in: commentIds } }).fetch(),
  ]);

  const postsOfComments = await Posts.find({ _id: { $in: comments.map((comment) => comment.postId) } }).fetch();

  const authors = await Users.find({ _id: { $in: [...posts.map((post) => post.userId), ...comments.map((comment) => comment.userId)] } }).fetch();

  const authorsMap = new Map(authors.map((author) => [author._id, author]));
  const revisionsMap = new Map(revisions.map((revision) => [revision.documentId!, revision]));

  // eslint-disable-next-line no-console
  console.log(`Converting ${posts.length} posts and ${comments.length} comments to messages`);
  // eslint-disable-next-line no-console
  console.time("constructPostMessageHistory");

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
          text: getPostBodyFormatted(post, revisionsMap, authorsMap),
        },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.timeEnd("constructPostMessageHistory");

  for (const comment of comments) {
    const parentPost = postsOfComments.find((post) => post._id === comment.postId);
    messages.push({
      role: "user",
      content: [{ type: "text", text: `<cmd>cat lw/${comment._id}.txt</cmd>` }],
    });

    messages.push({
      role: "assistant",
      content: [{ type: "text", text: getCommentBodyFormatted(comment, revisionsMap, authorsMap, parentPost!) }],
    });
  }

  // Add final user message with prefix
  messages.push({
    role: "user",
    content: [{ type: "text", text: `<cmd>cat lw/hsqKp56whpPEQns3Z.txt</cmd>`, cache_control: {type: "ephemeral"}}]
  });

  if (replyingCommentId) {
    // Fetch the comment we're replying to
    const replyingToComment = await Comments.findOne({ _id: replyingCommentId });
    if (!replyingToComment) {
      throw new Error("Comment not found");
    }
    const parentComments = await getParentComments(replyingToComment);
    const parentPost = await Posts.findOne({ _id: replyingToComment.postId });
    const parentPostRevision = await Revisions.findOne({ documentId: parentPost?._id, fieldName: "contents", version: "1.0.0" });

    if (!parentPost) {
      throw new Error(`Parent post or revision not found ${replyingToComment.postId}`);
    }

    const authors = await Users.find({ _id: { $in: [parentPost.userId, ...parentComments.map((comment) => comment.userId), replyingToComment.userId] } }).fetch();

    authors.forEach((author) => authorsMap.set(author._id, author));
    revisionsMap.set(parentPost._id!, parentPostRevision!);
    if (!parentPost) {
      throw new Error("Post not found");
    }

    const message = getCommentReplyMessageFormatted(replyingToComment, parentComments, parentPost, revisionsMap, authorsMap, prefix, currentUser)

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
    const post = await Posts.findOne({ _id: postId });
    if (!post) {
      throw new Error("Post not found");
    }
    const postRevision = await Revisions.findOne({ documentId: post._id, fieldName: "contents", version: "1.0.0" });
    if (!postRevision) {
      throw new Error("Post revision not found");
    }

    const authors = await Users.find({ _id: post.userId }).fetch();
    authors.forEach((author) => authorsMap.set(author._id, author));
    revisionsMap.set(post._id!, postRevision);

    const message = getPostReplyMessageFormatted(post, revisionsMap, authorsMap, currentUser, prefix);

    messages.push({
      role: "assistant",
      content: [
        {
          type: "text",
          text: getPostReplyMessageFormatted(post, revisionsMap, authorsMap, currentUser, prefix)
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
  currentUser: any,
  replyingCommentId?: string,
  postId?: string
): Promise<string> {

  // Make the fetches parallel to save time
  const [revisions, posts, comments] = await Promise.all([
    Revisions.find({ documentId: { $in: [...postIds, ...commentIds] }, fieldName: "contents", version: "1.0.0" }).fetch(),
    Posts.find({ _id: { $in: postIds } }).fetch(),
    Comments.find({ _id: { $in: commentIds } }).fetch(),
  ]);

  const authors = await Users.find({ _id: { $in: [...posts.map((post) => post.userId), ...comments.map((comment) => comment.userId)] } }).fetch();

  const authorsMap = new Map(authors.map((author) => [author._id, author]));
  const revisionsMap = new Map(revisions.map((revision) => [revision.documentId!, revision]));
  
  const postsOfComments = await Posts.find({ _id: { $in: comments.map((comment) => comment.postId) } }).fetch();
  const postsOfCommentsMap = new Map(postsOfComments.map((post) => [post._id, post]));

  // eslint-disable-next-line no-console
  console.log(`Converting ${posts.length} posts and ${comments.length} comments to messages`, postId, replyingCommentId);

  let finalSection = ''

  if (replyingCommentId) {
    // Fetch the comment we're replying to
    const replyingToComment = await
    Comments.findOne({ _id: replyingCommentId });
    if (!replyingToComment) {
      throw new Error("Comment not found");
    }
    const parentComments = await getParentComments(replyingToComment);
    const parentPost = await Posts.findOne({ _id: replyingToComment.postId });
    const parentPostRevision = await Revisions.findOne({ documentId: parentPost?._id, fieldName: "contents", version: "1.0.0" });

    if (!parentPost) {
      throw new Error(`Parent post or revision not found ${replyingToComment.postId}`);
    }

    const authors = await Users.find({ _id: { $in: [parentPost.userId, ...parentComments.map((comment) => comment.userId), replyingToComment.userId] } }).fetch();

    authors.forEach((author) => authorsMap.set(author._id, author));
    revisionsMap.set(parentPost._id!, parentPostRevision!);

    finalSection = getCommentReplyMessageFormatted(replyingToComment, parentComments, parentPost, revisionsMap, authorsMap, prefix, currentUser)    
  } else if (postId) {
    const post = await Posts.findOne({ _id: postId });
    if (!post) {
      throw new Error("Post not found");
    }
    const postRevision = await Revisions.findOne({ documentId: post._id, fieldName: "contents", version: "1.0.0" });
    if (!postRevision) {
      throw new Error("Post revision not found");
    }

    const authors = await Users.find({ _id: post.userId }).fetch();
    authors.forEach((author) => authorsMap.set(author._id, author));
    revisionsMap.set(post._id!, postRevision);

    finalSection = getPostReplyMessageFormatted(post, revisionsMap, authorsMap, currentUser, prefix)
  } else {
    finalSection = `${prefix}`
  }


  return `
${posts.map((post) => getPostBodyFormatted(post, revisionsMap, authorsMap)).join("\n---\n")}
====
${comments.map((comment) => getCommentBodyFormatted(comment, revisionsMap, authorsMap, postsOfCommentsMap.get(comment.postId!)!)).join("\n---\n")}
====
${finalSection}`.trim();
}


export function addAutocompleteEndpoint(app: Express) {
  app.use("/api/autocomplete", express.json());
  app.post("/api/autocomplete", async (req, res) => {
    const currentUser = getUserFromReq(req);
    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      if (!userIsAdmin(currentUser)) {
        throw new Error("Claude Completion is for admins only");
      }

      const client = getAnthropicPromptCachingClientOrThrow();

      const { prefix = '', commentIds, postIds, replyingCommentId, postId } = req.body;

      // Set headers for streaming response
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      const loadingMessagesStream = client.messages.stream({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1000,
        system: "The assistant is in CLI simulation mode, and responds to the user's CLI commands only with the output of the command.",
        messages: await constructMessageHistory(
          prefix,
          commentIds,
          postIds,
          currentUser,
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
    const currentUser = getUserFromReq(req);
    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { prefix = '', commentIds, postIds, replyingCommentId, postId } = req.body;
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
          currentUser,
          replyingCommentId,
          postId
        ),
        max_tokens: 256,
        temperature: 0.7,
        top_p: 0.9,
        stream: true
      }),
    });

    if (!response.ok || !response.body) {
      res.writeHead(response.status, response.statusText);
      res.end(`Error from API: ${response.statusText}`);
      return;
    }

    try {
      if (!userIsAdmin(currentUser)) {
        throw new Error("Claude Completion is for admins only");
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
