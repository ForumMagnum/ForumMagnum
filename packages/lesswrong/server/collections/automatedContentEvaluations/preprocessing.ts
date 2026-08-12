import { cheerioParse } from "@/server/utils/htmlUtil";

/**
 * Strip elements from HTML that should not be included in AI detection scoring.
 * This includes:
 * - LLM content blocks (`div.llm-content-block`): explicitly labeled as AI-generated
 * - Collapsible sections (`.detailsBlock`): our policy permits AI content in collapsible sections
 * - Iframe widgets (`iframe[data-lexical-iframe-widget]`): contain code/HTML, not prose
 * - Code blocks (`.code-block`): contain code, not prose
 */
export function stripExcludedContentForAIDetection(html: string): string {
  const $ = cheerioParse(html);
  $('div.llm-content-block').remove();
  $('.detailsBlock').remove();
  $('iframe[data-lexical-iframe-widget]').remove();
  $('.code-block').remove();
  return $.html();
}
