import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { validateAccessToken, OAuthError } from "@/server/oauth/oauthProvider";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import Users from "@/server/collections/users/collection";
import { randomId } from "@/lib/random";
import { insertDraftCommentThread } from "../agent/commentOnDraft/route";
import { replaceTextInMainDoc } from "../agent/replaceText/route";
import { insertMarkdownBlock } from "../agent/insertBlock/route";

const MarkdownPostEditQuery = `
  query McpPostsEdit($documentId: String, $contentsVersion: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        _id
        title
        userId
        draft
        contents(version: $contentsVersion) {
          agentMarkdown
        }
      }
    }
  }
`;

const HocuspocusAuthQuery = `
  query McpHocuspocusAuthQuery($postId: String!, $linkSharingKey: String) {
    HocuspocusAuth(postId: $postId, linkSharingKey: $linkSharingKey) {
      token
    }
  }
`;

// --- Auth helpers ---

interface AuthExtra {
  authInfo?: {
    token: string;
    clientId: string;
    scopes: string[];
    expiresAt?: number;
    extra?: Record<string, unknown>;
  };
}

function getBearerToken(extra: AuthExtra): string {
  if (!extra.authInfo?.token) {
    throw new OAuthError("invalid_token", "No access token provided");
  }
  return extra.authInfo.token;
}

async function contextFromAuth(extra: AuthExtra): Promise<ResolverContext> {
  const bearerToken = getBearerToken(extra);
  const { userId } = await validateAccessToken(bearerToken);
  const user = await Users.findOne({ _id: userId });
  return computeContextFromUser({ user: user ?? null, isSSR: false });
}

async function getHocuspocusToken(context: ResolverContext, postId: string): Promise<string> {
  const { data } = await runQuery(
    HocuspocusAuthQuery,
    { postId, linkSharingKey: null },
    context,
  );
  const token = data?.HocuspocusAuth?.token;
  if (!token) {
    throw new OAuthError("invalid_request", "Unauthorized to access this post's draft");
  }
  return token;
}

/**
 * Creates a fresh McpServer instance with all tools registered.
 * A new instance is needed per-request because McpServer.connect()
 * takes ownership of the transport and replaces its callbacks.
 */
function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "LessWrong",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.registerTool(
    "read_post",
    {
      description: "Read the content of a LessWrong post draft in markdown format. Returns the post title and body as agent-friendly markdown.",
      inputSchema: {
        postId: z.string().describe("The ID of the post to read"),
        version: z.string().optional().describe("Content version to load, defaults to 'draft'"),
      },
      annotations: { readOnlyHint: true },
    },
    async (args, extra) => {
      const context = await contextFromAuth(extra);

      const { data } = await runQuery(
        MarkdownPostEditQuery,
        { documentId: args.postId, contentsVersion: args.version ?? "draft" },
        context,
      );
      const post = data?.post?.result;
      if (!post) {
        return { content: [{ type: "text" as const, text: "Post not found or access denied" }], isError: true };
      }

      const markdown = post.contents?.agentMarkdown ?? "";
      return {
        content: [{
          type: "text" as const,
          text: `# ${post.title}\n\npostId: ${post._id}\ndraft: ${post.draft}\n\n${markdown}`,
        }],
      };
    },
  );

  server.registerTool(
    "comment_on_draft",
    {
      description: "Add a Google Docs-style comment to a post draft. If a quote is provided, the comment will be attached to the matching quoted text. If no quote is provided, the comment will be top-level. Both the quote and comment should be in markdown.",
      inputSchema: {
        postId: z.string().describe("The ID of the post to comment on"),
        comment: z.string().describe("The comment text in markdown"),
        quote: z.string().optional().describe("Text to attach the comment to (should be long enough to be unambiguous)"),
        agentName: z.string().optional().describe("Name to attribute the comment to"),
      },
      annotations: { destructiveHint: true },
    },
    async (args, extra) => {
      const context = await contextFromAuth(extra);
      const token = await getHocuspocusToken(context, args.postId);

      const authorId = context.currentUser?._id ?? `agent-${randomId()}`;
      const authorName = args.agentName ?? context.currentUser?.displayName ?? "AI Agent";
      const threadQuote = args.quote ?? "(No quote provided)";

      const result = await insertDraftCommentThread({
        postId: args.postId,
        token,
        comment: args.comment,
        quote: threadQuote,
        author: authorName,
        authorId,
      });

      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    },
  );

  server.registerTool(
    "replace_text",
    {
      description: "Replace text inside a post draft. The quote and replacement should be in markdown. Mode 'suggest' creates a tracked suggestion visible in the editor; mode 'edit' applies immediately.",
      inputSchema: {
        postId: z.string().describe("The ID of the post"),
        quote: z.string().describe("The text to find and replace"),
        replacement: z.string().describe("The replacement text in markdown"),
        mode: z.enum(["edit", "suggest"]).optional().describe("Whether to apply directly ('edit') or as a suggestion ('suggest'). Defaults to 'suggest'."),
      },
      annotations: { destructiveHint: true },
    },
    async (args, extra) => {
      const context = await contextFromAuth(extra);
      const token = await getHocuspocusToken(context, args.postId);

      const result = await replaceTextInMainDoc({
        postId: args.postId,
        token,
        quote: args.quote,
        replacement: args.replacement,
        mode: args.mode ?? "suggest",
      });

      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    },
  );

  server.registerTool(
    "insert_block",
    {
      description: "Insert new blocks of text into a post draft. The location specifies where to insert relative to existing content. The markdown parameter is the content to insert.",
      inputSchema: {
        postId: z.string().describe("The ID of the post"),
        markdown: z.string().describe("The markdown content to insert"),
        location: z.union([
          z.literal("start"),
          z.literal("end"),
          z.object({ before: z.string().describe("Insert before the paragraph starting with this text") }),
          z.object({ after: z.string().describe("Insert after the paragraph starting with this text") }),
        ]).describe("Where to insert: 'start', 'end', { before: '...' }, or { after: '...' }"),
        mode: z.enum(["edit", "suggest"]).optional().describe("Whether to apply directly ('edit') or as a suggestion ('suggest'). Defaults to 'edit'."),
      },
      annotations: { destructiveHint: true },
    },
    async (args, extra) => {
      const context = await contextFromAuth(extra);
      const token = await getHocuspocusToken(context, args.postId);

      const result = await insertMarkdownBlock({
        postId: args.postId,
        token,
        mode: args.mode ?? "edit",
        location: args.location,
        markdown: args.markdown,
      });

      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    },
  );

  return server;
}

export { createMcpServer };
