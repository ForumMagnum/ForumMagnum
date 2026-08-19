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
import {
  getFirstParagraphLength,
  getFormattingParagraphPlaintextsFromHtml,
  getLetters,
  getLongestFormattingSentenceLengthFromHtml,
  getNonLatinLetterRatio,
  getPlaintext,
  getRepeatedPunctuationRunCountFromHtml,
  getTitleAndText,
} from "./contentTextHelpers";

export interface HighlightSignalContext {
  user: SunshineUsersList;
  moderatorActions: ModeratorActionDisplay[];
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
  focusedContent: ContentItem | null;
}

export const highlightSignalGroups = ['User', 'Content', 'LLM detection', 'Moderator actions', 'Selected content'] as const;

export type HighlightSignalGroup = typeof highlightSignalGroups[number];

interface HighlightSignalBase {
  label: string;
  description?: string;
  group: HighlightSignalGroup;
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

export interface StringHighlightSignal extends HighlightSignalBase {
  type: 'string';
  compute: (ctx: HighlightSignalContext) => string | null;
}

export interface StringListHighlightSignal extends HighlightSignalBase {
  type: 'stringList';
  compute: (ctx: HighlightSignalContext) => string[];
}

export type HighlightSignal = NumericHighlightSignal | BooleanHighlightSignal | StringHighlightSignal | StringListHighlightSignal;

/**
 * Inherited from master, where the "Multiple LLM rejections" rule used an inline `>= .2`.
 * Note the rejection templates use their own, higher cutoffs (see POTENTIALLY_LLM_SCORE_* in
 * templateHighlightRules.ts) — the two have never been reconciled.
 */
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

const DUPLICATE_MIN_TITLE_LENGTH = 5;
const DUPLICATE_MIN_BODY_LENGTH = 40;

const normalizeForComparison = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim();

const isDuplicateFocusedContent = (ctx: HighlightSignalContext): boolean => {
  const focusedContent = ctx.focusedContent;
  if (!focusedContent) return false;
  const others = allContents(ctx).filter(content => content._id !== focusedContent._id);
  if (isPost(focusedContent)) {
    const title = normalizeForComparison(focusedContent.title ?? '');
    if (title.length >= DUPLICATE_MIN_TITLE_LENGTH) {
      const otherPosts = ctx.posts.filter(post => post._id !== focusedContent._id);
      if (otherPosts.some(post => normalizeForComparison(post.title ?? '') === title)) return true;
    }
  }

  const body = normalizeForComparison(getPlaintext(focusedContent));
  if (body.length < DUPLICATE_MIN_BODY_LENGTH) return false;
  return others.some(content => normalizeForComparison(getPlaintext(content)) === body);
};

const hasPriorRejection = (ctx: HighlightSignalContext): boolean => {
  if ((ctx.user.rejectedContentCount ?? 0) >= 1) return true;
  return allContents(ctx).some(content => content.rejected && content._id !== ctx.focusedContent?._id);
};

const focusedNumber = (
  ctx: HighlightSignalContext,
  compute: (content: ContentItem) => number | null,
): number | null => (ctx.focusedContent ? compute(ctx.focusedContent) : null);

const focusedString = (
  ctx: HighlightSignalContext,
  compute: (content: ContentItem) => string,
): string | null => (ctx.focusedContent ? compute(ctx.focusedContent) : null);

const HIGHLIGHT_SIGNAL_DEFINITIONS = {
  userDisplayName: {
    type: 'string', scope: 'user', group: 'User',
    label: "User display name",
    description: "Use a regular expression to match the user's current display name",
    compute: ctx => ctx.user.displayName ?? '',
  },
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
  contentTitlesAndTexts: {
    type: 'stringList', scope: 'user', group: 'Content',
    label: "Title and text of any content item",
    description: "Each post or comment is matched independently; post titles are prepended to their body text",
    compute: ctx => allContents(ctx).map(getTitleAndText),
  },
  postTitlesAndTexts: {
    type: 'stringList', scope: 'user', group: 'Content',
    label: "Title and text of any post",
    description: "Each post is matched independently, with its title prepended to its body text",
    compute: ctx => ctx.posts.map(getTitleAndText),
  },
  rejectedPostTitlesAndTexts: {
    type: 'stringList', scope: 'user', group: 'Content',
    label: "Title and text of any rejected post",
    description: "As with the title and text of any post, but only over posts that have been rejected",
    compute: ctx => ctx.posts.filter(post => post.rejected).map(getTitleAndText),
  },
  contentPlaintexts: {
    type: 'stringList', scope: 'user', group: 'Content',
    label: "Plain text of any content item",
    description: "Each post or comment body is matched independently",
    compute: ctx => allContents(ctx).map(getPlaintext),
  },
  contentFormattingParagraphs: {
    type: 'stringList', scope: 'user', group: 'Content',
    label: "Plain text of any content paragraph",
    description: "Each HTML paragraph is matched independently; fully unwrapped content is treated as one paragraph",
    compute: ctx => allContents(ctx).flatMap(content =>
      getFormattingParagraphPlaintextsFromHtml(content.contents?.html ?? '')
    ),
  },
  maxPangramScoreAmongUnapproved: {
    type: 'number', scope: 'user', group: 'LLM detection',
    label: "Highest LLM score among unapproved content",
    description: "No value (so any condition on it fails) when there is no unapproved content",
    // Unlike focusedPangramScore, unscored content counts as 0 rather than as no-value, so a
    // `lte` condition passes on content that was never scored. The action rules compensate by
    // gating level 2 on unapprovedContentMissingPangramScoreCount being 0.
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
  focusedTitleAndText: {
    type: 'string', scope: 'focusedContent', group: 'Selected content',
    label: "Selected content's title and text",
    description: "Plain text with the title prepended for posts; use a regular expression to match it",
    compute: ctx => focusedString(ctx, getTitleAndText),
  },
  focusedPlaintext: {
    type: 'string', scope: 'focusedContent', group: 'Selected content',
    label: "Selected content's plain text",
    description: "The selected post or comment body, without its title",
    compute: ctx => focusedString(ctx, getPlaintext),
  },
  focusedFormattingParagraphs: {
    type: 'stringList', scope: 'focusedContent', group: 'Selected content',
    label: "Plain text of any selected-content paragraph",
    description: "Each HTML paragraph is matched independently; fully unwrapped content is treated as one paragraph",
    compute: ctx => ctx.focusedContent
      ? getFormattingParagraphPlaintextsFromHtml(ctx.focusedContent.contents?.html ?? '')
      : [],
  },
  focusedFormattingParagraphCount: {
    type: 'number', scope: 'focusedContent', group: 'Selected content',
    label: "Formatting paragraphs in the selected content",
    description: "Fully unwrapped content counts as one paragraph; content with other block breaks but no paragraphs counts as zero",
    compute: ctx => focusedNumber(ctx, content =>
      getFormattingParagraphPlaintextsFromHtml(content.contents?.html ?? '').length
    ),
  },
  focusedRepeatedPunctuationRunCount: {
    type: 'number', scope: 'focusedContent', group: 'Selected content',
    label: "Repeated punctuation runs in the selected content",
    description: "Counts runs of at least three periods, exclamation marks, or question marks",
    compute: ctx => focusedNumber(ctx, content =>
      getRepeatedPunctuationRunCountFromHtml(content.contents?.html ?? '')
    ),
  },
  focusedLongestFormattingSentenceLength: {
    type: 'number', scope: 'focusedContent', group: 'Selected content',
    label: "Longest sentence-like run in the selected content",
    description: "Characters between punctuation boundaries followed by whitespace or the end of a formatting paragraph",
    compute: ctx => focusedNumber(ctx, content =>
      getLongestFormattingSentenceLengthFromHtml(content.contents?.html ?? '')
    ),
  },
  focusedDuplicatesExistingContent: {
    type: 'boolean', scope: 'focusedContent', group: 'Selected content',
    label: "Selected content duplicates another item from this user",
    description: "Matches normalized post titles of at least 5 characters or normalized bodies of at least 40 characters",
    compute: isDuplicateFocusedContent,
  },
  hasPriorRejection: {
    type: 'boolean', scope: 'focusedContent', group: 'Selected content',
    label: "User has a prior rejection",
    description: "Uses the user's lifetime rejection count or another rejected item loaded in the inbox",
    compute: hasPriorRejection,
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
