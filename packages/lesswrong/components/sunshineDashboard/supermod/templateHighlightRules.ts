import type { HighlightRule, HighlightRuleOverrides } from "@/lib/moderatorHighlights/highlightRuleTypes";
import { isPost, type ContentItem } from "./helpers";
import { getPlaintext, getTitleAndText, stripHtml } from "./contentTextHelpers";
import { booleanCondition, highlightRuleMatches, numberCondition, resolveHighlightRules } from "./declarativeHighlightRules";
import type { HighlightSignalContext } from "./highlightSignals";

/**
 * Highlight rules for message and rejection templates, keyed by template name.
 *
 * Rules that are just thresholds on a property of the user or their content live in the
 * DEFAULT_*_TEMPLATE_RULES maps below, in a serializable format that can be edited from
 * /admin/supermodHighlights. Rules that need real logic (regexes over content, formatting
 * heuristics, duplicate detection) stay as code predicates in this file, and are listed in
 * the editor as read-only.
 */

const countDistinctMatches = (regex: RegExp, text: string): number => {
  const matches = new Set<string>();
  for (const match of text.matchAll(regex)) {
    matches.add(match[0].toLowerCase());
  }
  return matches.size;
};

// Named politicians, parties, and hot-button topics; kept narrow (no
// "conservative"/"liberal", which show up constantly in non-political LW
// writing). Two distinct hits required before either politics template lights up.
const POLITICAL_TERMS_REGEX = /\b(trump|biden|obama|kamala|democrats?|republicans?|left-wing|right-wing|elections?|presidential|congress|senate|immigration|abortion|transgender|woke|israel|gaza|palestine|palestinians?|culture war)\b/gi;

const isPolitical = (content: ContentItem) =>
  countDistinctMatches(POLITICAL_TERMS_REGEX, getTitleAndText(content)) >= 2;

// The recurring vocabulary of LLM-driven speculation ("recursive emergence of
// resonant consciousness...")
const LLM_SPECULATION_TERMS_REGEX = /\b(recursive|recursion|emergent|emergence|resonance|resonant|spirals?|consciousness|sentient|sentience|awakening|glyphs?)\b/gi;

const LLM_CONVERSATION_REGEX = /\b(conversations?|chats?|transcripts?|dialogues?|sessions?) with (an? |my )?(LLM|AI|ChatGPT|Claude|GPT[-\w]*|Gemini|Grok)\b|\bI (asked|prompted|told) (ChatGPT|Claude|GPT[-\w]*|Gemini|Grok|the (AI|model|LLM))\b/i;

const MISSING_SENTENCE_SPACE_REGEX = /[a-z]\.[A-Z][a-z]/g;
const SENTENCE_START_REGEX = /[.!?]\s+([a-zA-Z])/g;
const BAD_FORMATTING_MIN_SENTENCES = 4;
const BAD_FORMATTING_LOWERCASE_SENTENCE_RATIO = 0.3;
const BAD_FORMATTING_MAX_PARAGRAPH_LENGTH = 1500;

/**
 * The mechanical defects the Formatting templates describe: sentences that
 * start lowercase, missing spaces between sentences, or wall-of-text
 * paragraphs with no breaks.
 */
const hasBadFormatting = (content: ContentItem): boolean => {
  const html = content.contents?.html ?? '';
  const text = getPlaintext(content);

  const sentenceStarts = [...text.matchAll(SENTENCE_START_REGEX)];
  if (sentenceStarts.length >= BAD_FORMATTING_MIN_SENTENCES) {
    const lowercaseStarts = sentenceStarts.filter(m => /[a-z]/.test(m[1]));
    if (lowercaseStarts.length / sentenceStarts.length > BAD_FORMATTING_LOWERCASE_SENTENCE_RATIO) return true;
  }

  if ([...text.matchAll(MISSING_SENTENCE_SPACE_REGEX)].length >= 2) return true;

  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  if (paragraphs.some(p => stripHtml(p[1]).trim().length > BAD_FORMATTING_MAX_PARAGRAPH_LENGTH)) return true;
  const hasBlockBreaks = /<(p|br|li|h[1-6]|blockquote)\b/i.test(html);
  return !hasBlockBreaks && text.length > BAD_FORMATTING_MAX_PARAGRAPH_LENGTH;
};

export interface TemplateHighlightContext {
  user: SunshineUsersList;
  moderatorActions: ModeratorActionDisplay[];
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
  ruleOverrides?: HighlightRuleOverrides | null;
}

type HighlightRulePredicate = (ctx: TemplateHighlightContext) => boolean;

// Company-style words in a display name ("Acme Labs", "Frobnitz Research")
const ORG_USERNAME_REGEX = /\b(team|labs?|institute|foundation|research|official|inc|llc|ltd|ventures?|solutions|technologies|capital|group|systems|collective)\b/i;

// Random-string usernames: several digits mixed in, a long unpronounceable
// consonant run, or one very long unbroken token
const THREE_DIGITS_REGEX = /\d.*\d.*\d/;
const CONSONANT_RUN_REGEX = /[bcdfghjklmnpqrstvwxz]{5,}/i;
const UNPRONOUNCEABLE_MIN_UNBROKEN_LENGTH = 24;

/** Message-template rules that can't be expressed as thresholds, so aren't editable */
const CODE_MESSAGE_TEMPLATE_RULES: Record<string, HighlightRulePredicate> = {
  "No Org Usernames": ({ user }) => ORG_USERNAME_REGEX.test(user.displayName ?? ''),
  "Make Username Pronounceable": ({ user }) => {
    const name = user.displayName ?? '';
    if (THREE_DIGITS_REGEX.test(name)) return true;
    if (CONSONANT_RUN_REGEX.test(name)) return true;
    return name.length >= UNPRONOUNCEABLE_MIN_UNBROKEN_LENGTH && !name.includes(' ');
  },
  "Politics": ({ posts, comments }) => [...posts, ...comments].some(isPolitical),
  "Formatting / Grammar": ({ posts, comments }) => [...posts, ...comments].some(hasBadFormatting),
};

const TRACTION_MIN_CONTENTS = 3;
const TRACTION_MAX_BASE_SCORE = 2;

const BAD_FIT_MIN_REJECTED_POSTS = 2;

export const DEFAULT_MESSAGE_TEMPLATE_RULES: Record<string, HighlightRule> = {
  "Lotsa DMs": {
    enabled: true,
    groups: [[numberCondition('activeDmFlagCount', 'gte', 1)]],
  },
  "This isn't gonna work out": {
    enabled: true,
    groups: [[numberCondition('sentModeratorMessageCount', 'gte', 2)]],
  },
  "Multiple LLM rejections": {
    enabled: true,
    groups: [[
      numberCondition('highPangramScoreContentCount', 'gte', 2),
      numberCondition('sentModeratorMessageCount', 'gte', 2),
    ]],
  },
  "Semi-automoderated quality warning (downvoted)": {
    enabled: true,
    groups: [[booleanCondition('hasActiveDownvotedContentAlert', true)]],
  },
  // The template's own criterion: lots of contents averaging under 1 karma each,
  // which is what these automod alerts fire on
  "Semi-Automated Quality (low average)": {
    enabled: true,
    groups: [[booleanCondition('hasActiveLowAverageKarmaAlert', true)]],
  },
  "Bad fit first post, unlikely to get better": {
    enabled: true,
    groups: [[
      numberCondition('rejectedPostCount', 'gte', BAD_FIT_MIN_REJECTED_POSTS),
      numberCondition('approvedContentCount', 'eq', 0),
    ]],
  },
  // A few submissions, none rejected, but nobody's engaging (scores hovering at
  // the self-vote). Negative scores are the downvoted template's territory instead.
  "Your Submissions Aren't Finding Traction": {
    enabled: true,
    groups: [[
      numberCondition('contentCount', 'gte', TRACTION_MIN_CONTENTS),
      numberCondition('rejectedContentCount', 'eq', 0),
      numberCondition('minContentBaseScore', 'gte', 0),
      numberCondition('maxContentBaseScore', 'lte', TRACTION_MAX_BASE_SCORE),
    ]],
  },
};

type RejectionHighlightPredicate = (focusedContent: ContentItem, ctx: TemplateHighlightContext) => boolean;

// Whole-word, case-sensitive for the acronyms so e.g. "air" or "Ai" don't match
const AI_TERMS_REGEX = /\b(AI|AGI|ASI|LLMs?|GPT|ChatGPT)\b/;
const AI_PHRASES_REGEX = /\blanguage models?\b/i;

const mentionsAi = (focusedContent: ContentItem) => {
  const text = getTitleAndText(focusedContent);
  return AI_TERMS_REGEX.test(text) || AI_PHRASES_REGEX.test(text);
};

const ROKO_REGEX = /\broko'?s?\b|\bbasilisks?\b|\bacausal (extortion|blackmail|trade)\b/i;

// "you rejected my post" vocabulary, for posts relitigating a moderation decision
const MODERATION_DECISION_REGEX = /\breject(ed|ion)s?\b|\bmoderators?\b|\bmoderation\b|\bmod team\b|\bcensor(ed|ship|ing)?\b/i;

const DUPLICATE_MIN_TITLE_LENGTH = 5;
const DUPLICATE_MIN_BODY_LENGTH = 40;

const normalizeForComparison = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim();

const isDuplicateContent = (focusedContent: ContentItem, ctx: TemplateHighlightContext): boolean => {
  const others = [...ctx.posts, ...ctx.comments].filter(c => c._id !== focusedContent._id);
  if (isPost(focusedContent)) {
    const title = normalizeForComparison(focusedContent.title ?? '');
    if (title.length >= DUPLICATE_MIN_TITLE_LENGTH) {
      const otherPosts = ctx.posts.filter(p => p._id !== focusedContent._id);
      if (otherPosts.some(p => normalizeForComparison(p.title ?? '') === title)) return true;
    }
  }
  const body = normalizeForComparison(getPlaintext(focusedContent));
  if (body.length < DUPLICATE_MIN_BODY_LENGTH) return false;
  return others.some(c => normalizeForComparison(getPlaintext(c)) === body);
};

/**
 * Rejection-template rules that can't be expressed as thresholds, so aren't editable. Unlike
 * the message-template rules, these are evaluated against the single content item the
 * moderator has selected for rejection (though the full user context is also available).
 */
const CODE_REJECTION_TEMPLATE_RULES: Record<string, RejectionHighlightPredicate> = {
  "Probably Insufficient Quality for AI Content": mentionsAi,
  "Insufficient Quality for AI Content (posts)": (focusedContent) =>
    isPost(focusedContent) && mentionsAi(focusedContent),
  "Insufficient Quality for AI Content (comments)": (focusedContent) =>
    !isPost(focusedContent) && mentionsAi(focusedContent),
  "Roko's Basilisk": (focusedContent) => ROKO_REGEX.test(getTitleAndText(focusedContent)),
  "Duplicate": isDuplicateContent,
  "No, we won't answer followup questions": (focusedContent, ctx) => {
    if (!isPost(focusedContent)) return false;
    const hasPriorRejection = (ctx.user.rejectedContentCount ?? 0) >= 1
      || [...ctx.posts, ...ctx.comments].some(c => c.rejected && c._id !== focusedContent._id);
    return hasPriorRejection && MODERATION_DECISION_REGEX.test(getTitleAndText(focusedContent));
  },
  "Political norm": isPolitical,
  "Formatting": hasBadFormatting,
  "No LLM Case Studies": (focusedContent) => {
    const text = getTitleAndText(focusedContent);
    return LLM_CONVERSATION_REGEX.test(text) && countDistinctMatches(LLM_SPECULATION_TERMS_REGEX, text) >= 1;
  },
  "LLM sycophancy trap": (focusedContent) => {
    const score = focusedContent.automatedContentEvaluations?.pangramScore;
    if ((score ?? 0) <= 0) return false;
    return countDistinctMatches(LLM_SPECULATION_TERMS_REGEX, getTitleAndText(focusedContent)) >= 2;
  },
};

const POTENTIALLY_LLM_SCORE_MIN = 0.1;
const POTENTIALLY_LLM_SCORE_MAX = 0.3;

const NON_LATIN_LETTER_MIN_RATIO = 0.25;
const NON_LATIN_MIN_LETTERS = 20;

const ACCIDENT_MAX_PLAINTEXT_LENGTH = 50;

const OFFSITE_MAX_PLAINTEXT_LENGTH = 600;

const CHONKY_ABSTRACT_MIN_FIRST_PARAGRAPH_LENGTH = 1000;

const probablyLlmWritten: HighlightRule = {
  enabled: true,
  groups: [[numberCondition('focusedPangramScore', 'gt', POTENTIALLY_LLM_SCORE_MAX)]],
};

/**
 * Content that is mostly just a pointer elsewhere: little text of its own, and
 * either a single link or (for posts) a linkpost url.
 */
const probablyOffsiteContent: HighlightRule = {
  enabled: true,
  groups: [
    [numberCondition('focusedTextLength', 'lt', OFFSITE_MAX_PLAINTEXT_LENGTH), numberCondition('focusedLinkCount', 'eq', 1)],
    [numberCondition('focusedTextLength', 'lt', OFFSITE_MAX_PLAINTEXT_LENGTH), booleanCondition('focusedHasLinkpostUrl', true)],
  ],
};

export const DEFAULT_REJECTION_TEMPLATE_RULES: Record<string, HighlightRule> = {
  "Potentially / Partially LLM": {
    enabled: true,
    groups: [[
      numberCondition('focusedPangramScore', 'gt', POTENTIALLY_LLM_SCORE_MIN),
      numberCondition('focusedPangramScore', 'lt', POTENTIALLY_LLM_SCORE_MAX),
    ]],
  },
  "No LLM": probablyLlmWritten,
  "No LLM (autoreject)": probablyLlmWritten,
  "Difficult to evaluate (offsite content)": probablyOffsiteContent,
  "Not obviously not spam": probablyOffsiteContent,
  "We only accept English-language content": {
    enabled: true,
    groups: [[
      numberCondition('focusedLetterCount', 'gte', NON_LATIN_MIN_LETTERS),
      numberCondition('focusedNonLatinLetterRatio', 'gt', NON_LATIN_LETTER_MIN_RATIO),
    ]],
  },
  "Submitted by Accident?": {
    enabled: true,
    groups: [[
      booleanCondition('focusedIsPost', true),
      numberCondition('focusedTextLength', 'lt', ACCIDENT_MAX_PLAINTEXT_LENGTH),
    ]],
  },
  "Too Chonky Abstract paragraph": {
    enabled: true,
    groups: [[
      booleanCondition('focusedIsPost', true),
      numberCondition('focusedFirstParagraphLength', 'gt', CHONKY_ABSTRACT_MIN_FIRST_PARAGRAPH_LENGTH),
    ]],
  },
};

/** Template names whose rules live in code; shown in the editor as read-only */
export const codeDefinedMessageTemplateRuleNames = Object.keys(CODE_MESSAGE_TEMPLATE_RULES);
export const codeDefinedRejectionTemplateRuleNames = Object.keys(CODE_REJECTION_TEMPLATE_RULES);

function toSignalContext(ctx: TemplateHighlightContext, focusedContent: ContentItem | null): HighlightSignalContext {
  return {
    user: ctx.user,
    moderatorActions: ctx.moderatorActions,
    posts: ctx.posts,
    comments: ctx.comments,
    focusedContent,
  };
}

function addMatchingRules(
  highlighted: Set<string>,
  rules: Record<string, HighlightRule>,
  signalContext: HighlightSignalContext,
) {
  for (const [name, rule] of Object.entries(rules)) {
    try {
      if (highlightRuleMatches(rule, signalContext)) highlighted.add(name);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error evaluating highlight rule for "${name}":`, e);
    }
  }
}

export function getHighlightedRejectionTemplateNames(
  focusedContent: ContentItem | null | undefined,
  ctx: TemplateHighlightContext,
): Set<string> {
  const highlighted = new Set<string>();
  if (!focusedContent) return highlighted;
  for (const [name, condition] of Object.entries(CODE_REJECTION_TEMPLATE_RULES)) {
    try {
      if (condition(focusedContent, ctx)) highlighted.add(name);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error evaluating highlight rule for rejection template "${name}":`, e);
    }
  }
  const rules = resolveHighlightRules(DEFAULT_REJECTION_TEMPLATE_RULES, ctx.ruleOverrides, 'rejectionTemplates');
  addMatchingRules(highlighted, rules, toSignalContext(ctx, focusedContent));
  return highlighted;
}

export function getHighlightedTemplateNames(
  ctx: Omit<TemplateHighlightContext, 'posts' | 'comments'>,
  posts: SunshinePostsList[],
  comments: SunshineCommentsList[]
): Set<string> {
  const fullCtx: TemplateHighlightContext = { ...ctx, posts, comments };
  const highlighted = new Set<string>();
  for (const [name, condition] of Object.entries(CODE_MESSAGE_TEMPLATE_RULES)) {
    try {
      if (condition(fullCtx)) highlighted.add(name);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error evaluating highlight rule for "${name}":`, e);
    }
  }
  const rules = resolveHighlightRules(DEFAULT_MESSAGE_TEMPLATE_RULES, ctx.ruleOverrides, 'messageTemplates');
  addMatchingRules(highlighted, rules, toSignalContext(fullCtx, null));
  return highlighted;
}
