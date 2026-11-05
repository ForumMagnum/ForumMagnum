import { randomId } from "@/lib/random";
import { getMarkdownItForAgentPosts } from "@/lib/utils/markdownItPlugins";
import { escapeHtml, sanitize } from "@/lib/utils/sanitize";

export function getLlmReplyHtml(modelName: string, markdown: string): string {
  // Models often write math as `\(...\)`, which only the agent dialect reads
  const markdownHtml = sanitize(getMarkdownItForAgentPosts().render(markdown, { docId: randomId() }));
  return `<div class="llm-content-block" data-model-name="${escapeHtml(modelName)}"><div class="llm-content-block-content">${markdownHtml}</div></div>`;
}
