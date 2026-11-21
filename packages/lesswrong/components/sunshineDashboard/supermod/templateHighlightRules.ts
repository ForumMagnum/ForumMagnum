import type { HighlightRule } from "@/lib/moderatorHighlights/highlightRuleTypes";
import { highlightRuleOverrides } from "@/lib/moderatorHighlights/highlightRules";
import type { ContentItem } from "./helpers";
import { highlightRuleMatches } from "./declarativeHighlightRules";
import type { HighlightContext, HighlightSignalContext } from "./highlightSignals";

function getMatchingTemplateNames(rules: Record<string, HighlightRule>, signalContext: HighlightSignalContext): Set<string> {
  const highlighted = new Set<string>();
  for (const [templateName, rule] of Object.entries(rules)) {
    try {
      if (highlightRuleMatches(rule, signalContext)) highlighted.add(templateName);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error evaluating highlight rule for template "${templateName}":`, e);
    }
  }
  return highlighted;
}

export function getHighlightedRejectionTemplateNames(focusedContent: ContentItem, ctx: HighlightContext): Set<string> {
  return getMatchingTemplateNames(highlightRuleOverrides.rejectionTemplates, { ...ctx, focusedContent });
}

export function getHighlightedTemplateNames(
  ctx: Pick<HighlightContext, 'user' | 'moderatorActions'>,
  posts: SunshinePostsList[],
  comments: SunshineCommentsList[]
): Set<string> {
  return getMatchingTemplateNames(highlightRuleOverrides.messageTemplates, { ...ctx, posts, comments, focusedContent: null });
}
