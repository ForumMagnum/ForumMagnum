import { markdownToHtmlSimple } from "@/lib/editor/utils";
import { sanitize } from "@/lib/utils/sanitize";

export function markdownCommentToSafeHtml(markdown: string): string {
  return sanitize(markdownToHtmlSimple(markdown));
}
