import { htmlToMarkdown } from "@/server/editor/conversionUtils";

function unescapeHtmlAttribute(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function convertWidgetIframesToMarkdownFences(markdown: string): string {
  return markdown.replace(/<iframe[\s\S]*?<\/iframe>/g, (iframeHtml) => {
    if (!iframeHtml.includes("data-lexical-iframe-widget")) {
      return iframeHtml;
    }
    const idMatch = iframeHtml.match(/data-widget-id="([^"]*)"/);
    const widgetId = idMatch?.[1] ?? "";

    const srcdocStart = iframeHtml.indexOf('srcdoc="');
    if (srcdocStart < 0) {
      return iframeHtml;
    }
    const srcdocValueStart = srcdocStart + 'srcdoc="'.length;
    const srcdocValueEnd = iframeHtml.lastIndexOf('"></iframe>');
    if (srcdocValueEnd <= srcdocValueStart) {
      return iframeHtml;
    }
    const rawSrcdoc = iframeHtml.slice(srcdocValueStart, srcdocValueEnd);
    const srcdoc = unescapeHtmlAttribute(rawSrcdoc);
    return `\n\n\`\`\`widget[${widgetId}]\n${srcdoc}\n\`\`\`\n\n`;
  });
}

/**
 * Convert editor-exported HTML (from `$generateHtmlFromNodes`) into the
 * markdown the agent read API serves: Turndown conversion plus widget-iframe
 * fence rewriting. This is the canonical agent-visible projection of a
 * Lexical document; quotes sent to the agent write APIs are sliced from it.
 */
export function agentMarkdownFromEditorHtml(html: string): string {
  return convertWidgetIframesToMarkdownFences(htmlToMarkdown(html));
}

