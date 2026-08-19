import type { HighlightRule, HighlightRuleOverrides } from "@/lib/moderatorHighlights/highlightRuleTypes";
import type { ContentItem } from "./helpers";
import { highlightRuleMatches, resolveHighlightRules } from "./declarativeHighlightRules";
import type { HighlightSignalContext } from "./highlightSignals";

// Template rules live entirely in the database; there are no defaults in code.
export interface TemplateHighlightContext {
  user: SunshineUsersList;
  moderatorActions: ModeratorActionDisplay[];
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
  ruleOverrides?: HighlightRuleOverrides | null;
}

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
  for (const [templateId, rule] of Object.entries(rules)) {
    try {
      if (highlightRuleMatches(rule, signalContext)) highlighted.add(templateId);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error evaluating highlight rule for template ${templateId}:`, e);
    }
  }
}

/** No consumer yet; the rejection composer lands with the inbox UI PR. */
export function getHighlightedRejectionTemplateIds(
  focusedContent: ContentItem | null | undefined,
  ctx: TemplateHighlightContext,
): Set<string> {
  const highlighted = new Set<string>();
  if (!focusedContent) return highlighted;
  const rules = resolveHighlightRules({}, ctx.ruleOverrides, 'rejectionTemplates');
  addMatchingRules(highlighted, rules, toSignalContext(ctx, focusedContent));
  return highlighted;
}

export function getHighlightedTemplateIds(
  ctx: Omit<TemplateHighlightContext, 'posts' | 'comments'>,
  posts: SunshinePostsList[],
  comments: SunshineCommentsList[]
): Set<string> {
  const fullCtx: TemplateHighlightContext = { ...ctx, posts, comments };
  const highlighted = new Set<string>();
  const rules = resolveHighlightRules({}, ctx.ruleOverrides, 'messageTemplates');
  addMatchingRules(highlighted, rules, toSignalContext(fullCtx, null));
  return highlighted;
}
