import { z } from "zod";
import { gql } from "@/lib/generated/gql-codegen";
import { runQuery } from "@/server/vulcan-lib/query";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { truncateMarkdown } from "@/server/markdownApi/markdownTruncation";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import uniq from "lodash/uniq";

interface ModerationAgentTool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  execute: (args: unknown, context: ResolverContext) => Promise<string>;
}

interface ModerationAgentToolSpec<S extends z.ZodObject<z.ZodRawShape>> {
  name: string;
  description: string;
  inputSchema: S;
  execute: (args: z.infer<S>, context: ResolverContext) => Promise<string>;
}

// Enforce the same access and argument contract for MCP and composed tool calls.
function defineModerationAgentTool<S extends z.ZodObject<z.ZodRawShape>>(spec: ModerationAgentToolSpec<S>): ModerationAgentTool {
  return {
    ...spec,
    execute: async (args, context) => {
      if (!userIsAdminOrMod(context.currentUser)) throw new Error("Moderator access required");
      const parsed = spec.inputSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(`Invalid arguments for ${spec.name}: ${parsed.error.message}`);
      }
      return spec.execute(parsed.data, context);
    },
  };
}

const CONTENT_EXCERPT_LENGTH = 13000;
const MESSAGE_EXCERPT_LENGTH = 2000;

interface BodyContents {
  html: string | null;
  version: string | null;
}

function getBodyExcerpt(contents: BodyContents | null | undefined, maxChars: number) {
  const markdown = contents?.html ? htmlToMarkdown(contents.html) : null;
  const excerpt = markdown === null ? null : truncateMarkdown(markdown, maxChars);
  return {
    bodyMarkdown: excerpt,
    bodyTruncated: excerpt !== markdown,
    bodyVersion: contents?.version ?? null,
  };
}

const AgentUserDossierQuery = gql(`
  query AgentUserDossier($userId: String!) {
    user(selector: { _id: $userId }) {
      result {
        ...SunshineUsersList
        ...UserClientIdsInfo
      }
    }
  }
`);

async function getUserDossier(userId: string, context: ResolverContext) {
  const { data } = await runQuery(AgentUserDossierQuery, { userId }, context);
  const user = data?.user?.result;
  if (!user) throw new Error("User not found or not accessible");
  const { htmlBio, ...rest } = user;
  return { ...rest, bioMarkdown: htmlBio ? htmlToMarkdown(htmlBio) : null };
}

const getUserDossierTool = defineModerationAgentTool({
  name: "get_user_dossier",
  description: "Fetch a user's full moderation dossier: karma, signup date, bio, email validation and reCaptcha signals, post/comment/vote counts, review-queue state (needsReview, review group, snooze), permission restrictions, active rate limits, recent karma info, rejected content count, moderator notes, moderator action history summary, and alt-account signals (client IDs shared with other accounts).",
  inputSchema: z.object({
    userId: z.string().describe("The _id of the user"),
  }),
  execute: async ({ userId }, context) => {
    return JSON.stringify(await getUserDossier(userId, context));
  },
});

const AgentClientIdsQuery = gql(`
  query AgentClientIds($userId: String!) {
    user(selector: { _id: $userId }) {
      result { ...UserClientIdsInfo }
    }
  }
`);

const AgentAltAccountsQuery = gql(`
  query AgentAltAccounts($userIds: [String!]!, $limit: Int!) {
    users(selector: { usersByUserIds: { userIds: $userIds } }, limit: $limit) {
      results {
        _id
        displayName
        slug
        karma
        banned
        deleted
        createdAt
      }
    }
  }
`);

const AgentIPAddressQuery = gql(`
  query AgentIPAddress($ipAddress: String!) {
    moderatorViewIPAddress(ipAddress: $ipAddress) {
      ip
      userIds
    }
  }
`);

async function getAltAccountsForClientIds(userId: string, clientIds: UserClientIdsInfo['associatedClientIds'], context: ResolverContext) {
  const sharedUserIds = uniq((clientIds ?? []).flatMap(clientId => clientId.userIds ?? []).filter(id => id !== userId));
  const accounts = sharedUserIds.length
    ? (await runQuery(AgentAltAccountsQuery, { userIds: sharedUserIds, limit: sharedUserIds.length }, context)).data?.users?.results ?? []
    : [];
  return { clientIds, accountsSharingClientIds: accounts };
}

const findAltAccountsTool = defineModerationAgentTool({
  name: "find_alt_accounts",
  description: "Look up possible alternate accounts. Given a userId, returns the client IDs (browser identifiers) associated with that user and accounts sharing them. Given an ipAddress (admins only), uses the moderator IP lookup to return associated account IDs.",
  inputSchema: z.object({
    userId: z.string().optional().describe("Find accounts sharing a browser client ID with this user"),
    ipAddress: z.string().optional().describe("Find accounts that have logged in from this IP address (admins only)"),
  }),
  execute: async ({ userId, ipAddress }, context) => {
    if (!userId && !ipAddress) {
      throw new Error("Provide userId or ipAddress");
    }

    const result: Record<string, unknown> = {};

    if (userId) {
      const { data } = await runQuery(AgentClientIdsQuery, { userId }, context);
      if (!data?.user?.result) throw new Error("User not found or not accessible");
      Object.assign(result, await getAltAccountsForClientIds(userId, data.user.result.associatedClientIds, context));
    }

    if (ipAddress) {
      const { data } = await runQuery(AgentIPAddressQuery, { ipAddress }, context);
      result.ipLookup = data?.moderatorViewIPAddress;
    }

    return JSON.stringify(result);
  },
});

const AgentUserPostsQuery = gql(`
  query AgentUserPosts($selector: PostSelector, $limit: Int, $includeBodies: Boolean!) {
    posts(selector: $selector, limit: $limit) {
      results {
        _id
        title
        postedAt
        baseScore
        voteCount
        draft
        frontpageDate
        rejected
        rejectedReason
        authorIsUnreviewed
        contents @include(if: $includeBodies) {
          ...RevisionHTML
          version
          wordCount
        }
        automatedContentEvaluations {
          ...AgentContentEvaluation
        }
      }
    }
  }
`);

const AgentUserCommentsQuery = gql(`
  query AgentUserComments($selector: CommentSelector, $limit: Int, $includeBodies: Boolean!) {
    comments(selector: $selector, limit: $limit) {
      results {
        _id
        postId
        post { _id title }
        postedAt
        baseScore
        voteCount
        deleted
        rejected
        rejectedReason
        authorIsUnreviewed
        contents @include(if: $includeBodies) {
          ...RevisionHTML
          version
        }
        automatedContentEvaluations {
          ...AgentContentEvaluation
        }
      }
    }
  }
`);

gql(`
  fragment AgentContentEvaluation on AutomatedContentEvaluation {
    _id
    pangramScore
    pangramPrediction
    pangramFractionAi
    aiChoice
  }
`);

const getUserContentTool = defineModerationAgentTool({
  name: "get_user_content",
  description: "Fetch a user's recent posts and comments as seen by moderators, including markdown excerpts, karma, rejection state, and Pangram scores. If bodyTruncated is true, use read_document_body with the document's _id, collectionName and bodyVersion to read the full body.",
  inputSchema: z.object({
    userId: z.string().describe("The _id of the user"),
    limit: z.number().int().min(1).max(50).optional().describe("Max posts and max comments to return (default 20 each)"),
    includeBodies: z.boolean().optional().describe("Include body text (default true). Set false for a lighter listing."),
  }),
  execute: async ({ userId, limit, includeBodies }, context) => {
    const contentLimit = limit ?? 20;
    const withBodies = includeBodies ?? true;

    const [postsResult, commentsResult] = await Promise.all([
      runQuery(AgentUserPostsQuery, { selector: { sunshineNewUsersPosts: { userId } }, limit: contentLimit, includeBodies: withBodies }, context),
      runQuery(AgentUserCommentsQuery, { selector: { sunshineNewUsersComments: { userId } }, limit: contentLimit, includeBodies: withBodies }, context),
    ]);

    const posts = (postsResult.data?.posts?.results ?? []).map((post) => ({
      _id: post._id,
      collectionName: "Posts",
      title: post.title,
      postedAt: post.postedAt,
      baseScore: post.baseScore,
      voteCount: post.voteCount,
      draft: post.draft,
      frontpageDate: post.frontpageDate,
      rejected: post.rejected,
      rejectedReason: post.rejectedReason,
      authorIsUnreviewed: post.authorIsUnreviewed,
      wordCount: post.contents?.wordCount,
      ...(withBodies ? getBodyExcerpt(post.contents, CONTENT_EXCERPT_LENGTH) : {}),
      aiEvaluation: post.automatedContentEvaluations,
    }));

    const comments = (commentsResult.data?.comments?.results ?? []).map((comment) => ({
      _id: comment._id,
      collectionName: "Comments",
      postId: comment.postId,
      postTitle: comment.post?.title,
      postedAt: comment.postedAt,
      baseScore: comment.baseScore,
      voteCount: comment.voteCount,
      deleted: comment.deleted,
      rejected: comment.rejected,
      rejectedReason: comment.rejectedReason,
      authorIsUnreviewed: comment.authorIsUnreviewed,
      ...(withBodies ? getBodyExcerpt(comment.contents, CONTENT_EXCERPT_LENGTH) : {}),
      aiEvaluation: comment.automatedContentEvaluations,
    }));

    return JSON.stringify({ posts, comments });
  },
});

const AgentPostBodyQuery = gql(`
  query AgentPostBody($documentId: String!, $version: String) {
    post(selector: { _id: $documentId }) {
      result {
        _id
        contents(version: $version) { ...RevisionHTML version }
      }
    }
  }
`);

const AgentCommentBodyQuery = gql(`
  query AgentCommentBody($documentId: String!, $version: String) {
    comment(selector: { _id: $documentId }) {
      result {
        _id
        contents(version: $version) { ...RevisionHTML version }
      }
    }
  }
`);

const AgentMessageBodyQuery = gql(`
  query AgentMessageBody($documentId: String!, $version: String) {
    message(selector: { _id: $documentId }) {
      result {
        _id
        conversationId
        contents(version: $version) { ...RevisionHTML version }
      }
    }
  }
`);

async function getDocumentBody(documentId: string, collectionName: "Posts" | "Comments" | "Messages", version: string | undefined, context: ResolverContext) {
  const variables = { documentId, version };
  if (collectionName === "Posts") {
    const { data } = await runQuery(AgentPostBodyQuery, variables, context);
    if (!data?.post?.result) throw new Error("Post not found or not accessible");
    return data.post.result.contents;
  }
  if (collectionName === "Comments") {
    const { data } = await runQuery(AgentCommentBodyQuery, variables, context);
    if (!data?.comment?.result) throw new Error("Comment not found or not accessible");
    return data.comment.result.contents;
  }
  const { data } = await runQuery(AgentMessageBodyQuery, variables, context);
  if (!data?.message?.result) throw new Error("Message not found or not accessible");
  const message = data.message.result;
  if (!message.conversationId) throw new Error("Message has no accessible conversation");
  await getModeratorConversation(message.conversationId, context);
  return message.contents;
}

const readDocumentBodyTool = defineModerationAgentTool({
  name: "read_document_body",
  description: "Read the canonical body of a post, comment, or moderator DM as markdown. Word offsets count whitespace-separated words and preserve the original formatting between them. Start at offsetWords 0, then pass nextOffsetWords to continue. Pass bodyVersion from an excerpt (or version from this result) to keep reading the same revision.",
  inputSchema: z.object({
    documentId: z.string().describe("The _id of the post, comment, or moderator message"),
    collectionName: z.enum(["Posts", "Comments", "Messages"]),
    version: z.string().optional().describe("Revision version returned by an earlier result; defaults to the document's current published contents"),
    offsetWords: z.number().int().min(0).optional().describe("Word offset to start from (default 0)"),
    maxWords: z.number().int().min(1).max(20000).optional().describe("Words to return (default 4000)"),
  }),
  execute: async ({ documentId, collectionName, version, offsetWords = 0, maxWords = 4000 }, context) => {
    const contents = await getDocumentBody(documentId, collectionName, version, context);
    const markdown = contents?.html ? htmlToMarkdown(contents.html) : "";
    const words = [...markdown.matchAll(/\S+/g)];
    const startWord = Math.min(offsetWords, words.length);
    const endWord = Math.min(startWord + maxWords, words.length);
    const startChar = startWord === 0 ? 0 : words[startWord]?.index ?? markdown.length;
    const endChar = words[endWord]?.index ?? markdown.length;
    const hasMore = endWord < words.length;
    return JSON.stringify({
      documentId,
      collectionName,
      version: contents?.version ?? null,
      totalWords: words.length,
      offsetWords: startWord,
      nextOffsetWords: hasMore ? endWord : null,
      hasMore,
      bodyMarkdown: contents?.html ? markdown.slice(startChar, endChar) : null,
    });
  },
});

const AgentModeratorActionsQuery = gql(`
  query AgentModeratorActions($selector: ModeratorActionSelector, $limit: Int!, $offset: Int!) {
    moderatorActions(selector: $selector, limit: $limit, offset: $offset, enableTotal: true) {
      results {
        _id
        type
        active
        createdAt
        endedAt
      }
      totalCount
    }
  }
`);

const getModeratorActionHistoryTool = defineModerationAgentTool({
  name: "get_moderator_action_history",
  description: "Fetch a page of ModeratorActions history for a user, newest first: rate limits, automated alerts, review-queue triggers, and past actions, with active state and dates. Pass nextOffset to continue through older history.",
  inputSchema: z.object({
    userId: z.string().describe("The _id of the user"),
    offset: z.number().int().min(0).optional().describe("History offset from nextOffset (default 0)"),
    limit: z.number().int().min(1).max(100).optional().describe("Actions to return (default 100)"),
  }),
  execute: async ({ userId, offset = 0, limit = 100 }, context) => {
    const { data } = await runQuery(
      AgentModeratorActionsQuery,
      { selector: { userModeratorActions: { userIds: [userId] } }, limit, offset },
      context
    );
    const page = data?.moderatorActions;
    if (!page || page.totalCount === null) throw new Error("Failed to load moderator action history");
    const hasMore = offset + page.results.length < page.totalCount;
    return JSON.stringify({
      moderatorActions: page.results,
      totalCount: page.totalCount,
      offset,
      nextOffset: hasMore ? offset + page.results.length : null,
      hasMore,
    });
  },
});

const AgentModerationTemplatesQuery = gql(`
  query AgentModerationTemplates($selector: ModerationTemplateSelector, $limit: Int) {
    moderationTemplates(selector: $selector, limit: $limit) {
      results {
        _id
        name
        groupLabel
        contents { ...RevisionHTML }
      }
    }
  }
`);

const listModerationTemplatesTool = defineModerationAgentTool({
  name: "list_moderation_templates",
  description: "List the moderation templates used for rejecting content (collectionName: Rejections) or messaging users (collectionName: Messages). Use these when drafting rejection reasons or moderator DMs so wording matches house style; reference a template's _id in proposal steps where applicable.",
  inputSchema: z.object({
    collectionName: z.enum(["Rejections", "Messages"]),
  }),
  execute: async ({ collectionName }, context) => {
    const { data } = await runQuery(
      AgentModerationTemplatesQuery,
      { selector: { moderationTemplatesList: { collectionName } }, limit: 100 },
      context
    );
    const templates = (data?.moderationTemplates?.results ?? [])
      .map((template) => ({
        _id: template._id,
        name: template.name,
        groupLabel: template.groupLabel,
        // HTML (not markdown): directly reusable in rejectedReason/messageHtml
        contentsHtml: template.contents?.html,
      }));
    return JSON.stringify({ templates });
  },
});

const AgentReviewQueueQuery = gql(`
  query AgentReviewQueue($limit: Int!) {
    users: supermodQueueUsers(limit: $limit) {
      results {
        _id
        displayName
        slug
        karma
        createdAt
        postCount
        commentCount
        reviewGroup
        rejectedContentCount
      }
    }
  }
`);

const listReviewQueueTool = defineModerationAgentTool({
  name: "list_review_queue",
  description: "List users currently awaiting moderator review, with karma, content counts, review group, and rejected content counts. Useful for surveying the queue or grouping similar users.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(200).optional().describe("Max users to return (default 50)"),
  }),
  execute: async ({ limit }, context) => {
    const { data } = await runQuery(AgentReviewQueueQuery, { limit: limit ?? 50 }, context);
    return JSON.stringify({ users: data?.users?.results ?? [] });
  },
});

const AgentModeratorConversationsQuery = gql(`
  query AgentModeratorConversations($userId: String!, $limit: Int!, $offset: Int!) {
    conversations(selector: { moderatorConversations: { userId: $userId, showArchive: true } }, limit: $limit, offset: $offset, enableTotal: true) {
      results {
        _id
        title
        createdAt
        latestActivity
      }
      totalCount
    }
  }
`);

const AgentModeratorConversationQuery = gql(`
  query AgentModeratorConversation($conversationId: String!) {
    conversation(selector: { _id: $conversationId }) {
      result {
        _id
        moderator
      }
    }
  }
`);

async function getModeratorConversation(conversationId: string, context: ResolverContext) {
  const { data } = await runQuery(AgentModeratorConversationQuery, { conversationId }, context);
  const conversation = data?.conversation?.result;
  if (!conversation?.moderator) throw new Error("Moderator conversation not found or not accessible");
  return conversation;
}

const AgentModeratorMessagesQuery = gql(`
  query AgentModeratorMessages($conversationId: String!, $limit: Int!, $offset: Int!) {
    messages(selector: { conversationPreview: { conversationId: $conversationId } }, limit: $limit, offset: $offset, enableTotal: true) {
      results {
        _id
        userId
        user { _id displayName }
        createdAt
        contents { ...RevisionHTML version }
      }
      totalCount
    }
  }
`);

async function getModeratorMessages(conversationId: string, offset: number, limit: number, context: ResolverContext) {
  const { data } = await runQuery(AgentModeratorMessagesQuery, { conversationId, offset, limit }, context);
  const page = data?.messages;
  if (!page || page.totalCount === null) throw new Error("Failed to load moderator messages");
  const hasMore = offset + page.results.length < page.totalCount;
  return {
    conversationId,
    totalCount: page.totalCount,
    offset,
    nextOffset: hasMore ? offset + page.results.length : null,
    hasMore,
    // Fetch newest first, but display each page in conversational order.
    messages: [...page.results].reverse().map(message => ({
      _id: message._id,
      collectionName: "Messages",
      userId: message.userId,
      author: message.user?.displayName ?? message.userId,
      createdAt: message.createdAt,
      ...getBodyExcerpt(message.contents, MESSAGE_EXCERPT_LENGTH),
    })),
  };
}

const getModeratorDmsTool = defineModerationAgentTool({
  name: "get_moderator_dms",
  description: "Fetch moderator conversations with a user, most recently active first, including archived conversations and the latest 10 message excerpts in each. Pass nextOffset to fetch older conversations. Use get_moderator_dm_messages with a conversation's _id and nextOffset to fetch older messages; use read_document_body for any bodyTruncated message.",
  inputSchema: z.object({
    userId: z.string().describe("The _id of the user"),
    offset: z.number().int().min(0).optional().describe("Conversation offset from nextOffset (default 0)"),
    limit: z.number().int().min(1).max(20).optional().describe("Conversations to return (default 20)"),
  }),
  execute: async ({ userId, offset = 0, limit = 20 }, context) => {
    const { data } = await runQuery(AgentModeratorConversationsQuery, { userId, offset, limit }, context);
    const page = data?.conversations;
    if (!page || page.totalCount === null) throw new Error("Failed to load moderator conversations");
    const conversations = await Promise.all(page.results.map(async conversation => ({
      ...conversation,
      ...await getModeratorMessages(conversation._id, 0, 10, context),
    })));
    const hasMore = offset + page.results.length < page.totalCount;
    return JSON.stringify({
      conversations,
      totalCount: page.totalCount,
      offset,
      nextOffset: hasMore ? offset + page.results.length : null,
      hasMore,
    });
  },
});

const getModeratorDmMessagesTool = defineModerationAgentTool({
  name: "get_moderator_dm_messages",
  description: "Read a page of messages from a moderator conversation. Pages start with the newest messages and each page is displayed chronologically. Pass nextOffset to read older messages. For a bodyTruncated excerpt, use read_document_body with its _id, collectionName Messages, and bodyVersion.",
  inputSchema: z.object({
    conversationId: z.string().describe("The moderator conversation's _id"),
    offset: z.number().int().min(0).optional().describe("Message offset from nextOffset (default 0)"),
    limit: z.number().int().min(1).max(200).optional().describe("Messages to return (default 20)"),
  }),
  execute: async ({ conversationId, offset = 0, limit = 20 }, context) => {
    await getModeratorConversation(conversationId, context);
    return JSON.stringify(await getModeratorMessages(conversationId, offset, limit, context));
  },
});

const getFullUserContextTool = defineModerationAgentTool({
  name: "get_full_user_context",
  description: "Fetch a user's moderation context in one call: dossier with moderator action history, alt-account signals, recent posts and comments, recent moderator DM excerpts with continuation offsets, and rejection and message templates. Prefer it over the individual read tools unless you need just one piece. Use the body and DM tools to continue truncated results.",
  inputSchema: z.object({
    userId: z.string().describe("The _id of the user"),
  }),
  execute: async ({ userId }, context) => {
    const [
      dossier, contentJson, dmsJson,
      rejectionTemplatesJson, messageTemplatesJson,
    ] = await Promise.all([
      getUserDossier(userId, context),
      getUserContentTool.execute({ userId }, context),
      getModeratorDmsTool.execute({ userId }, context),
      listModerationTemplatesTool.execute({ collectionName: "Rejections" }, context),
      listModerationTemplatesTool.execute({ collectionName: "Messages" }, context),
    ]);
    const altAccounts = await getAltAccountsForClientIds(userId, dossier.associatedClientIds, context);

    return `## Target user dossier (including moderator action history)
${JSON.stringify(dossier)}

## Alt-account signals (client IDs and accounts sharing them)
${JSON.stringify(altAccounts)}

## Target user's posts and comments (with bodies)
${contentJson}

## Recent moderator DM conversations with this user (with continuation offsets)
${dmsJson}

## Rejection templates
${rejectionTemplatesJson}

## Moderator message templates
${messageTemplatesJson}`;
  },
});

export const moderationReadTools = [
  getFullUserContextTool,
  readDocumentBodyTool,
  getUserDossierTool,
  findAltAccountsTool,
  getUserContentTool,
  getModeratorActionHistoryTool,
  listModerationTemplatesTool,
  listReviewQueueTool,
  getModeratorDmsTool,
  getModeratorDmMessagesTool,
];
