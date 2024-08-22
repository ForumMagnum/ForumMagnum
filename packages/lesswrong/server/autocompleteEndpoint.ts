import type { Express } from "express";
import { getUserFromReq } from "./vulcan-lib/apollo-server/context";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { getAnthropicClientOrThrow } from "./languageModels/anthropicClient";
import express from "express";
import { PromptCachingBetaMessageParam } from "@anthropic-ai/sdk/resources/beta/prompt-caching/messages";
import { Posts } from "@/lib/collections/posts";
import { Comments } from "@/lib/collections/comments";
import Revisions from "@/lib/collections/revisions/collection";
import { turndownService } from "./editor/conversionUtils";
import Anthropic from "@anthropic-ai/sdk";

async function constructMessageHistory(
  prefix: string,
  commentIds: string[],
  postIds: string[],
  currentUser: any,
  comment: boolean
): Promise<PromptCachingBetaMessageParam[]> {
  const messages: PromptCachingBetaMessageParam[] = [];

  // Fetch revisions
  const revisions = await Revisions.find({ documentId: { $in: [...postIds, ...commentIds] }, fieldName: "contents", version: "1.0.0" }).fetch();
  const revisionsMap = new Map(revisions.map((revision) => [revision.documentId, revision]));

  // Fetch posts
  const posts = await Posts.find({ _id: { $in: postIds } }).fetch();

  // Fetch comments
  const comments = await Comments.find({ _id: { $in: commentIds } }).fetch();

  // Add fetched posts and comments to message history
  for (const post of posts) {
    messages.push({
      role: "user",
      content: [{ type: "text", text: `<cmd>cat lw/${post._id}.txt</cmd>` }],
    });


    const markdownBody = turndownService.turndown(revisionsMap.get(post._id)?.html ?? post.contents?.html ?? "<not available/>");

    messages.push({
      role: "assistant",
      content: [
        {
          type: "text",
          text: `${post.title}
by ${post.author}
${post.baseScore}
${markdownBody}`,
        },
      ],
    });
  }

  for (const comment of comments) {

    const markdownBody = turndownService.turndown(revisionsMap.get(comment._id)?.html ?? comment.contents?.html ?? "<not available/>");

    messages.push({
      role: "user",
      content: [{ type: "text", text: `<cmd>cat lw/${comment._id}.txt</cmd>` }],
    });

    messages.push({
      role: "assistant",
      content: [{ type: "text", text: `${markdownBody}` }],
    });
  }

  // Add final user message with prefix
  messages.push({
    role: "user",
    content: [{ type: "text", text: `<cmd>cat lw/1903.txt</cmd>`, cache_control: {type: "ephemeral"}}]
  });

  messages.push({
    role: "assistant",
    content: [
      {
        type: "text",
        text: `${prefix}${
          comment
            ? `
---
${currentUser.displayName}
5d
120
25`
            : ``
        }
`.trim(),
      },
    ],
  },);

  console.log({ comment, messages, contents: messages.map(message => message.content[0]?.text?.slice(0, 100)) });

  return messages;
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

      const client = getAnthropicClientOrThrow();
      const promptCachingClient = new Anthropic.Beta.PromptCaching(client);

      const { prefix, commentIds, postIds, comment } = req.body;

      if (!prefix) {
        return res.status(400).json({ error: "Prefix is required" });
      }

      // Set headers for streaming response
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      const loadingMessagesStream = promptCachingClient.messages.stream({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 2000,
        messages: await constructMessageHistory(
          prefix,
          commentIds,
          postIds,
          currentUser,
          comment,
        ),
      });

      loadingMessagesStream.on("text", (delta, snapshot) => {
        console.log("delta", delta);
        res.write(
          `data: ${JSON.stringify({ type: "text", content: delta })}\n\n`,
        );
      });

      loadingMessagesStream.on("end", () => {
        res.write(`data: ${JSON.stringify({ type: "end" })}\n\n`);
        res.end();
      });

      loadingMessagesStream.on("error", (error) => {
        console.error("Stream error:", error);
        res.write(
          `data: ${JSON.stringify({ type: "error", message: "An error occurred" })}\n\n`,
        );
        res.end();
      });
    } catch (error) {
      console.error("Autocomplete error:", error);
      res.status(500).json({ error: "An error occurred during autocomplete" });
    }
  });
}
