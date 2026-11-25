import type { HighlightRule } from "@/lib/moderatorHighlights/highlightRuleTypes";
import { highlightRuleOverrides } from "@/lib/moderatorHighlights/highlightRules";
import type { ContentItem } from "./helpers";
import { highlightRuleMatches } from "./declarativeHighlightRules";
import type { HighlightContext, HighlightSignalContext } from "./highlightSignals";

function getMatchingTemplateIds(rules: Record<string, HighlightRule>, signalContext: HighlightSignalContext): Set<string> {
  const highlighted = new Set<string>();
  for (const [templateId, rule] of Object.entries(rules)) {
    try {
      if (highlightRuleMatches(rule, signalContext)) highlighted.add(templateId);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error evaluating highlight rule for template "${templateId}":`, e);
    }
  }
  return highlighted;
}

export function getHighlightedRejectionTemplateIds(focusedContent: ContentItem, ctx: HighlightContext): Set<string> {
  return getMatchingTemplateIds(highlightRuleOverrides.rejectionTemplates, { ...ctx, focusedContent });
}

export function getHighlightedTemplateIds(
  ctx: Pick<HighlightContext, 'user' | 'moderatorActions'>,
  posts: SunshinePostsList[],
  comments: SunshineCommentsList[]
): Set<string> {
  return getMatchingTemplateIds(highlightRuleOverrides.messageTemplates, { ...ctx, posts, comments, focusedContent: null });
}
