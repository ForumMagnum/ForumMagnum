import React from "react";
import { MarkdownDate } from "./MarkdownDate";
import { MarkdownNode } from "./MarkdownNode";
import { MarkdownUserLink } from "./MarkdownUserLink";

export interface MarkdownCommentData {
  _id: string
  parentCommentId?: string | null
  postedAt: string | Date
  baseScore?: number | null
  voteCount?: number | null
  votingSystem?: string | null
  extendedScore?: {
    approvalVoteCount?: number
    reacts?: Record<string, Array<{
      userId: string
      displayName?: string | null
      reactType: "created" | "seconded" | "disagreed"
      quotes?: string[]
    }>>
  } | null
  user: UsersMinimumInfo | null
  contents?: {
    agentMarkdown?: string | null
    plaintextMainText?: string | null
  } | null
}

interface AggregatedReactionInfo {
  netCount: number
  users: string[]
}

const REACTION_WEIGHTS = {
  created: 1,
  seconded: 1,
  disagreed: -1,
} as const;

const truncateForDisplay = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trimEnd()}...`;
};

const aggregateCommentReactions = (comment: MarkdownCommentData): {
  wholeCommentReactions: Record<string, AggregatedReactionInfo>
  quoteReactions: Record<string, Record<string, AggregatedReactionInfo>>
} => {
  const wholeCommentReactions: Record<string, AggregatedReactionInfo> = {};
  const quoteReactions: Record<string, Record<string, AggregatedReactionInfo>> = {};
  const reacts = comment.extendedScore?.reacts ?? {};

  for (const [reactionName, reactions] of Object.entries(reacts)) {
    for (const reaction of reactions ?? []) {
      const delta = REACTION_WEIGHTS[reaction.reactType] ?? 0;
      const displayName = reaction.displayName?.trim() || reaction.userId;
      const quotes = reaction.quotes ?? [];
      if (quotes.length > 0) {
        for (const quote of quotes) {
          if (!quoteReactions[quote]) {
            quoteReactions[quote] = {};
          }
          if (!quoteReactions[quote][reactionName]) {
            quoteReactions[quote][reactionName] = { netCount: 0, users: [] };
          }
          quoteReactions[quote][reactionName]!.netCount += delta;
          quoteReactions[quote][reactionName]!.users.push(displayName);
        }
      } else {
        if (!wholeCommentReactions[reactionName]) {
          wholeCommentReactions[reactionName] = { netCount: 0, users: [] };
        }
        wholeCommentReactions[reactionName]!.netCount += delta;
        wholeCommentReactions[reactionName]!.users.push(displayName);
      }
    }
  }

  return { wholeCommentReactions, quoteReactions };
};

const renderReactionSummary = (
  reactions: Record<string, AggregatedReactionInfo>,
  includeReactionUsers: boolean
): React.ReactNode => {
  const entries = Object.entries(reactions).filter(([, info]) => info.netCount > 0);
  if (entries.length === 0) {
    return null;
  }
  const sorted = entries.sort((a, b) => b[1].netCount - a[1].netCount);
  return (
    <ul>
      {sorted.map(([reactionName, info]) => (
        <li key={reactionName}>
          {reactionName}: {info.netCount}
          {includeReactionUsers && info.users.length > 0
            ? ` (${Array.from(new Set(info.users)).join(", ")})`
            : ""}
        </li>
      ))}
    </ul>
  );
};

const truncatePlaintext = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trimEnd()}...`;
};

const getCommentBodyMarkdown = (comment: MarkdownCommentData): string => {
  const markdown = comment.contents?.agentMarkdown?.trim();
  if (markdown) {
    return markdown;
  }
  const plaintext = comment.contents?.plaintextMainText?.trim() ?? "";
  if (!plaintext) {
    return "_[No comment body available]_";
  }
  return truncatePlaintext(plaintext, 600);
};

const computeDepth = (
  comment: MarkdownCommentData,
  commentsById: Map<string, MarkdownCommentData>,
  memoizedDepth: Map<string, number>
): number => {
  const memoized = memoizedDepth.get(comment._id);
  if (memoized !== undefined) {
    return memoized;
  }
  const parentId = comment.parentCommentId;
  if (!parentId) {
    memoizedDepth.set(comment._id, 0);
    return 0;
  }
  const parent = commentsById.get(parentId);
  if (!parent) {
    memoizedDepth.set(comment._id, 0);
    return 0;
  }
  const depth = Math.min(computeDepth(parent, commentsById, memoizedDepth) + 1, 6);
  memoizedDepth.set(comment._id, depth);
  return depth;
};

export const MarkdownCommentsList = ({
  comments,
  includeBodies = true,
  includeReactionUsers = false,
  markdownRouteBase,
  htmlRouteBase,
}: {
  comments: MarkdownCommentData[]
  includeBodies?: boolean
  includeReactionUsers?: boolean
  markdownRouteBase: string
  htmlRouteBase: string
}) => {
  const commentsById = new Map(comments.map((comment) => [comment._id, comment]));
  const memoizedDepth = new Map<string, number>();

  return (
    <div>
      {comments.map((comment) => {
        const depth = computeDepth(comment, commentsById, memoizedDepth);
        const { wholeCommentReactions, quoteReactions } = aggregateCommentReactions(comment);
        const approvalVoteCount = comment.extendedScore?.approvalVoteCount;
        return (
          <div key={comment._id}>
            <h3 id={`comment-${comment._id}`}>
              Comment by <MarkdownUserLink user={comment.user} />
            </h3>
            <ul>
              <li><MarkdownDate date={comment.postedAt} /></li>
              <li>Karma: {comment.baseScore ?? 0}</li>
              {comment.votingSystem ? <li>Voting system: {comment.votingSystem}</li> : null}
              {approvalVoteCount !== undefined ? <li>Approval votes: {approvalVoteCount}</li> : null}
              {comment.voteCount !== undefined && comment.voteCount !== null ? <li>Total votes: {comment.voteCount}</li> : null}
              {depth > 0 ? <li>Reply depth: {depth}</li> : null}
              <li>
                HTML permalink:{" "}
                <a href={`${htmlRouteBase}/${comment._id}`}>{`${htmlRouteBase}/${comment._id}`}</a>
              </li>
              <li>
                Markdown permalink:{" "}
                <a href={`${markdownRouteBase}/${comment._id}`}>{`${markdownRouteBase}/${comment._id}`}</a>
              </li>
            </ul>
            {Object.keys(wholeCommentReactions).length > 0 ? (
              <div>
                <div>Reactions (whole comment):</div>
                {renderReactionSummary(wholeCommentReactions, includeReactionUsers)}
              </div>
            ) : null}
            {Object.keys(quoteReactions).length > 0 ? (
              <div>
                <div>Reactions by quoted text:</div>
                <ul>
                  {Object.entries(quoteReactions).map(([quote, reactions]) => (
                    <li key={quote}>
                      <div>"{truncateForDisplay(quote.replaceAll("\n", " "), 180)}"</div>
                      {renderReactionSummary(reactions, includeReactionUsers)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {includeBodies ? (
              <MarkdownNode markdown={getCommentBodyMarkdown(comment)} indentLevel={Math.min(depth + 1, 6)} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
