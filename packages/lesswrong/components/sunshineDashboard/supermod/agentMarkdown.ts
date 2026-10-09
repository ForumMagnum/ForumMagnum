import MarkdownIt from 'markdown-it';

// html: false escapes any raw HTML in the model's output, so rendering the
// result with dangerouslySetInnerHTML is safe.
const markdownRenderer = new MarkdownIt({ html: false, linkify: true, breaks: true });

export function renderAgentMarkdown(markdown: string): string {
  return markdownRenderer.render(markdown);
}
