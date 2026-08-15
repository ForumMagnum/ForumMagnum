import maxBy from "lodash/maxBy";
import {
  FLAGGED_FOR_N_DMS,
  AUTO_BLOCKED_FROM_SENDING_DMS,
  RECENTLY_DOWNVOTED_CONTENT_ALERT,
  SENT_MODERATOR_MESSAGE,
  LOW_AVERAGE_KARMA_COMMENT_ALERT,
  LOW_AVERAGE_KARMA_POST_ALERT,
} from "@/lib/collections/moderatorActions/constants";
import { areAllContentPermissionsDisabled, isPost, type ContentItem } from "./helpers";
import { getFirstParagraphLength, getLetters, getNonLatinLetterRatio, getPlaintext } from "./contentTextHelpers";

/**
 * The vocabulary that editable highlight rules are written against: named properties of a
 * user, of their content, or (for rejection templates) of the content the moderator has
 * selected.
 *
 * A signal can be computed by arbitrary code — what makes a rule "straightforward" enough to
 * live in the editor is that the *rule* is just a comparison against one of these. Rules that
 * need more than that (regexes over content, duplicate detection) stay as code predicates in
 * templateHighlightRules.ts.
 *
 * A numeric signal returning null means "no value here", and any condition on it fails. That's
 * what keeps the LLM-score rules from firing on content that was never scored.
 */

export interface HighlightSignalContext {
  user: SunshineUsersList;
  moderatorActions: ModeratorActionDisplay[];
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
  /** Only set when evaluating rejection-template rules */
  focusedContent: ContentItem | null;
}

export const highlightSignalGroups = ['User', 'Content', 'LLM detection', 'Moderator actions', 'Selected content'] as const;

export type HighlightSignalGroup = typeof highlightSignalGroups[number];

interface HighlightSignalBase {
  label: string;
  description?: string;
  group: HighlightSignalGroup;
  /** 'focusedContent' signals are only meaningful for rejection templates */
  scope: 'user' | 'focusedContent';
}

export interface NumericHighlightSignal extends HighlightSignalBase {
  type: 'number';
  compute: (ctx: HighlightSignalContext) => number | null;
}

export interface BooleanHighlightSignal extends HighlightSignalBase {
  type: 'boolean';
  compute: (ctx: HighlightSignalContext) => boolean;
}

export type HighlightSignal = NumericHighlightSignal | BooleanHighlightSignal;

/** Pangram scores at or above this count as "looks LLM-written" for the counting signals */
export const HIGH_PANGRAM_SCORE = 0.2;

const allContents = (ctx: HighlightSignalContext): ContentItem[] => [...ctx.posts, ...ctx.comments];

const isUnapproved = (content: ContentItem) => !content.rejected && content.authorIsUnreviewed;

const isApproved = (content: ContentItem) => !content.rejected && !content.authorIsUnreviewed;

const getPangramScore = (content: ContentItem) => content.automatedContentEvaluations?.pangramScore ?? null;

const averageBaseScore = (contents: ContentItem[]): number => {
  if (contents.length === 0) return 0;
  return contents.reduce((sum, content) => sum + (content.baseScore ?? 0), 0) / contents.length;
};

const countActiveActionsOfTypes = (ctx: HighlightSignalContext, types: string[]) =>
  ctx.moderatorActions.filter(action => action.active && types.includes(action.type)).length;

const maxOrNull = (values: number[]): number | null => (values.length === 0 ? null : Math.max(...values));

const minOrNull = (values: number[]): number | null => (values.length === 0 ? null : Math.min(...values));

const focusedNumber = (
  ctx: HighlightSignalContext,
  compute: (content: ContentItem) => number | null,
): number | null => (ctx.focusedContent ? compute(ctx.focusedContent) : null);

const HIGHLIGHT_SIGNAL_DEFINITIONS = {
  userKarma: {
    type: 'number', scope: 'user', group: 'User',
    label: "User karma",
    compute: ctx => ctx.user.karma,
  },
  userRejectedContentCount: {
    type: 'number', scope: 'user', group: 'User',
    label: "Lifetime rejected content count",
    description: "The user's rejectedContentCount field, which counts rejections beyond the content loaded in the inbox",
    compute: ctx => ctx.user.rejectedContentCount ?? 0,
  },
  conversationsDisabled: {
    type: 'boolean', scope: 'user', group: 'User',
    label: "Messaging is already disabled",
    compute: ctx => !!ctx.user.conversationsDisabled,
  },
  allContentPermissionsDisabled: {
    type: 'boolean', scope: 'user', group: 'User',
    label: "All content permissions are already disabled",
    description: "Posting, commenting, messaging and voting are all disabled",
    compute: ctx => areAllContentPermissionsDisabled(ctx.user),
  },
  contentCount: {
    type: 'number', scope: 'user', group: 'Content',
    label: "Content items (posts + comments)",
    compute: ctx => allContents(ctx).length,
  },
  postCount: {
    type: 'number', scope: 'user', group: 'Content',
    label: "Posts",
    compute: ctx => ctx.posts.length,
  },
  commentCount: {
    type: 'number', scope: 'user', group: 'Content',
    label: "Comments",
    compute: ctx => ctx.comments.length,
  },
  unapprovedContentCount: {
    type: 'number', scope: 'user', group: 'Content',
    label: "Unapproved content items",
    description: "Not rejected, and the author is still unreviewed — i.e. awaiting a decision",
    compute: ctx => allContents(ctx).filter(isUnapproved).length,
  },
  approvedContentCount: {
    type: 'number', scope: 'user', group: 'Content',
    label: "Approved content items",
    compute: ctx => allContents(ctx).filter(isApproved).length,
  },
  rejectedContentCount: {
    type: 'number', scope: 'user', group: 'Content',
    label: "Rejected content items",
    compute: ctx => allContents(ctx).filter(content => content.rejected).length,
  },
  rejectedPostCount: {
    type: 'number', scope: 'user', group: 'Content',
    label: "Rejected posts",
    compute: ctx => ctx.posts.filter(post => post.rejected).length,
  },
  mostRecentContentIsRejected: {
    type: 'boolean', scope: 'user', group: 'Content',
    label: "Most recent content was rejected",
    compute: ctx => !!maxBy(allContents(ctx), content => new Date(content.postedAt).getTime())?.rejected,
  },
  minContentBaseScore: {
    type: 'number', scope: 'user', group: 'Content',
    label: "Lowest karma on any content item",
    compute: ctx => minOrNull(allContents(ctx).map(content => content.baseScore ?? 0)),
  },
  maxContentBaseScore: {
    type: 'number', scope: 'user', group: 'Content',
    label: "Highest karma on any content item",
    compute: ctx => maxOrNull(allContents(ctx).map(content => content.baseScore ?? 0)),
  },
  averagePostKarma: {
    type: 'number', scope: 'user', group: 'Content',
    label: "Average karma across posts",
    description: "0 when the user has no posts",
    compute: ctx => averageBaseScore(ctx.posts),
  },
  averageCommentKarma: {
    type: 'number', scope: 'user', group: 'Content',
    label: "Average karma across comments",
    description: "0 when the user has no comments",
    compute: ctx => averageBaseScore(ctx.comments),
  },
  maxPangramScoreAmongUnapproved: {
    type: 'number', scope: 'user', group: 'LLM detection',
    label: "Highest LLM score among unapproved content",
    description: "No value (so any condition on it fails) when there is no unapproved content",
    compute: ctx => maxOrNull(allContents(ctx).filter(isUnapproved).map(content => getPangramScore(content) ?? 0)),
  },
  unapprovedContentMissingPangramScoreCount: {
    type: 'number', scope: 'user', group: 'LLM detection',
    label: "Unapproved content items with no LLM score yet",
    compute: ctx => allContents(ctx).filter(content => isUnapproved(content) && getPangramScore(content) === null).length,
  },
  highPangramScoreContentCount: {
    type: 'number', scope: 'user', group: 'LLM detection',
    label: `Content items scoring ${HIGH_PANGRAM_SCORE} or above for LLM writing`,
    compute: ctx => allContents(ctx).filter(content => (getPangramScore(content) ?? 0) >= HIGH_PANGRAM_SCORE).length,
  },
  activeDmFlagCount: {
    type: 'number', scope: 'user', group: 'Moderator actions',
    label: "Active DM flags",
    description: "Flagged for sending many DMs, or auto-blocked from sending DMs",
    compute: ctx => countActiveActionsOfTypes(ctx, [FLAGGED_FOR_N_DMS, AUTO_BLOCKED_FROM_SENDING_DMS]),
  },
  sentModeratorMessageCount: {
    type: 'number', scope: 'user', group: 'Moderator actions',
    label: "Moderator messages sent to this user",
    compute: ctx => ctx.moderatorActions.filter(action => action.type === SENT_MODERATOR_MESSAGE).length,
  },
  hasActiveDownvotedContentAlert: {
    type: 'boolean', scope: 'user', group: 'Moderator actions',
    label: "Has an active recently-downvoted-content alert",
    compute: ctx => countActiveActionsOfTypes(ctx, [RECENTLY_DOWNVOTED_CONTENT_ALERT]) > 0,
  },
  hasActiveLowAverageKarmaAlert: {
    type: 'boolean', scope: 'user', group: 'Moderator actions',
    label: "Has an active low-average-karma alert",
    compute: ctx => countActiveActionsOfTypes(ctx, [LOW_AVERAGE_KARMA_COMMENT_ALERT, LOW_AVERAGE_KARMA_POST_ALERT]) > 0,
  },
  focusedIsPost: {
    type: 'boolean', scope: 'focusedContent', group: 'Selected content',
    label: "Selected content is a post",
    compute: ctx => !!ctx.focusedContent && isPost(ctx.focusedContent),
  },
  focusedPangramScore: {
    type: 'number', scope: 'focusedContent', group: 'Selected content',
    label: "LLM score of the selected content",
    description: "No value (so any condition on it fails) when the content has not been scored",
    compute: ctx => focusedNumber(ctx, getPangramScore),
  },
  focusedBaseScore: {
    type: 'number', scope: 'focusedContent', group: 'Selected content',
    label: "Karma of the selected content",
    compute: ctx => focusedNumber(ctx, content => content.baseScore ?? 0),
  },
  focusedTextLength: {
    type: 'number', scope: 'focusedContent', group: 'Selected content',
    label: "Length of the selected content, in characters of plain text",
    compute: ctx => focusedNumber(ctx, content => getPlaintext(content).length),
  },
  focusedFirstParagraphLength: {
    type: 'number', scope: 'focusedContent', group: 'Selected content',
    label: "Length of the selected content's first paragraph",
    description: "No value when the content has no paragraph markup",
    compute: ctx => focusedNumber(ctx, getFirstParagraphLength),
  },
  focusedLetterCount: {
    type: 'number', scope: 'focusedContent', group: 'Selected content',
    label: "Letters in the selected content",
    compute: ctx => focusedNumber(ctx, content => getLetters(content).length),
  },
  focusedNonLatinLetterRatio: {
    type: 'number', scope: 'focusedContent', group: 'Selected content',
    label: "Fraction of letters that aren't Latin script",
    description: "Between 0 and 1; the basis of the non-English rejection template",
    compute: ctx => focusedNumber(ctx, getNonLatinLetterRatio),
  },
  focusedLinkCount: {
    type: 'number', scope: 'focusedContent', group: 'Selected content',
    label: "Links in the selected content",
    compute: ctx => focusedNumber(ctx, content => (content.contents?.html?.match(/<a\s[^>]*href/gi) ?? []).length),
  },
  focusedHasLinkpostUrl: {
    type: 'boolean', scope: 'focusedContent', group: 'Selected content',
    label: "Selected content is a linkpost",
    compute: ctx => !!ctx.focusedContent && isPost(ctx.focusedContent) && !!ctx.focusedContent.url,
  },
} satisfies Record<string, HighlightSignal>;

/** Signal names, as a union, so that the rule defaults are checked against the registry */
export type HighlightSignalName = keyof typeof HIGHLIGHT_SIGNAL_DEFINITIONS;

export const HIGHLIGHT_SIGNALS: Record<string, HighlightSignal> = HIGHLIGHT_SIGNAL_DEFINITIONS;

export const highlightSignalNames: HighlightSignalName[] = Object.keys(HIGHLIGHT_SIGNAL_DEFINITIONS)
  .filter((name): name is HighlightSignalName => name in HIGHLIGHT_SIGNAL_DEFINITIONS);
