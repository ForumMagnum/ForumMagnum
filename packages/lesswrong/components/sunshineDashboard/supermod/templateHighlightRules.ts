import { FLAGGED_FOR_N_DMS, AUTO_BLOCKED_FROM_SENDING_DMS, RECENTLY_DOWNVOTED_CONTENT_ALERT, SENT_MODERATOR_MESSAGE } from "@/lib/collections/moderatorActions/constants";
import { isPost, type ContentItem } from "./helpers";

export interface TemplateHighlightContext {
  user: SunshineUsersList;
  moderatorActions: ModeratorActionDisplay[];
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
}

type HighlightRule = (ctx: TemplateHighlightContext) => boolean;

const TEMPLATE_HIGHLIGHT_RULES: Record<string, HighlightRule> = {
  "Lotsa DMs": ({ moderatorActions }) => {
    const flaggedForNDMs = moderatorActions.filter(a => a.active && a.type === FLAGGED_FOR_N_DMS);
    const autoBlockedFromSendingDMs = moderatorActions.filter(a => a.active && a.type === AUTO_BLOCKED_FROM_SENDING_DMS);
    return flaggedForNDMs.length >= 1 || autoBlockedFromSendingDMs.length >= 1;
  },
  "This isn't gonna work out": ({ moderatorActions }) => {
    const moderatorMessages = moderatorActions.filter(a => a.type === SENT_MODERATOR_MESSAGE);
    return moderatorMessages.length >= 2;
  },
  "Multiple LLM rejections": ({ moderatorActions, posts, comments }) => {
    const moderatorMessages = moderatorActions.filter(a => a.type === SENT_MODERATOR_MESSAGE);
    const userContent = [...posts, ...comments];
    const highLLMContent = userContent.filter(c => (c.automatedContentEvaluations?.pangramScore ?? 0) >= .2);
    return highLLMContent.length >= 2 && moderatorMessages.length >= 2;
  },
  "Semi-automoderated quality warning (downvoted)": ({ moderatorActions }) =>
    moderatorActions.some(a => a.active && a.type === RECENTLY_DOWNVOTED_CONTENT_ALERT),
};

// Zenodo (an open repository) also shows up via doi links like doi.org/10.5281/zenodo.123456
const ZENODO_PATTERN = /\bzenodo\b/i;

function postLinksToZenodo(post: SunshinePostsList): boolean {
  if (post.url && ZENODO_PATTERN.test(post.url)) return true;
  const hrefs = post.contents?.html?.match(/href="[^"]*"/gi) ?? [];
  return hrefs.some(href => ZENODO_PATTERN.test(href));
}

// Heuristics for the "Formatting" rejection template, which calls out improper
// whitespace ("not inserting space between paragraphs, or inserting double
// paragraph spaces by accident") and punctuation/capitalization ("the sort of
// person who strongly prefers not to capitalize sentences").

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function getParagraphTexts(html: string): string[] {
  const paragraphBlocks = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) ?? [];
  return paragraphBlocks.map(stripHtmlTags);
}

// "inserting double paragraph spaces by accident": empty paragraphs render as
// doubled paragraph spacing, so a bunch of them means broken whitespace
function hasExcessEmptyParagraphs(paragraphTexts: string[]): boolean {
  const emptyParagraphCount = paragraphTexts.filter(text => !text).length;
  return emptyParagraphCount >= 3 && emptyParagraphCount >= paragraphTexts.length / 4;
}

// "not inserting space between paragraphs": a single unbroken wall of text
const WALL_OF_TEXT_WORD_COUNT = 250;
function hasWallOfTextParagraph(paragraphTexts: string[]): boolean {
  return paragraphTexts.some(text => text.split(/\s+/).length >= WALL_OF_TEXT_WORD_COUNT);
}

// "strongly prefers not to capitalize sentences": a meaningful fraction of
// sentences starting with a lowercase letter
function hasUncapitalizedSentences(paragraphTexts: string[]): boolean {
  const text = paragraphTexts.join(' ')
    // Common abbreviations would otherwise read as sentence boundaries
    .replace(/\b(e\.g\.|i\.e\.|etc\.|vs\.|cf\.)/gi, '');
  const sentenceStarts = text.split(/[.!?]+\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => /^[a-zA-Z]/.test(sentence));
  if (sentenceStarts.length < 5) return false;
  const lowercaseStarts = sentenceStarts.filter(sentence => /^[a-z]/.test(sentence));
  return lowercaseStarts.length / sentenceStarts.length >= 0.3;
}

type RejectionHighlightRule = (content: ContentItem) => boolean;

const REJECTION_HIGHLIGHT_RULES: Record<string, RejectionHighlightRule> = {
  "Potentially / Partially LLM": (content) =>
    (content.automatedContentEvaluations?.pangramScore ?? 0) >= .1,
  "Difficult to evaluate (offsite content)": (content) =>
    isPost(content) && postLinksToZenodo(content),
  "Formatting": (content) => {
    const paragraphTexts = getParagraphTexts(content.contents?.html ?? '');
    return hasExcessEmptyParagraphs(paragraphTexts)
      || hasWallOfTextParagraph(paragraphTexts)
      || hasUncapitalizedSentences(paragraphTexts);
  },
};

function evaluateHighlightRules<T>(rules: Record<string, (ctx: T) => boolean>, ctx: T): Set<string> {
  const highlighted = new Set<string>();
  for (const [name, condition] of Object.entries(rules)) {
    try {
      if (condition(ctx)) highlighted.add(name);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error evaluating highlight rule for "${name}":`, e);
    }
  }
  return highlighted;
}

export function getHighlightedTemplateNames(
  ctx: Omit<TemplateHighlightContext, 'posts' | 'comments'>,
  posts: SunshinePostsList[],
  comments: SunshineCommentsList[]
): Set<string> {
  const fullCtx: TemplateHighlightContext = {
    ...ctx,
    posts,
    comments,
  };
  return evaluateHighlightRules(TEMPLATE_HIGHLIGHT_RULES, fullCtx);
}

export function getHighlightedRejectionTemplateNames(content: ContentItem): Set<string> {
  return evaluateHighlightRules(REJECTION_HIGHLIGHT_RULES, content);
}
