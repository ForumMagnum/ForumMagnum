import MarkdownIt from 'markdown-it';

// html: false escapes any raw HTML in the model's output, so rendering the
// result with dangerouslySetInnerHTML is safe.
const markdownRenderer = new MarkdownIt({ html: false, linkify: true, breaks: true });

/** Renders agent-produced markdown (messages, proposal rationales) to safe HTML */
export function renderAgentMarkdown(markdown: string): string {
  return markdownRenderer.render(markdown);
}
