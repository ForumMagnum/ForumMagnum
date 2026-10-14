import { z } from "zod";
import { gql } from "@/lib/generated/gql-codegen";
import { runQuery } from "@/server/vulcan-lib/query";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { getLatestRev } from "@/server/editor/utils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import uniq from "lodash/uniq";
import { defineModerationAgentTool, requireModeratorAccess } from "./types";

const MAX_BODY_MARKDOWN_LENGTH = 2000;

// Truncates by characters (words × CHARS_PER_WORD) so markdown formatting survives intact
const MAX_BODY_WORDS = 2000;
const CHARS_PER_WORD = 6.5;

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function sliceAtWordBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastWhitespace = slice.search(/\s\S*$/);
  return lastWhitespace > 0 ? slice.slice(0, lastWhitespace) : slice;
}

function truncateMarkdown(html: string | null | undefined, maxLength = MAX_BODY_MARKDOWN_LENGTH): string | null {
  if (!html) return null;
  const markdown = htmlToMarkdown(html);
  if (markdown.length <= maxLength) {
    return markdown;
  }
  return `${markdown.slice(0, maxLength)}\n\n[... truncated, ${markdown.length} chars total]`;
}

function truncateMarkdownWords(html: string | null | undefined, maxWords = MAX_BODY_WORDS): string | null {
  if (!html) return null;
  const markdown = htmlToMarkdown(html);
  const maxChars = Math.round(maxWords * CHARS_PER_WORD);
  if (markdown.length <= maxChars) {
    return markdown;
  }
  const shown = sliceAtWordBoundary(markdown, maxChars);
  return `${shown}\n\n[Truncated: showing roughly the first ${maxWords} of ${countWords(markdown)} words. Use read_document_body to read the rest.]`;
}

const AgentUserDossierQuery = gql(`
  query AgentUserDossier($userId: String!) {
    user(selector: { _id: $userId }) {
      result {
        ...SunshineUsersList
        associatedClientIds {
          clientId
          firstSeenReferrer
          firstSeenLandingPage
          userIds
        }
        altAccountsDetected
      }
    }
  }
`);

export const getUserDossierTool = defineModerationAgentTool({
  name: "get_user_dossier",
  description: "Fetch a user's full moderation dossier: karma, signup date, bio, email validation and reCaptcha signals, post/comment/vote counts, review-queue state (needsReview, review group, snooze), permission restrictions, active rate limits, recent karma info, rejected content count, moderator notes, moderator action history summary, and alt-account signals (client IDs shared with other accounts).",
  inputSchema: z.object({
    userId: z.string().describe("The _id of the user"),
  }),
  execute: async ({ userId }, context) => {
    requireModeratorAccess(context);
    const { data } = await runQuery(AgentUserDossierQuery, { userId }, context);
    const user = data?.user?.result;
    if (!user) {
      return JSON.stringify({ error: "User not found or not accessible" });
    }
    const { htmlBio, ...rest } = user;
    return JSON.stringify({
      ...rest,
      bioMarkdown: truncateMarkdown(htmlBio),
    });
  },
});

export const findAltAccountsTool = defineModerationAgentTool({
  name: "find_alt_accounts",
  description: "Look up possible alternate accounts. Given a userId, returns the client IDs (browser identifiers) associated with that user and every other account sharing any of them. Given an ipAddress (admins only), returns all accounts that have logged in from that IP.",
  inputSchema: z.object({
    userId: z.string().optional().describe("Find accounts sharing a browser client ID with this user"),
    ipAddress: z.string().optional().describe("Find accounts that have logged in from this IP address (admins only)"),
  }),
  execute: async ({ userId, ipAddress }, context) => {
    const currentUser = requireModeratorAccess(context);
    if (!userId && !ipAddress) {
      return JSON.stringify({ error: "Provide userId or ipAddress" });
    }

    const result: Record<string, unknown> = {};

    if (userId) {
      const [clientIds] = await context.repos.clientIds.getClientIdsForUsers([userId]);
      const sharedUserIds = uniq(
        (clientIds ?? []).flatMap((clientId) => clientId.userIds ?? []).filter((id) => id !== userId)
      );
      const sharedUsers = sharedUserIds.length
        ? await context.Users.find(
            { _id: { $in: sharedUserIds } },
            {},
            { _id: 1, displayName: 1, slug: 1, karma: 1, banned: 1, deleted: 1, createdAt: 1 }
          ).fetch()
        : [];
      result.clientIds = (clientIds ?? []).map((clientId) => ({
        clientId: clientId.clientId,
        firstSeenReferrer: clientId.firstSeenReferrer,
        firstSeenLandingPage: clientId.firstSeenLandingPage,
        userIds: clientId.userIds,
      }));
      result.accountsSharingClientIds = sharedUsers;
    }

    if (ipAddress) {
      // IP information is deliberately admin-only, matching moderatorViewIPAddress
      if (!userIsAdmin(currentUser)) {
        result.ipLookup = { error: "IP address lookups are only available to admins" };
      } else {
        const loginEvents = await context.LWEvents.find(
          { name: "login", "properties.ip": ipAddress },
          { limit: 100 },
          { userId: 1 }
        ).fetch();
        result.ipLookup = { ip: ipAddress, userIds: uniq(loginEvents.map((event) => event.userId)) };
      }
    }

    return JSON.stringify(result);
  },
});

const AgentUserPostsQuery = gql(`
  query AgentUserPosts($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit) {
      results {
        ...SunshinePostsList
      }
    }
  }
`);

const AgentUserCommentsQuery = gql(`
  query AgentUserComments($selector: CommentSelector, $limit: Int) {
    comments(selector: $selector, limit: $limit) {
      results {
        ...SunshineCommentsList
      }
    }
  }
`);

interface AgentContentEvaluation {
  pangramScore?: number | null;
  pangramPrediction?: string | null;
  pangramFractionAi?: number | null;
  aiChoice?: string | null;
}

function summarizeEvaluation(evaluation: AgentContentEvaluation | null | undefined) {
  if (!evaluation) return null;
  return {
    pangramScore: evaluation.pangramScore,
    pangramPrediction: evaluation.pangramPrediction,
    pangramFractionAi: evaluation.pangramFractionAi,
    aiChoice: evaluation.aiChoice,
  };
}

export const getUserContentTool = defineModerationAgentTool({
  name: "get_user_content",
  description: "Fetch a user's recent posts and comments as seen by moderators, including body text (markdown, truncated), karma, rejection state, and AI-writing-detection (Pangram) scores.",
  inputSchema: z.object({
    userId: z.string().describe("The _id of the user"),
    limit: z.number().int().min(1).max(50).optional().describe("Max posts and max comments to return (default 20 each)"),
    includeBodies: z.boolean().optional().describe("Include body text (default true). Set false for a lighter listing."),
  }),
  execute: async ({ userId, limit, includeBodies }, context) => {
    requireModeratorAccess(context);
    const contentLimit = limit ?? 20;
    const withBodies = includeBodies ?? true;

    const [postsResult, commentsResult] = await Promise.all([
      runQuery(AgentUserPostsQuery, { selector: { sunshineNewUsersPosts: { userId } }, limit: contentLimit }, context),
      runQuery(AgentUserCommentsQuery, { selector: { sunshineNewUsersComments: { userId } }, limit: contentLimit }, context),
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
      bodyMarkdown: withBodies ? truncateMarkdownWords(post.contents?.html) : undefined,
      aiEvaluation: summarizeEvaluation(post.automatedContentEvaluations),
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
      bodyMarkdown: withBodies ? truncateMarkdownWords(comment.contents?.html) : undefined,
      aiEvaluation: summarizeEvaluation(comment.automatedContentEvaluations),
    }));

    return JSON.stringify({ posts, comments });
  },
});

export const readDocumentBodyTool = defineModerationAgentTool({
  name: "read_document_body",
  description: "Read a post or comment body beyond the truncated excerpt in context. Returns a window of the body as markdown, with the true total word count; call again with a higher offsetWords to continue reading.",
  inputSchema: z.object({
    documentId: z.string().describe("The _id of the post or comment"),
    collectionName: z.enum(["Posts", "Comments"]),
    offsetWords: z.number().int().min(0).optional().describe("Word offset to start from (default 0)"),
    maxWords: z.number().int().min(1).max(20000).optional().describe("Words to return (default 4000)"),
  }),
  execute: async ({ documentId, collectionName, offsetWords, maxWords }, context) => {
    requireModeratorAccess(context);
    const document = collectionName === "Posts"
      ? await context.Posts.findOne({ _id: documentId })
      : await context.Comments.findOne({ _id: documentId });
    if (!document) {
      throw new Error(`Document ${documentId} (${collectionName}) not found`);
    }
    const revision = await getLatestRev(documentId, "contents", context);
    const html = revision?.html;
    if (!html) {
      return JSON.stringify({ documentId, totalWords: 0, bodyMarkdown: null });
    }
    const markdown = htmlToMarkdown(html);
    const startChar = Math.min(markdown.length, Math.round((offsetWords ?? 0) * CHARS_PER_WORD));
    const endChar = Math.min(markdown.length, startChar + Math.round((maxWords ?? 4000) * CHARS_PER_WORD));
    return JSON.stringify({
      documentId,
      collectionName,
      totalWords: countWords(markdown),
      approxOffsetWords: Math.round(startChar / CHARS_PER_WORD),
      approxEndWord: Math.round(endChar / CHARS_PER_WORD),
      hasMore: endChar < markdown.length,
      bodyMarkdown: markdown.slice(startChar, endChar),
    });
  },
});

const AgentModeratorActionsQuery = gql(`
  query AgentModeratorActions($selector: ModeratorActionSelector, $limit: Int) {
    moderatorActions(selector: $selector, limit: $limit) {
      results {
        _id
        type
        active
        createdAt
        endedAt
      }
    }
  }
`);

export const getModeratorActionHistoryTool = defineModerationAgentTool({
  name: "get_moderator_action_history",
  description: "Fetch the full ModeratorActions history for a user: rate limits, automated karma/voting/DM alerts, review-queue triggers, and records of past moderator actions (rejections, messages sent, etc), with active state and dates.",
  inputSchema: z.object({
    userId: z.string().describe("The _id of the user"),
  }),
  execute: async ({ userId }, context) => {
    requireModeratorAccess(context);
    const { data } = await runQuery(
      AgentModeratorActionsQuery,
      { selector: { userModeratorActions: { userIds: [userId] } }, limit: 100 },
      context
    );
    return JSON.stringify({ moderatorActions: data?.moderatorActions?.results ?? [] });
  },
});

const AgentModerationTemplatesQuery = gql(`
  query AgentModerationTemplates($selector: ModerationTemplateSelector, $limit: Int) {
    moderationTemplates(selector: $selector, limit: $limit) {
      results {
        ...ModerationTemplateFragment
      }
    }
  }
`);

export const listModerationTemplatesTool = defineModerationAgentTool({
  name: "list_moderation_templates",
  description: "List the moderation templates used for rejecting content (collectionName: Rejections) or messaging users (collectionName: Messages). Use these when drafting rejection reasons or moderator DMs so wording matches house style; reference a template's _id in proposal steps where applicable.",
  inputSchema: z.object({
    collectionName: z.enum(["Rejections", "Messages"]),
  }),
  execute: async ({ collectionName }, context) => {
    requireModeratorAccess(context);
    const { data } = await runQuery(
      AgentModerationTemplatesQuery,
      { selector: { moderationTemplatesList: { collectionName } }, limit: 100 },
      context
    );
    const templates = (data?.moderationTemplates?.results ?? [])
      .filter((template) => !template.deleted)
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
  query AgentReviewQueue($limit: Int) {
    users(selector: { sunshineNewUsers: {} }, limit: $limit) {
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

export const listReviewQueueTool = defineModerationAgentTool({
  name: "list_review_queue",
  description: "List users currently awaiting moderator review, with karma, content counts, review group, and rejected content counts. Useful for surveying the queue or grouping similar users.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(200).optional().describe("Max users to return (default 50)"),
  }),
  execute: async ({ limit }, context) => {
    requireModeratorAccess(context);
    const { data } = await runQuery(AgentReviewQueueQuery, { limit: limit ?? 50 }, context);
    return JSON.stringify({ users: data?.users?.results ?? [] });
  },
});

export const getModeratorDmsTool = defineModerationAgentTool({
  name: "get_moderator_dms",
  description: "Fetch the moderator DM conversations with a user, including full message text: what the moderation team has told them and how they replied.",
  inputSchema: z.object({
    userId: z.string().describe("The _id of the user"),
  }),
  execute: async ({ userId }, context) => {
    requireModeratorAccess(context);
    const conversations = await context.Conversations.find(
      { participantIds: userId, moderator: true },
      { sort: { createdAt: 1 }, limit: 20 }
    ).fetch();
    if (!conversations.length) {
      return JSON.stringify({ conversations: [] });
    }
    const conversationIds = conversations.map((conversation) => conversation._id);
    const messages = await context.Messages.find(
      { conversationId: { $in: conversationIds } },
      { sort: { createdAt: 1 }, limit: 200 }
    ).fetch();
    const authorIds = uniq(messages.map((message) => message.userId));
    const authors = await context.Users.find(
      { _id: { $in: authorIds } },
      {},
      { _id: 1, displayName: 1 }
    ).fetch();
    const authorNamesById = new Map(authors.map((author) => [author._id, author.displayName]));
    return JSON.stringify({
      conversations: conversations.map((conversation) => ({
        _id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        messages: messages
          .filter((message) => message.conversationId === conversation._id)
          .map((message) => ({
            author: authorNamesById.get(message.userId) ?? message.userId,
            isTargetUser: message.userId === userId,
            createdAt: message.createdAt,
            bodyMarkdown: truncateMarkdown(message.contents?.html),
          })),
      })),
    });
  },
});

function errorAsToolResult(promise: Promise<string>): Promise<string> {
  return promise.catch((error: Error) => JSON.stringify({ error: error.message }));
}

export async function buildModerationContextForUser(userId: string, context: ResolverContext): Promise<string> {
  const [
    dossierJson, altAccountsJson, contentJson, historyJson, dmsJson,
    rejectionTemplatesJson, messageTemplatesJson,
  ] = await Promise.all([
    errorAsToolResult(getUserDossierTool.execute({ userId }, context)),
    errorAsToolResult(findAltAccountsTool.execute({ userId }, context)),
    errorAsToolResult(getUserContentTool.execute({ userId }, context)),
    errorAsToolResult(getModeratorActionHistoryTool.execute({ userId }, context)),
    errorAsToolResult(getModeratorDmsTool.execute({ userId }, context)),
    errorAsToolResult(listModerationTemplatesTool.execute({ collectionName: "Rejections" }, context)),
    errorAsToolResult(listModerationTemplatesTool.execute({ collectionName: "Messages" }, context)),
  ]);

  return `## Target user dossier
${dossierJson}

## Alt-account signals (client IDs and accounts sharing them)
${altAccountsJson}

## Target user's posts and comments (with bodies)
${contentJson}

## Moderator action history
${historyJson}

## Moderator DM conversations with this user
${dmsJson}

## Rejection templates
${rejectionTemplatesJson}

## Moderator message templates
${messageTemplatesJson}`;
}

export const getFullUserContextTool = defineModerationAgentTool({
  name: "get_full_user_context",
  description: "Fetch a user's complete moderation context in one call: dossier, alt-account signals, posts and comments with bodies, moderator action history, moderator DM text, and rejection and message templates. Prefer it over the individual read tools unless you need just one piece.",
  inputSchema: z.object({
    userId: z.string().describe("The _id of the user"),
  }),
  execute: async ({ userId }, context) => {
    requireModeratorAccess(context);
    return buildModerationContextForUser(userId, context);
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
];
